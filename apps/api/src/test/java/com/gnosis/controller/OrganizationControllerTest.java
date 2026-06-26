package com.gnosis.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gnosis.domain.User;
import com.gnosis.dto.CreateOrgRequest;
import com.gnosis.dto.LoginRequest;
import com.gnosis.dto.RegisterRequest;
import com.gnosis.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrganizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private String bearerToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new RegisterRequest("org-user@example.com", "password123", "Org User"))));

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("org-user@example.com", "password123"))))
                .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(json).get("token").asText();
        bearerToken = "Bearer " + token;
    }

    @Test
    void createOrganization() throws Exception {
        CreateOrgRequest request = new CreateOrgRequest("My Organization");
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.name").value("My Organization"));
    }

    @Test
    void listOrganizations() throws Exception {
        mockMvc.perform(post("/api/v1/organizations")
                .header("Authorization", bearerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateOrgRequest("Org A"))));
        mockMvc.perform(post("/api/v1/organizations")
                .header("Authorization", bearerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateOrgRequest("Org B"))));

        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void createOrganizationWithoutAuthReturns401() throws Exception {
        CreateOrgRequest request = new CreateOrgRequest("Hacked Org");
        mockMvc.perform(post("/api/v1/organizations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
