package com.gnosis.repository;

import com.gnosis.domain.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ChunkRepositoryTest {

    @Autowired
    private ChunkRepository chunkRepository;

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
        User user = userRepository.save(new User("oscar@example.com", "hash", "Oscar"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(user);
        doc.setFileName("doc.txt");
        doc.setR2Key("key");
        doc.setMediaType("text/plain");
        doc.setFileSizeBytes(100);
        doc = documentRepository.save(doc);

        Chunk chunk = new Chunk(doc, mind, "This is the content", 0);
        chunk = chunkRepository.save(chunk);

        assertThat(chunk.getId()).isNotNull();
        assertThat(chunk.getContent()).isEqualTo("This is the content");
        assertThat(chunk.getChunkIndex()).isZero();
    }

    @Test
    void findByDocumentIdReturnsOrderedChunks() {
        User user = userRepository.save(new User("order@example.com", "hash", "Order"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(user);
        doc.setFileName("doc.txt");
        doc.setR2Key("key");
        doc.setMediaType("text/plain");
        doc.setFileSizeBytes(100);
        doc = documentRepository.save(doc);

        chunkRepository.save(new Chunk(doc, mind, "Third", 2));
        chunkRepository.save(new Chunk(doc, mind, "First", 0));
        chunkRepository.save(new Chunk(doc, mind, "Second", 1));

        var chunks = chunkRepository.findByDocumentIdOrderByChunkIndex(doc.getId());
        assertThat(chunks).hasSize(3);
        assertThat(chunks.get(0).getContent()).isEqualTo("First");
        assertThat(chunks.get(1).getContent()).isEqualTo("Second");
        assertThat(chunks.get(2).getContent()).isEqualTo("Third");
    }

    @Test
    void deleteByDocumentIdRemovesAllChunks() {
        User user = userRepository.save(new User("delete@example.com", "hash", "Delete"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));

        Document doc = new Document();
        doc.setMind(mind);
        doc.setUploadedBy(user);
        doc.setFileName("doc.txt");
        doc.setR2Key("key");
        doc.setMediaType("text/plain");
        doc.setFileSizeBytes(100);
        doc = documentRepository.save(doc);

        chunkRepository.save(new Chunk(doc, mind, "Chunk 1", 0));
        chunkRepository.save(new Chunk(doc, mind, "Chunk 2", 1));

        chunkRepository.deleteByDocumentId(doc.getId());

        assertThat(chunkRepository.findByDocumentIdOrderByChunkIndex(doc.getId())).isEmpty();
    }
}
