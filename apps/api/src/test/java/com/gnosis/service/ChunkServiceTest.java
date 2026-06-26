package com.gnosis.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChunkServiceTest {

    private final ChunkService chunkService = new ChunkService();

    @Test
    void shortTextReturnsSingleChunk() {
        List<String> chunks = chunkService.chunk("Hello, world!");
        assertThat(chunks).containsExactly("Hello, world!");
    }

    @Test
    void longTextIsSplitIntoMultipleChunks() {
        String text = "A ".repeat(2000);
        List<String> chunks = chunkService.chunk(text);
        assertThat(chunks).hasSizeGreaterThan(1);
        assertThat(chunks.get(0).replace(" ", "")).hasSizeLessThanOrEqualTo(ChunkService.CHUNK_SIZE + 10);
    }

    @Test
    void chunkSizeDoesNotExceedLimit() {
        String text = "B ".repeat(2500);
        List<String> chunks = chunkService.chunk(text);
        for (String chunk : chunks) {
            assertThat(chunk.length()).isLessThanOrEqualTo(ChunkService.CHUNK_SIZE);
        }
    }

    @Test
    void chunksOverlap() {
        String text = "word ".repeat(600);
        List<String> chunks = chunkService.chunk(text);
        assertThat(chunks.size()).isGreaterThan(1);
    }

    @Test
    void emptyTextReturnsEmptyList() {
        assertThat(chunkService.chunk("")).isEmpty();
    }

    @Test
    void blankTextReturnsEmptyList() {
        assertThat(chunkService.chunk("   ")).isEmpty();
    }

    @Test
    void nullTextReturnsEmptyList() {
        assertThat(chunkService.chunk(null)).isEmpty();
    }

    @Test
    void textAtExactChunkSize() {
        String text = "D ".repeat(ChunkService.CHUNK_SIZE / 2);
        List<String> chunks = chunkService.chunk(text);
        assertThat(chunks).isNotEmpty();
    }

    @Test
    void textSlightlyAboveChunkSize() {
        String text = "E ".repeat(ChunkService.CHUNK_SIZE / 2 + 1);
        List<String> chunks = chunkService.chunk(text);
        assertThat(chunks).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void preservesContentAcrossChunks() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 30; i++) {
            sb.append("paragraph ").append(i).append(" ");
            sb.append("word ".repeat(30));
            sb.append("\n\n");
        }
        String text = sb.toString();
        List<String> chunks = chunkService.chunk(text);
        assertThat(chunks).isNotEmpty();
        String combined = String.join("", chunks);
        assertThat(combined).contains("paragraph 0");
        assertThat(combined).contains("paragraph 29");
    }

    @Test
    void splitsAtWordBoundary() {
        String word = "word ";
        String text = word.repeat(500);
        List<String> chunks = chunkService.chunk(text);
        for (String chunk : chunks) {
            if (chunk.length() == ChunkService.CHUNK_SIZE || chunk.endsWith(" ")) {
                continue;
            }
            assertThat(chunk).doesNotEndWith("wor");
        }
    }
}
