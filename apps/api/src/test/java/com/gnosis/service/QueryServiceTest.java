package com.gnosis.service;

import com.gnosis.domain.Chunk;
import com.gnosis.domain.Document;
import com.gnosis.domain.Mind;
import com.gnosis.domain.User;
import com.gnosis.dto.Citation;
import com.gnosis.dto.QueryRequest;
import com.gnosis.dto.QueryResponse;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.ChunkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QueryServiceTest {

    @Mock private ChunkRepository chunkRepository;
    @Mock private EmbeddingService embeddingService;
    @Mock private MindSecurityService mindSecurityService;
    @Mock private RestClient geminiRestClient;
    @Mock private RestClient.RequestBodyUriSpec postSpec;
    @Mock private RestClient.RequestBodySpec bodySpec;
    @Mock private RestClient.ResponseSpec responseSpec;

    private QueryService queryService;
    private UUID mindId;
    private UUID docId;
    private UUID chunkId;
    private Chunk chunk;

    @BeforeEach
    void setUp() {
        queryService = new QueryService(chunkRepository, embeddingService, mindSecurityService, geminiRestClient);

        mindId = UUID.randomUUID();
        docId = UUID.randomUUID();
        chunkId = UUID.randomUUID();

        User user = new User("test@example.com", "hash", "Test");
        Mind mind = new Mind();
        mind.setId(mindId);

        Document doc = new Document();
        doc.setId(docId);
        doc.setMind(mind);
        doc.setUploadedBy(user);
        doc.setFileName("test.txt");

        chunk = new Chunk(doc, mind, "Test content about AI and machine learning.", 0);
        chunk.setId(chunkId);
    }

    @Test
    void queryReturnsAnswerAndCitations() {
        QueryRequest request = new QueryRequest("What is AI?", List.of(mindId), 5);

        when(mindSecurityService.isMindMember(mindId)).thenReturn(true);
        when(embeddingService.embed(List.of("What is AI?"))).thenReturn(List.of(new double[]{0.1, 0.2, 0.3}));
        when(chunkRepository.findSimilarChunkIds(List.of(mindId), "[0.1,0.2,0.3]", 5))
                .thenReturn(List.<Object[]>of(new Object[]{chunkId, 0.95}));
        when(chunkRepository.findById(chunkId)).thenReturn(Optional.of(chunk));

        when(geminiRestClient.post()).thenReturn(postSpec);
        when(postSpec.uri("/models/gemini-2.0-flash:generateContent")).thenReturn(bodySpec);
        when(bodySpec.body(anyString())).thenReturn(postSpec);
        when(postSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(String.class)).thenReturn("{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"AI stands for Artificial Intelligence.\"}]}}]}");

        QueryResponse response = queryService.query(request);

        assertThat(response.answer()).isEqualTo("AI stands for Artificial Intelligence.");
        assertThat(response.citations()).hasSize(1);
        Citation citation = response.citations().getFirst();
        assertThat(citation.chunkId()).isEqualTo(chunkId);
        assertThat(citation.documentId()).isEqualTo(docId);
        assertThat(citation.score()).isEqualTo(0.95);
    }

    @Test
    void queryWithNoResultsReturnsEmptyResponse() {
        QueryRequest request = new QueryRequest("Unknown topic", List.of(mindId), 5);

        when(mindSecurityService.isMindMember(mindId)).thenReturn(true);
        when(embeddingService.embed(List.of("Unknown topic"))).thenReturn(List.of(new double[]{0.1, 0.2}));
        when(chunkRepository.findSimilarChunkIds(List.of(mindId), "[0.1,0.2]", 5))
                .thenReturn(List.<Object[]>of());

        QueryResponse response = queryService.query(request);

        assertThat(response.answer()).contains("No relevant content found");
        assertThat(response.citations()).isEmpty();
    }

    @Test
    void queryThrowsWhenMindAccessDenied() {
        QueryRequest request = new QueryRequest("test", List.of(mindId), 5);

        when(mindSecurityService.isMindMember(mindId)).thenReturn(false);

        assertThatThrownBy(() -> queryService.query(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void queryThrowsWhenEmbeddingFails() {
        QueryRequest request = new QueryRequest("test", List.of(mindId), 5);

        when(mindSecurityService.isMindMember(mindId)).thenReturn(true);
        when(embeddingService.embed(List.of("test"))).thenReturn(List.of());

        assertThatThrownBy(() -> queryService.query(request))
                .isInstanceOf(com.gnosis.exception.BadRequestException.class);
    }

    @Test
    void queryDefaultsTopKToTen() {
        QueryRequest request = new QueryRequest("test", List.of(mindId), null);
        assertThat(request.getTopK()).isEqualTo(10);
    }

    @Test
    void queryCapsTopKAtTwenty() {
        QueryRequest request = new QueryRequest("test", List.of(mindId), 100);
        assertThat(request.getTopK()).isEqualTo(20);
    }
}
