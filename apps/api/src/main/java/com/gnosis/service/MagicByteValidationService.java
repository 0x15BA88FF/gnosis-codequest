package com.gnosis.service;

import com.gnosis.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;

@Service
public class MagicByteValidationService {

    private static final Map<byte[], Set<String>> MAGIC_BYTES = Map.of(
            new byte[]{ (byte) 0x25, (byte) 0x50, (byte) 0x44, (byte) 0x46 }, Set.of("application/pdf"),
            new byte[]{ (byte) 0x50, (byte) 0x4B, (byte) 0x03, (byte) 0x04 }, Set.of(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/zip"),
            new byte[]{ (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }, Set.of("image/jpeg", "image/jpg"),
            new byte[]{ (byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47 }, Set.of("image/png"),
            new byte[]{ (byte) 0x47, (byte) 0x49, (byte) 0x46 }, Set.of("image/gif"),
            new byte[]{ (byte) 0x52, (byte) 0x49, (byte) 0x46, (byte) 0x46 }, Set.of("image/webp"),
            new byte[]{ (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x18, (byte) 0x66, (byte) 0x74, (byte) 0x79, (byte) 0x70 }, Set.of("video/mp4", "audio/mp4"),
            new byte[]{ (byte) 0x1A, (byte) 0x45, (byte) 0xDF, (byte) 0xA3 }, Set.of("video/webm", "audio/webm"),
            new byte[]{ (byte) 0x49, (byte) 0x44, (byte) 0x33 }, Set.of("audio/mpeg"),
            new byte[]{ (byte) 0xFF, (byte) 0xFB }, Set.of("audio/mpeg")
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "text/csv",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "audio/mpeg",
            "audio/mp4",
            "audio/webm",
            "video/webm"
    );

    public void validate(MultipartFile file) {
        String declaredType = file.getContentType();
        if (declaredType == null) {
            declaredType = "application/octet-stream";
        }

        if (!ALLOWED_MIME_TYPES.contains(declaredType)) {
            throw new BadRequestException("Unsupported file type: " + declaredType);
        }

        byte[] headerBytes = readHeader(file, 8);
        String detectedType = detectMagicBytes(headerBytes);

        if (detectedType != null && !isCompatible(declaredType, detectedType)) {
            throw new BadRequestException(
                    "File content does not match declared type. Declared: " + declaredType + ", detected: " + detectedType);
        }
    }

    private byte[] readHeader(MultipartFile file, int numBytes) {
        byte[] header = new byte[numBytes];
        try (InputStream is = file.getInputStream()) {
            int bytesRead = is.read(header);
            if (bytesRead < numBytes) {
                byte[] truncated = new byte[bytesRead];
                System.arraycopy(header, 0, truncated, 0, bytesRead);
                return truncated;
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read file header");
        }
        return header;
    }

    private String detectMagicBytes(byte[] header) {
        for (var entry : MAGIC_BYTES.entrySet()) {
            byte[] magic = entry.getKey();
            if (header.length >= magic.length) {
                byte[] headerPrefix = Arrays.copyOfRange(header, 0, magic.length);
                if (Arrays.equals(headerPrefix, magic)) {
                    return entry.getValue().iterator().next();
                }
            }
        }
        return null;
    }

    private boolean isCompatible(String declaredType, String detectedType) {
        if (declaredType.equals(detectedType)) return true;

        if (declaredType.startsWith("text/") && detectedType.startsWith("text/")) return true;

        Set<String> variants = MAGIC_BYTES.entrySet().stream()
                .filter(e -> e.getValue().contains(detectedType))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(Set.of());
        return variants.contains(declaredType);
    }
}
