package com.gnosis.dto;

import java.util.List;

public record QueryResponse(
        String answer,
        List<Citation> citations
) {
}
