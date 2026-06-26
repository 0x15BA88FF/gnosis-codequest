package com.gnosis.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmbeddingServiceTest {

    private final EmbeddingService embeddingService = new EmbeddingService(null);

    @Test
    void escapeJsonHandlesSpecialCharacters() {
        String result = embeddingService.escapeJson("hello \"world\"\nnew line\ttab");
        assertThat(result).isEqualTo("hello \\\"world\\\"\\nnew line\\ttab");
    }

    @Test
    void escapeJsonHandlesBackslashes() {
        String result = embeddingService.escapeJson("path\\to\\file");
        assertThat(result).isEqualTo("path\\\\to\\\\file");
    }

    @Test
    void escapeJsonPreservesNormalText() {
        String result = embeddingService.escapeJson("simple text");
        assertThat(result).isEqualTo("simple text");
    }

    @Test
    void parseEmbeddingResponseWithSingleEmbedding() {
        String response = """
                {"predictions":[{"embeddings":[{"statistics":{},"values":[0.1,0.2,0.3]}]}]}
                """.replace("embeddings", "embedding");
        // Use the actual response format from Gemini
        String geminiResponse = """
                {"predictions":[{"embeddings":[{"statistics":{},"values":[0.1,0.2,0.3]}]}]}
                """.replace("embeddings", "embedding")
                .replace("predictions", "predictions");  // keep as-is

        // Actually test with the format our parser expects
        String realFormat = """
                {"embedding":{"values":[0.1,0.2,0.3]}}
                """;
        List<double[]> embeddings = embeddingService.parseEmbeddingResponse(realFormat);
        assertThat(embeddings).hasSize(1);
        assertThat(embeddings.get(0)).containsExactly(0.1, 0.2, 0.3);
    }

    @Test
    void parseEmbeddingResponseWithMultipleEmbeddings() {
        String response = """
                {"embedding":{"values":[0.1,0.2]}}
                {"embedding":{"values":[0.3,0.4]}}
                """;
        List<double[]> embeddings = embeddingService.parseEmbeddingResponse(response);
        assertThat(embeddings).hasSize(2);
        assertThat(embeddings.get(0)).containsExactly(0.1, 0.2);
        assertThat(embeddings.get(1)).containsExactly(0.3, 0.4);
    }

    @Test
    void parseEmbeddingResponseHandlesNull() {
        assertThat(embeddingService.parseEmbeddingResponse(null)).isEmpty();
    }

    @Test
    void parseEmbeddingResponseHandlesEmpty() {
        assertThat(embeddingService.parseEmbeddingResponse("")).isEmpty();
    }

    @Test
    void parseEmbeddingResponseHandlesNoMatch() {
        assertThat(embeddingService.parseEmbeddingResponse("{}")).isEmpty();
    }

    @Test
    void batchSizeConstantIsSet() {
        assertThat(EmbeddingService.BATCH_SIZE).isEqualTo(100);
    }

    @Test
    void embedWithEmptyListReturnsEmpty() {
        // embed() with 0 texts should not call the API (no batches to process)
        List<double[]> result = embeddingService.embed(List.of());
        assertThat(result).isEmpty();
    }
}
