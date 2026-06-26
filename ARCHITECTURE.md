# Gnosis — Architecture

## Overview

Gnosis is a full-stack knowledge management platform. Users organize knowledge into **Minds** (shared workspaces), upload multi-modal documents that are ingested, chunked, and vector-embedded, then query across them using a RAG pipeline powered by Google Gemini.

```
┌─────────────────────────────────────────────────────┐
│                   Mobile Client                     │
│              Expo (React Native)                    │
└──────────┬──────────────────────────────────────────┘
           │ HTTPS (REST + JSON)
┌──────────▼──────────────────────────────────────────┐
│              Spring Boot API (Java 21)              │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐ │
│  │ Auth │ Org  │ Mind │ Doc  │Query │ Notif│ Sys  │ │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘ │
│  │ JWT Filter │ SecurityService │ Rate Limiting     │
└─────┬─────┬─────┬───────────────────────────────────┘
      │     │     │
      │     │     └──► FastMCP (TypeScript) — search_knowledge
      │     │
      │     └────────► Cloudflare R2 — File storage (S3-compatible)
      │
      └──────────────► PostgreSQL 16 + pgvector — Primary DB
                      ├── users, orgs, minds, documents
                      ├── chunks + embeddings (vector(768))
                      └── Flyway migrations
```

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Language** | Java 21 | Virtual threads for I/O-heavy ingestion |
| **Framework** | Spring Boot 3.4 | Mature, well-supported REST framework |
| **Database** | PostgreSQL 16 + pgvector | Embedding storage + vector search |
| **ORM** | Spring Data JPA + Hibernate | Standard JPA with native vector queries |
| **Auth** | Spring Security + JJWT 0.12.5 | Stateless JWT + DB-backed refresh tokens |
| **File Storage** | Cloudflare R2 | S3-compatible, zero egress fees, stream-based uploads |
| **Embeddings + Chat** | Google Gemini API | `text-embedding-004` (768d), `gemini-1.5-pro` |
| **MCP Layer** | FastMCP (TypeScript) | Standalone server, single `search_knowledge` tool |
| **Email** | Resend | Transactional SDK for invites + verification |
| **Build** | Maven | Standard Spring Boot toolchain |
| **Migrations** | Flyway | Versioned SQL migrations |

## Project Structure

```
gnosis-api/
├── src/main/java/com/gnosis/
│   ├── GnosisApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── R2Config.java
│   │   ├── GeminiConfig.java
│   │   └── WebMvcConfig.java
│   ├── domain/
│   │   ├── auth/
│   │   │   ├── User.java
│   │   │   ├── RefreshToken.java
│   │   │   └── EmailVerificationToken.java
│   │   ├── org/
│   │   │   ├── Organization.java
│   │   │   └── OrgMembership.java
│   │   ├── mind/
│   │   │   ├── Mind.java
│   │   │   ├── MindMembership.java
│   │   │   └── MindInvite.java
│   │   ├── document/
│   │   │   ├── Document.java
│   │   │   └── Chunk.java
│   │   └── notification/
│   │       └── Notification.java
│   ├── repository/
│   │   └── (one per entity)
│   ├── service/
│   │   ├── auth/
│   │   ├── org/
│   │   ├── mind/
│   │   ├── storage/
│   │   │   ├── FileStorageService.java
│   │   │   └── R2FileStorageService.java
│   │   ├── email/
│   │   │   └── EmailService.java
│   │   ├── document/
│   │   │   ├── IngestionService.java
│   │   │   ├── ExtractionService.java
│   │   │   └── EmbeddingService.java
│   │   └── notification/
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── OrganizationController.java
│   │   ├── MindController.java
│   │   ├── DocumentController.java
│   │   ├── QueryController.java
│   │   └── NotificationController.java
│   ├── dto/
│   │   └── (request + response DTOs per domain)
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   └── (domain exceptions)
│   └── util/
│       └── JwtUtil.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       ├── V1__init_schema.sql
│       ├── V2__pgvector_extension.sql
│       └── V3__add_notifications.sql
└── gnosis-mcp/               ← separate TS project
    ├── src/
    │   └── server.ts
    └── package.json
```

## Database Schema

### Core Tables (V1)

| Table | Purpose |
|---|---|
| `users` | Auth + profile; `email_verified` flag prevents junk |
| `refresh_tokens` | Server-stored opaque tokens with rotation support |
| `email_verification_tokens` | 24h TTL tokens for email confirmation |
| `organizations` | Top-level tenant grouping |
| `org_memberships` | Org membership with role (OWNER, ADMIN, MEMBER) |
| `minds` | Knowledge workspaces; soft-deletable, per-Mind quota |
| `mind_memberships` | Mind-level roles (READ, READ_WRITE, ADMIN) |
| `mind_invites` | Invite tracking; unique per (mind, email) while PENDING |
| `documents` | Uploaded files; soft-deletable, tracks processing status |
| `chunks` | Text chunks with `embedding vector(768)` (added in V2) |
| `notifications` | In-app notifications for invites, document ready, etc. |

### Vector Search (V2)

```sql
CREATE EXTENSION vector;
ALTER TABLE chunks ADD COLUMN embedding vector(768);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Key Indexes

- `chunks(mind_id)` — fast scoped queries
- `notifications(user_id, read)` — unread count
- `mind_invites(token)` — accept link lookup
- `mind_invites(email)` — pending invite lookup on signup

## Authentication Flow

### Signup → Email Verification → Login

```
POST /api/v1/auth/register
  ├── Validate email uniqueness
  ├── Hash password (BCrypt, strength 12)
  ├── Persist User (email_verified = false)
  ├── Generate verification token (UUID, 24h TTL)
  ├── Send verification email via Resend
  └── Return 201

User clicks link → GET /api/v1/auth/verify-email?token=<token>
  ├── Validate token (not expired, not used)
  ├── Set user.email_verified = true
  ├── Mark token as used
  └── Return 200 / redirect

POST /api/v1/auth/login
  ├── Validate email + password
  ├── Require email_verified = true
  ├── Issue JWT (15 min, HS256)
  ├── Generate opaque refresh token (UUID, hashed, stored in DB, 7d TTL)
  └── Return { accessToken, refreshToken, expiresIn }

POST /api/v1/auth/refresh
  ├── Hash incoming token, lookup in DB
  ├── Verify not revoked and not expired
  ├── Revoke old token (rotation)
  ├── Issue new access + refresh tokens
  └── Return { accessToken, refreshToken, expiresIn }
```

### JWT Payload

```json
{
  "sub": "<user_uuid>",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

## Authorization Model

Spring Security + `@PreAuthorize` with a custom `MindSecurityService` bean:

```java
@PreAuthorize("@mindSecurity.hasMindRole(#mindId, 'READ_WRITE')")
@PostMapping("/{mindId}/documents")
```

### Role Hierarchies

| Scope | Levels | Ordinal |
|---|---|---|
| **Mind** | READ (0) < READ_WRITE (1) < ADMIN (2) |
| **Organization** | MEMBER (0) < ADMIN (1) < OWNER (2) |

## Ingestion Pipeline (Synchronous)

```
Upload → Validate access & quota → Stream to R2 → Extract text → Chunk → Embed → Persist
```

| File Type | Extraction Strategy |
|---|---|
| PDF | Apache PDFBox |
| DOCX | Apache POI |
| Text / Markdown | Direct read |
| Images | Gemini multimodal: "Describe this file for KB indexing" |
| Audio | Gemini multimodal: same approach |
| Video | Gemini multimodal: same approach |

### Chunking

- Target: **512 tokens (~1800 characters)**
- Overlap: **10% (~180 characters)**
- Simple sliding window

### Embedding

- Model: `text-embedding-004` (768d)
- Batched: up to 100 chunks per API call
- Retry: exponential backoff on 429

### Document States

`PENDING` → `PROCESSING` → `READY` / `FAILED`

## Query & Retrieval

```
POST /api/v1/query
{
  "prompt": "What are our Q3 renewal policies?",
  "mindIds": ["uuid-1", "uuid-2"],
  "stream": false
}
```

1. Validate user has READ access on **all** requested `mindIds`
2. Send prompt + MCP tool definition to Gemini (`gemini-1.5-pro`)
3. Gemini calls `search_knowledge` (FastMCP server)
4. MCP server embeds query, runs `<=>` cosine search on pgvector:

```sql
SELECT c.content, c.mind_id, d.file_name,
       1 - (c.embedding <=> $1::vector) AS similarity
FROM chunks c
JOIN documents d ON d.id = c.document_id
WHERE c.mind_id = ANY($2::uuid[])
  AND d.deleted_at IS NULL
ORDER BY c.embedding <=> $1::vector
LIMIT $3;
```

5. Top-K chunks returned to Gemini as context
6. Gemini generates response with citations

## File Storage (Cloudflare R2)

- S3-compatible API via AWS SDK v2
- Stream directly — never buffer full file in memory
- Key pattern: `minds/{mindId}/docs/{docId}/{filename}`
- Abstraction: `FileStorageService` interface (swap R2 for local/MinIO in tests)

## Email (Resend)

- Dedicated Java SDK (`com.resend:resend-java:3.0.0`)
- Two templates: verification email + invite email
- Config: `app.resend.api-key` + `app.resend.from-email`

## MCP Layer

Standalone TypeScript server using FastMCP:

- Single tool: `search_knowledge(query, mind_ids, top_k)`
- Calls Gemini embedding API for query vector
- Executes pgvector cosine search via direct DB connection
- Returns context chunks to Gemini for response synthesis

## Invite Flow

| Scenario | Behavior |
|---|---|
| **Existing user** | Create `mind_invite` (PENDING), push notification, send email |
| **New user** | Send email with registration link + `inviteToken`; on signup, auto-resolve pending invites and create memberships |
| **Accept** | Validate invite, create `MindMembership`, auto-join org, mark notification read |
| **Decline** | Mark invite DECLINED |

## Error Handling

All errors follow **RFC 7807 (Problem Details)**:

```json
{
  "type": "about:blank",
  "title": "Access Violations Rejected",
  "status": 403,
  "detail": "User lacks READ_WRITE role on this Mind",
  "timestamp": "2026-06-26T12:00:00Z"
}
```

## API Endpoints Summary

| Group | Endpoints |
|---|---|
| **Auth** | `POST /register`, `GET /verify-email`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` |
| **Organizations** | `POST /`, `GET /`, `GET /{id}`, `GET /{id}/members`, `DELETE /{id}/members/{userId}` |
| **Minds** | `POST /orgs/{orgId}/minds`, `GET /orgs/{orgId}/minds`, `GET /minds/{id}`, `PATCH /minds/{id}`, `DELETE /minds/{id}`, `GET /minds/{id}/members`, `PATCH /minds/{id}/members/{userId}`, `DELETE /minds/{id}/members/{userId}` |
| **Invites** | `POST /minds/{mindId}/invites`, `GET /invites/{token}/accept`, `POST /invites/{inviteId}/decline`, `GET /invites/pending` |
| **Documents** | `POST /minds/{mindId}/documents`, `GET /minds/{mindId}/documents`, `GET /minds/{mindId}/documents/{docId}`, `DELETE /minds/{mindId}/documents/{docId}` |
| **Query** | `POST /api/v1/query` |
| **Notifications** | `GET /`, `PATCH /{id}/read`, `PATCH /read-all` |
| **System** | `GET /actuator/health`, `GET /actuator/info` |

## Key Security Decisions

| Concern | Approach |
|---|---|
| **MCP auth** | Shared secret via env var between API and MCP server |
| **Response format** | Synchronous JSON (streaming in V1.1) |
| **Storage quota** | Per-Mind `storage_quota_mb` field, checked on upload |
| **Notifications** | Client short-polling every 30s (WebSockets in V1.1) |
| **Audit trail** | Append-only event log table in core DB |
| **Soft delete** | `deleted_at` timestamps on Minds and Documents |
| **Rate limiting** | Bucket4j on public endpoints |
