package com.gnosis.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gnosis.dto.Citation;
import com.gnosis.dto.QueryRequest;
import com.gnosis.dto.QueryResponse;
import com.gnosis.service.QueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QueryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QueryService queryService;

    private String bearerToken;

    @BeforeEach
    void setUp() throws Exception {
        var registerResponse = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new com.gnosis.dto.RegisterRequest("query-test@example.com", "password123", "Query User"))))
                .andReturn();

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new com.gnosis.dto.LoginRequest("query-test@example.com", "password123"))))
                .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(json).get("token").asText();
        bearerToken = "Bearer " + token;
    }

    @Test
    void queryEndpointReturnsResponse() throws Exception {
        UUID mindId = UUID.randomUUID();
        UUID chunkId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        List<Citation> citations = List.of(new Citation(chunkId, docId, "test.txt", "content", 0.95));
        QueryResponse mockResponse = new QueryResponse("AI stands for Artificial Intelligence.", citations);

        when(queryService.query(any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/query")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new QueryRequest("What is AI?", List.of(mindId), 5))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("AI stands for Artificial Intelligence."))
                .andExpect(jsonPath("$.citations[0].chunkId").value(chunkId.toString()))
                .andExpect(jsonPath("$.citations[0].score").value(0.95));
    }

    @Test
    void queryEndpointReturns401WithoutAuth() throws Exception {
        mockMvc.perform(post("/api/v1/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new QueryRequest("test", List.of(UUID.randomUUID()), 5))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void queryEndpointValidatesRequest() throws Exception {
        mockMvc.perform(post("/api/v1/query")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\": \"\", \"mindIds\": []}"))
                .andExpect(status().isBadRequest());
    }
}
