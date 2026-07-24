package com.gnosis.service;

import com.gnosis.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    static final int BATCH_SIZE = 100;
    static final int MAX_RETRIES = 5;
    static final long BASE_DELAY_MS = 1000;

    private final RestClient geminiRestClient;

    public EmbeddingService(@Qualifier("geminiRestClient") RestClient geminiRestClient) {
        this.geminiRestClient = geminiRestClient;
    }

    public List<double[]> embed(List<String> texts) {
        List<double[]> allEmbeddings = new ArrayList<>();
        for (int i = 0; i < texts.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, texts.size());
            List<String> batch = texts.subList(i, end);
            allEmbeddings.addAll(embedBatch(batch));
        }
        return allEmbeddings;
    }

List<double[]> embedBatch(List<String> texts) {
        StringBuilder body = new StringBuilder("{\"requests\":[");
        for (int i = 0; i < texts.size(); i++) {
            if (i > 0) body.append(",");
            body.append("""
                    {"model":"models/gemini-embedding-001","content":{"parts":[{"text":"%s"}]},"outputDimensionality":768}
                    """.formatted(escapeJson(texts.get(i))));
        }
        body.append("]}");

        int retries = 0;
        long delay = BASE_DELAY_MS;
        while (true) {
            try {
                String response = geminiRestClient.post()
                        .uri("/models/gemini-embedding-001:batchEmbedContents")
                        .body(body.toString())
                        .retrieve()
                        .body(String.class);
                return parseEmbeddingResponse(response);
            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("429") && retries < MAX_RETRIES) {
                    retries++;
                    log.warn("Rate limited, retrying in {}ms (attempt {}/{})", delay, retries, MAX_RETRIES);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    delay *= 2;
                } else {
                    throw new BadRequestException("Embedding failed: " + e.getMessage());
                }
            }
        }
        return List.of();
    }

    String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    List<double[]> parseEmbeddingResponse(String response) {
        List<double[]> embeddings = new ArrayList<>();
        if (response == null || response.isEmpty()) return embeddings;

        int searchFrom = 0;
        while (true) {
            String key = "\"values\":[";
            int start = response.indexOf(key, searchFrom);
            if (start == -1) {
                key = "\"values\": [";
                start = response.indexOf(key, searchFrom);
                if (start == -1) break;
            }
            start += key.length();
            int end = response.indexOf("]", start);
            if (end == -1) break;

            String valuesStr = response.substring(start, end);
            String[] tokens = valuesStr.split(",");
            double[] values = new double[tokens.length];
            for (int i = 0; i < tokens.length; i++) {
                values[i] = Double.parseDouble(tokens[i].trim());
            }
            embeddings.add(values);
            searchFrom = end + 1;
        }
        return embeddings;
    }
}
