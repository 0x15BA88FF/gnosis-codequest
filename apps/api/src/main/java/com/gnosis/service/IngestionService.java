package com.gnosis.service;

import com.gnosis.domain.Chunk;
import com.gnosis.domain.Document;
import com.gnosis.repository.ChunkRepository;
import com.gnosis.repository.DocumentRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class IngestionService {

    private static final Logger log = LoggerFactory.getLogger(IngestionService.class);

    private final DocumentRepository documentRepository;
    private final ChunkRepository chunkRepository;
    private final FileStorageService fileStorageService;
    private final ExtractionService extractionService;
    private final ChunkService chunkService;
    private final EmbeddingService embeddingService;
    private final NotificationService notificationService;
    private final EntityManager entityManager;

    public IngestionService(DocumentRepository documentRepository,
                            ChunkRepository chunkRepository,
                            FileStorageService fileStorageService,
                            ExtractionService extractionService,
                            ChunkService chunkService,
                            EmbeddingService embeddingService,
                            NotificationService notificationService,
                            EntityManager entityManager) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.fileStorageService = fileStorageService;
        this.extractionService = extractionService;
        this.chunkService = chunkService;
        this.embeddingService = embeddingService;
        this.notificationService = notificationService;
        this.entityManager = entityManager;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.warn("Document {} not found for ingestion", documentId);
            return;
        }
        doProcessDocument(document);
    }

    private void doProcessDocument(Document document) {
        document.setProcessingStatus("PROCESSING");
        document = documentRepository.save(document);

        try {
            var inputStream = fileStorageService.download(document.getR2Key());
            String extractedText = extractionService.extract(document, inputStream);

            List<String> chunkTexts = chunkService.chunk(extractedText);
            if (chunkTexts.isEmpty()) {
                document.setProcessingStatus("READY");
                documentRepository.save(document);
                triggerReadyNotification(document);
                return;
            }

            List<double[]> embeddings = embeddingService.embed(chunkTexts);

            List<Chunk> savedChunks = new ArrayList<>();
            for (int i = 0; i < chunkTexts.size(); i++) {
                Chunk chunk = new Chunk(document, document.getMind(), chunkTexts.get(i), i);
                chunk.setTokenCount(chunkTexts.get(i).length());
                savedChunks.add(chunkRepository.save(chunk));
            }

            persistEmbeddings(savedChunks, embeddings);

            document.setProcessingStatus("READY");
            documentRepository.save(document);
            triggerReadyNotification(document);
        } catch (Exception e) {
            log.error("Ingestion failed for document {}: {}", document.getId(), e.getMessage(), e);
            try {
                entityManager.clear();
                Document failed = documentRepository.findById(document.getId()).orElse(null);
                if (failed != null) {
                    failed.setProcessingStatus("FAILED");
                    failed.setErrorMessage(e.getMessage());
                    documentRepository.save(failed);
                }
            } catch (Exception ex) {
                log.error("Failed to mark document {} as FAILED: {}", document.getId(), ex.getMessage());
            }
        }
    }

    private void persistEmbeddings(List<Chunk> chunks, List<double[]> embeddings) {
        int limit = Math.min(chunks.size(), embeddings.size());
        for (int i = 0; i < limit; i++) {
            try {
                String vectorLiteral = toVectorLiteral(embeddings.get(i));
                entityManager.createNativeQuery(
                        "UPDATE chunks SET embedding = ?::vector WHERE id = ?")
                        .setParameter(1, vectorLiteral)
                        .setParameter(2, chunks.get(i).getId())
                        .executeUpdate();
            } catch (Exception e) {
                log.warn("Failed to persist embedding for chunk {}: {}",
                        chunks.get(i).getId(), e.getMessage());
            }
        }
    }

    private String toVectorLiteral(double[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(values[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    private void triggerReadyNotification(Document document) {
        try {
            notificationService.create(
                    document.getUploadedBy(),
                    "DOCUMENT_READY",
                    "Document processed",
                    "\"%s\" is ready for querying.".formatted(document.getFileName()),
                    null);
        } catch (Exception e) {
            log.warn("Failed to send notification for document {}: {}", document.getId(), e.getMessage());
        }
    }
}
