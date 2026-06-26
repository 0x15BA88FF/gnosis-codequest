package com.gnosis.service;

import com.gnosis.domain.Document;
import com.gnosis.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Service
public class ExtractionService {

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024;

    private final RestClient geminiRestClient;

    public ExtractionService(@Qualifier("geminiRestClient") RestClient geminiRestClient) {
        this.geminiRestClient = geminiRestClient;
    }

    public String extract(Document document, InputStream inputStream) {
        String mediaType = document.getMediaType();
        try {
            return switch (mediaType) {
                case "application/pdf" -> extractFromPdf(inputStream);
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ->
                        extractFromDocx(inputStream);
                case "text/plain", "text/markdown", "text/csv", "text/html", "application/json" ->
                        extractFromText(inputStream);
                default -> extractViaGemini(mediaType, inputStream);
            };
        } catch (Exception e) {
            throw new BadRequestException("Text extraction failed: " + e.getMessage());
        }
    }

    String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    String extractFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument docx = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(docx)) {
            return extractor.getText();
        }
    }

    String extractFromText(InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes());
    }

    String extractViaGemini(String mediaType, InputStream inputStream) throws IOException {
        byte[] fileBytes = inputStream.readAllBytes();
        if (fileBytes.length > MAX_FILE_SIZE) {
            throw new BadRequestException(
                    "File too large for Gemini extraction: " + fileBytes.length + " bytes");
        }
        String base64 = Base64.getEncoder().encodeToString(fileBytes);
        String requestBody = """
                {"contents":[{"parts":[{"inline_data":{"mimeType":"%s","data":"%s"}},{"text":"Extract all text content from this file. Return only the extracted text, no commentary."}]}]}
                """.formatted(mediaType, base64);

        String response = geminiRestClient.post()
                .uri("/models/gemini-2.0-flash:generateContent")
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseGeminiResponse(response);
    }

    private String parseGeminiResponse(String response) {
        if (response == null || response.isBlank()) return "";
        String key = "\"text\":\"";
        int textStart = response.indexOf(key);
        if (textStart == -1) {
            key = "\"text\": \"";
            textStart = response.indexOf(key);
            if (textStart == -1) return "";
        }
        textStart += key.length();
        int textEnd = response.indexOf("\"", textStart);
        if (textEnd == -1) return response.substring(textStart);
        return response.substring(textStart, textEnd)
                .replace("\\n", "\n")
                .replace("\\t", "\t")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
    }
}
