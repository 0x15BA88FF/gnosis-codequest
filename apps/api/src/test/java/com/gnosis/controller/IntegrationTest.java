package com.gnosis.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gnosis.dto.*;
import com.gnosis.repository.*;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QueryService queryService;

    private String bearerToken;
    private UUID orgId;
    private UUID mindId;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("integration@example.com", "password123", "Integration User"))));

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("integration@example.com", "password123"))))
                .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(json).get("token").asText();
        bearerToken = "Bearer " + token;

        var orgResult = mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateOrgRequest("Integration Test Org"))))
                .andExpect(status().isCreated())
                .andReturn();

        String orgJson = orgResult.getResponse().getContentAsString();
        orgId = UUID.fromString(objectMapper.readTree(orgJson).get("id").asText());

        var mindResult = mockMvc.perform(post("/api/v1/organizations/{orgId}/minds", orgId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateMindRequest("Integration Mind", "Test", 1024))))
                .andExpect(status().isCreated())
                .andReturn();

        String mindJson = mindResult.getResponse().getContentAsString();
        mindId = UUID.fromString(objectMapper.readTree(mindJson).get("id").asText());
    }

    @Test
    void fullAuthFlow() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("newuser@example.com", "StrongPass1", "New User"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value(notNullValue()))
                .andExpect(jsonPath("$.email").value("newuser@example.com"));

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("newuser@example.com", "StrongPass1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(notNullValue()))
                .andReturn();

        String loginJson = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(loginJson).get("token").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@example.com"));
    }

    @Test
    void orgCrud() throws Exception {
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateOrgRequest("Second Org"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Second Org"));

        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void mindCrud() throws Exception {
        mockMvc.perform(get("/api/v1/organizations/{orgId}/minds", orgId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/v1/minds/{mindId}", mindId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Integration Mind"));

        mockMvc.perform(patch("/api/v1/minds/{mindId}", mindId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateMindRequest("Updated Mind", "Updated desc", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Mind"));

        mockMvc.perform(delete("/api/v1/minds/{mindId}", mindId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/minds/{mindId}", mindId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void mindMembers() throws Exception {
        mockMvc.perform(get("/api/v1/minds/{mindId}/members", mindId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].role").value("ADMIN"));
    }

    @Test
    void orgInviteFlow() throws Exception {
        // Register the invited user
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new RegisterRequest("invited-user@example.com", "password123", "Invited User"))));

        // Create org invite (not mind invite)
        mockMvc.perform(post("/api/v1/organizations/{orgId}/invites", orgId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new OrgInviteRequest("invited-user@example.com", "MEMBER"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inviteeEmail").value("invited-user@example.com"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        // Login as the invited user
        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("invited-user@example.com", "password123"))))
                .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        String invitedToken = "Bearer " + objectMapper.readTree(json).get("token").asText();

        // Check pending invites
        mockMvc.perform(get("/api/v1/invites/pending")
                        .header("Authorization", invitedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        var pendingResult = mockMvc.perform(get("/api/v1/invites/pending")
                        .header("Authorization", invitedToken))
                .andExpect(status().isOk())
                .andReturn();

        String pendingJson = pendingResult.getResponse().getContentAsString();
        String inviteToken = objectMapper.readTree(pendingJson).get(0).get("token").asText();

        // Accept the invite
        mockMvc.perform(post("/api/v1/invites/accept")
                        .header("Authorization", invitedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"" + inviteToken + "\"}"))
                .andExpect(status().isNoContent());

        // Verify user is now a member of the org
        mockMvc.perform(get("/api/v1/organizations/{orgId}", orgId)
                        .header("Authorization", invitedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Integration Test Org"));
    }

    @Test
    void orgInviteFlowDecline() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new RegisterRequest("decline-user@example.com", "password123", "Decline User"))));

        // Create org invite
        mockMvc.perform(post("/api/v1/organizations/{orgId}/invites", orgId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new OrgInviteRequest("decline-user@example.com", "MEMBER"))))
                .andExpect(status().isCreated());

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("decline-user@example.com", "password123"))))
                .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        String declineToken = "Bearer " + objectMapper.readTree(json).get("token").asText();

        var pendingResult = mockMvc.perform(get("/api/v1/invites/pending")
                        .header("Authorization", declineToken))
                .andExpect(status().isOk())
                .andReturn();

        String pendingJson = pendingResult.getResponse().getContentAsString();
        String inviteToken = objectMapper.readTree(pendingJson).get(0).get("token").asText();

        mockMvc.perform(post("/api/v1/invites/decline")
                        .header("Authorization", declineToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"" + inviteToken + "\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void queryFlow() throws Exception {
        var queryRequest = new QueryRequest("What is AI?", List.of(mindId), 5);
        var mockResponse = new QueryResponse("Artificial Intelligence is the simulation of human intelligence.",
                List.of(new Citation(UUID.randomUUID(), UUID.randomUUID(), "doc.txt", "content", 0.95)));

        when(queryService.query(any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/query")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(queryRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").exists())
                .andExpect(jsonPath("$.citations").isArray());
    }

    @Test
    void notificationsFlow() throws Exception {
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void unauthenticatedEndpointsReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/organizations"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/minds/{mindId}", mindId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicEndpointsAreAccessible() throws Exception {
        var loginRequest = new LoginRequest("integration@example.com", "password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}