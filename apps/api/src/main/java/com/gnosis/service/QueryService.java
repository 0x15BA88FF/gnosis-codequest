package com.gnosis.service;

import com.gnosis.domain.Chunk;
import com.gnosis.dto.Citation;
import com.gnosis.dto.QueryRequest;
import com.gnosis.dto.QueryResponse;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.ChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class QueryService {

    private static final Logger log = LoggerFactory.getLogger(QueryService.class);

    private final ChunkRepository chunkRepository;
    private final EmbeddingService embeddingService;
    private final MindSecurityService mindSecurityService;
    private final RestClient geminiRestClient;

    public QueryService(ChunkRepository chunkRepository,
                        EmbeddingService embeddingService,
                        MindSecurityService mindSecurityService,
                        @Qualifier("geminiRestClient") RestClient geminiRestClient) {
        this.chunkRepository = chunkRepository;
        this.embeddingService = embeddingService;
        this.mindSecurityService = mindSecurityService;
        this.geminiRestClient = geminiRestClient;
    }

    @Transactional(readOnly = true)
    public QueryResponse query(QueryRequest request) {
        for (UUID mindId : request.mindIds()) {
            if (!mindSecurityService.isMindMember(mindId)) {
                throw new ResourceNotFoundException("Mind", mindId);
            }
        }

        List<double[]> embeddings = embeddingService.embed(List.of(request.query()));
        if (embeddings.isEmpty()) {
            throw new BadRequestException("Failed to generate query embedding");
        }
        String vectorLiteral = toVectorLiteral(embeddings.getFirst());

        List<Object[]> rows = chunkRepository.findSimilarChunkIds(
                request.mindIds(), vectorLiteral, request.getTopK());

        if (rows.isEmpty()) {
            return new QueryResponse("No relevant content found in the selected knowledge bases.", List.of());
        }

        List<Chunk> chunks = new ArrayList<>();
        List<Double> scores = new ArrayList<>();
        for (Object[] row : rows) {
            UUID chunkId = (UUID) row[0];
            double score = ((Number) row[1]).doubleValue();
            chunks.add(chunkRepository.findById(chunkId)
                    .orElseThrow(() -> new ResourceNotFoundException("Chunk", chunkId)));
            scores.add(score);
        }

        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            Chunk chunk = chunks.get(i);
            contextBuilder.append("--- Chunk ").append(i + 1).append(" ---\n");
            contextBuilder.append(chunk.getContent()).append("\n\n");
        }

        String prompt = """
                You are a precise knowledge base assistant. Answer the user's question based SOLELY on the provided context.
                If the context does not contain enough information to answer, say so clearly.
                Cite specific chunks by number (e.g., [1], [2]) when referencing information.

                Context:
                %s

                Question: %s
                """.formatted(contextBuilder.toString().trim(), request.query());

        String answer = callGemini(prompt);

        List<Citation> citations = buildCitations(chunks, scores);

        return new QueryResponse(answer, citations);
    }

    private String callGemini(String prompt) {
        String requestBody = """
                {"contents":[{"parts":[{"text":"%s"}]}]}
                """.formatted(escapeJson(prompt));

        try {
            String response = geminiRestClient.post()
                    .uri("/models/gemini-2.0-flash:generateContent")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
            return parseGeminiResponse(response);
        } catch (Exception e) {
            log.error("Gemini query failed: {}", e.getMessage());
            throw new BadRequestException("Failed to generate answer: " + e.getMessage());
        }
    }

    private List<Citation> buildCitations(List<Chunk> chunks, List<Double> scores) {
        List<Citation> citations = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            Chunk chunk = chunks.get(i);
            citations.add(new Citation(
                    chunk.getId(),
                    chunk.getDocument().getId(),
                    chunk.getDocument().getFileName(),
                    chunk.getContent(),
                    scores.get(i)
            ));
        }
        return citations;
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

    private String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
