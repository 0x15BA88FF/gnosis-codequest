package com.gnosis.controller;

import com.gnosis.domain.Document;
import com.gnosis.domain.Mind;
import com.gnosis.domain.User;
import com.gnosis.dto.DocumentResponse;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.DocumentRepository;
import com.gnosis.repository.MindRepository;
import com.gnosis.repository.UserRepository;
import com.gnosis.service.FileStorageService;
import com.gnosis.service.IngestionService;
import com.gnosis.service.MagicByteValidationService;
import com.gnosis.service.MindSecurityService;
import com.gnosis.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final MindRepository mindRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final MindSecurityService mindSecurityService;
    private final IngestionService ingestionService;
    private final MagicByteValidationService magicByteValidationService;
    private final long maxFileSizeBytes;

    public DocumentController(DocumentRepository documentRepository,
                              MindRepository mindRepository,
                              UserRepository userRepository,
                              FileStorageService fileStorageService,
                              MindSecurityService mindSecurityService,
                              IngestionService ingestionService,
                              MagicByteValidationService magicByteValidationService,
                              @Value("${upload.max-file-size-mb}") int maxFileSizeMb) {
        this.documentRepository = documentRepository;
        this.mindRepository = mindRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.mindSecurityService = mindSecurityService;
        this.ingestionService = ingestionService;
        this.magicByteValidationService = magicByteValidationService;
        this.maxFileSizeBytes = maxFileSizeMb * 1024L * 1024L;
    }

    @PostMapping(value = "/minds/{mindId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> upload(@PathVariable UUID mindId,
                                                    @RequestParam("file") MultipartFile file) {
        System.out.println("DocumentController.upload called with mindId=" + mindId + ", file=" + file.getOriginalFilename());
        boolean hasRole = mindSecurityService.hasMindRole(mindId, "READ_WRITE");
        System.out.println("hasMindRole(READ_WRITE)=" + hasRole);
        if (!hasRole) {
            System.out.println("Throwing ResourceNotFoundException");
            throw new ResourceNotFoundException("Mind", mindId);
        }

        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
        User user = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new BadRequestException("File exceeds maximum upload size of " + (maxFileSizeBytes / (1024 * 1024)) + "MB");
        }

        long currentUsageBytes = documentRepository.sumFileSizeByMindId(mindId);
        long quotaBytes = mind.getStorageQuotaMb() * 1024L * 1024L;
        if (currentUsageBytes + file.getSize() > quotaBytes) {
            throw new BadRequestException("Upload would exceed Mind storage quota of " + mind.getStorageQuotaMb() + "MB");
        }

        magicByteValidationService.validate(file);

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(user);
        doc.setFileName(file.getOriginalFilename());
        doc.setMediaType(file.getContentType());
        doc.setFileSizeBytes(file.getSize());
        doc.setProcessingStatus("PENDING");
        doc = documentRepository.save(doc);

        try {
            System.out.println("Uploading to R2...");
            String r2Key = fileStorageService.upload(mindId, doc.getId(),
                    file.getOriginalFilename(), file.getInputStream(),
                    file.getSize(), file.getContentType());
            System.out.println("R2 upload returned: " + r2Key);
            doc.setR2Key(r2Key);
        } catch (Exception e) {
            System.err.println("R2 upload failed: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            doc.setProcessingStatus("FAILED");
            doc.setErrorMessage("Upload failed: " + e.getMessage());
        }
        doc = documentRepository.save(doc);

        if ("PENDING".equals(doc.getProcessingStatus())) {
            final UUID docId = doc.getId();
            try {
                ingestionService.processDocument(docId);
            } catch (Exception e) {
                System.err.println("Ingestion failed for document " + docId + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok(DocumentResponse.from(doc));
    }

    @GetMapping("/minds/{mindId}/documents")
    public ResponseEntity<List<DocumentResponse>> listByMind(@PathVariable UUID mindId) {
        if (!mindSecurityService.isMindMember(mindId)) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        List<DocumentResponse> docs = documentRepository.findByMindId(mindId).stream()
                .filter(d -> d.getDeletedAt() == null)
                .map(DocumentResponse::from)
                .toList();
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/documents/{docId}")
    public ResponseEntity<DocumentResponse> get(@PathVariable UUID docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", docId));
        if (doc.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Document", docId);
        }
        if (!mindSecurityService.isMindMember(doc.getMind().getId())) {
            throw new ResourceNotFoundException("Document", docId);
        }
        return ResponseEntity.ok(DocumentResponse.from(doc));
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<Void> softDelete(@PathVariable UUID docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", docId));
        if (!mindSecurityService.hasMindRole(doc.getMind().getId(), "ADMIN")) {
            throw new ResourceNotFoundException("Document", docId);
        }
        doc.setDeletedAt(Instant.now());
        documentRepository.save(doc);
        return ResponseEntity.noContent().build();
    }
}
