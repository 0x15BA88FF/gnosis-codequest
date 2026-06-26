package com.gnosis.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChunkService {

    static final int CHUNK_SIZE = 1800;
    static final int CHUNK_OVERLAP = 180;

    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) return List.of();

        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + CHUNK_SIZE, text.length());
            if (end < text.length()) {
                int breakAt = lastBreakBefore(text, end);
                if (breakAt > start) {
                    end = breakAt;
                }
            }
            chunks.add(text.substring(start, end).trim());
            if (end >= text.length()) break;
            start = end - CHUNK_OVERLAP;
        }
        return chunks;
    }

    private int lastBreakBefore(String text, int end) {
        int lastNewline = text.lastIndexOf('\n', end - 1);
        if (lastNewline > end - CHUNK_OVERLAP) return lastNewline + 1;
        int lastSpace = text.lastIndexOf(' ', end - 1);
        if (lastSpace > end - CHUNK_OVERLAP) return lastSpace + 1;
        return end;
    }
}
