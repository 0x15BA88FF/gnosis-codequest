package com.gnosis.service;

import com.gnosis.domain.Document;
import com.gnosis.domain.Mind;
import com.gnosis.domain.Organization;
import com.gnosis.domain.User;
import com.gnosis.repository.DocumentRepository;
import com.gnosis.repository.MindRepository;
import com.gnosis.repository.OrganizationRepository;
import com.gnosis.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class IngestionServiceTest {

    @Autowired
    private IngestionService ingestionService;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private MindRepository mindRepository;

    private User createUser(String email) {
        return userRepository.save(new User(email, "hash", email.split("@")[0]));
    }

    @Test
    void processDocumentTransitionsToFailedWhenR2Unavailable() {
        User owner = createUser("ingestion-test@example.com");
        Organization org = organizationRepository.save(new Organization("Ingestion Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Test Mind", owner));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(owner);
        doc.setFileName("test.txt");
        doc.setMediaType("text/plain");
        doc.setFileSizeBytes(100);
        doc.setR2Key("minds/" + mind.getId() + "/docs/" + UUID.randomUUID() + "/test.txt");
        doc.setProcessingStatus("PENDING");
        doc = documentRepository.save(doc);

        ingestionService.processDocument(doc.getId());

        Document updated = documentRepository.findById(doc.getId()).orElseThrow();
        assertThat(updated.getProcessingStatus()).isEqualTo("FAILED");
        assertThat(updated.getErrorMessage()).isNotNull();
    }

    @Test
    void processDocumentByIdTransitionsToFailedWhenR2Unavailable() {
        User owner = createUser("ingestion-by-id@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Mind", owner));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(owner);
        doc.setFileName("test.txt");
        doc.setMediaType("text/plain");
        doc.setFileSizeBytes(50);
        doc.setR2Key("nonexistent-key");
        doc.setProcessingStatus("PENDING");
        doc = documentRepository.save(doc);

        ingestionService.processDocument(doc.getId());

        Document updated = documentRepository.findById(doc.getId()).orElseThrow();
        assertThat(updated.getProcessingStatus()).isEqualTo("FAILED");
        assertThat(updated.getErrorMessage()).isNotNull();
    }

    @Test
    void processDocumentDoesNothingForUnknownId() {
        ingestionService.processDocument(UUID.randomUUID());
    }

    @Test
    void processDocumentCapturesErrorMessage() {
        User owner = createUser("error-capture@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Mind", owner));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(owner);
        doc.setFileName("broken.pdf");
        doc.setMediaType("application/pdf");
        doc.setFileSizeBytes(10);
        doc.setR2Key("minds/" + mind.getId() + "/docs/invalid/test.pdf");
        doc.setProcessingStatus("PENDING");
        doc = documentRepository.save(doc);

        ingestionService.processDocument(doc.getId());

        Document updated = documentRepository.findById(doc.getId()).orElseThrow();
        assertThat(updated.getProcessingStatus()).isEqualTo("FAILED");
        assertThat(updated.getErrorMessage()).isNotNull().isNotEmpty();
    }
}
