package com.gnosis.repository;

import com.gnosis.domain.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DocumentRepositoryTest {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private MindRepository mindRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFind() {
        User user = userRepository.save(new User("nick@example.com", "hash", "Nick"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(user);
        doc.setFileName("report.pdf");
        doc.setR2Key("minds/" + mind.getId() + "/docs/doc-id/report.pdf");
        doc.setMediaType("application/pdf");
        doc.setFileSizeBytes(1024000);
        doc = documentRepository.save(doc);

        assertThat(doc.getId()).isNotNull();
        assertThat(doc.getProcessingStatus()).isEqualTo("PENDING");
        assertThat(doc.getDeletedAt()).isNull();
    }
}
