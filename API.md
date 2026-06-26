# Gnosis API Documentation

> Base URL: `http://localhost:8080`  
> All dates/timestamps are ISO-8601 (e.g. `2025-06-26T10:30:00Z`).  
> All UUIDs are v4 strings (e.g. `550e8400-e29b-41d4-a716-446655440000`).

---

## Authentication

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json   (default)
```

### Public Endpoints (no token required)

| Endpoint | Method |
|---|---|
| `POST /api/v1/auth/register` | Register |
| `POST /api/v1/auth/login` | Login |
| `POST /api/v1/auth/refresh` | Refresh token |
| `POST /api/v1/auth/verify-email` | Verify email |
| `GET /actuator/health` | Health check |
| `GET /actuator/info` | App info |

Everything else requires `Authorization: Bearer <token>`.

### Token Lifecycle

| Token | Lifetime | Storage |
|---|---|---|
| JWT (access token) | 15 min (configurable via `JWT_EXPIRATION`) | Client memory / secure storage |
| Refresh token | 7 days, UUID stored hashed in DB, rotated on use | Client secure storage |

### Common Auth Error Responses

```json
// 401 — Missing or invalid JWT
{
  "type": "urn:problem:unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password"
}

// 403 — Insufficient mind role
{
  "type": "urn:problem:forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access denied"
}
```

### Rate Limiting

| Scope | Capacity | Refill | Key |
|---|---|---|---|
| `POST /api/v1/auth/*` | 20 burst | 10/min | Client IP |
| `POST /api/v1/query` | 30 burst | 15/min | Client IP |

```json
// 429 — Too Many Requests
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

---

## Error Format (RFC 7807)

All errors use Problem Details JSON:

```json
// 400 — Validation error
{
  "type": "urn:problem:validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Validation failed",
  "errors": ["email: must not be blank", "password: size must be between 8 and 128"]
}

// 404 — Resource not found
{
  "type": "urn:problem:not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Mind not found with id: <uuid>"
}

// 409 — Conflict
{
  "type": "urn:problem:conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "..."
}

// 400 — Bad request
{
  "type": "urn:problem:bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "..."
}
```

---

## Endpoints

### Health & Info

#### `GET /hello`

Public health check (plain text).

**Response:** `200`
```
Hello, World!
```

#### `GET /actuator/health`

**Response:** `200`
```json
{"status": "UP"}
```

#### `GET /actuator/info`

**Response:** `200`
```json
{}
```

---

### Auth (`/api/v1/auth`)

#### `POST /api/v1/auth/register`

Create a new account. The user is auto-verified (no email verification required in dev).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "min8characters",
  "displayName": "Alice"
}
```

`password` length: 8–128 chars.  
`displayName` max: 255 chars.

**Response:** `201`
```json
{
  "token": "<jwt_token>",
  "refreshToken": "<uuid_refresh_token>",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Alice"
}
```

---

#### `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "min8characters"
}
```

**Response:** `200`
```json
{
  "token": "<jwt_token>",
  "refreshToken": "<uuid_refresh_token>",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Alice"
}
```

**Note:** Requires `email_verified = true`. If registration auto-verifies, this is always true.

---

#### `POST /api/v1/auth/refresh`

Exchange a refresh token for a new JWT + rotated refresh token.

**Request:**
```json
{
  "refreshToken": "<uuid_refresh_token>"
}
```

**Response:** `200`
```json
{
  "token": "<new_jwt_token>",
  "refreshToken": "<new_uuid_refresh_token>",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Alice"
}
```

---

#### `POST /api/v1/auth/logout`

Revoke a refresh token. Requires authentication.

**Request:**
```json
{
  "refreshToken": "<uuid_refresh_token>"
}
```

**Response:** `204` (no body)

---

#### `POST /api/v1/auth/verify-email`

Verify email with token (public, but registration auto-verifies in dev).

**Request:**
```json
{
  "token": "<verification_token>"
}
```

**Response:** `204` (no body)

---

#### `GET /api/v1/auth/me`

Get current user profile. Requires authentication.

**Response:** `200`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Alice",
  "emailVerified": true,
  "createdAt": "2025-06-26T10:30:00Z"
}
```

---

### Organizations (`/api/v1/organizations`)

#### `POST /api/v1/organizations`

Create a new organization. The creator becomes the owner.

**Request:**
```json
{
  "name": "My Org"
}
```

`name` max: 255 chars.

**Response:** `201`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Org",
  "ownerId": "550e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2025-06-26T10:30:00Z"
}
```

---

#### `GET /api/v1/organizations`

List organizations the current user belongs to.

**Response:** `200`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Org",
    "ownerId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-06-26T10:30:00Z"
  }
]
```

---

#### `GET /api/v1/organizations/{orgId}`

Get a single organization.

**Response:** `200`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Org",
  "ownerId": "550e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2025-06-26T10:30:00Z"
}
```

---

#### `DELETE /api/v1/organizations/{orgId}/members/{userId}`

Remove a member from an organization.

**Response:** `204` (no body)

---

### Minds (`/api/v1/organizations/{orgId}/minds` and `/api/v1/minds/{mindId}`)

A Mind is a knowledge base (collection of documents) within an organization.

#### `POST /api/v1/organizations/{orgId}/minds`

Create a new mind inside an organization.

**Request:**
```json
{
  "name": "Engineering Wiki",
  "description": "Internal engineering documentation",
  "storageQuotaMb": 1024
}
```

All fields optional except `name` (max 255 chars).  
`description` is free text.  
`storageQuotaMb` defaults to `2048` (2 GB).

**Response:** `201`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "orgId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Engineering Wiki",
  "description": "Internal engineering documentation",
  "storageQuotaMb": 1024,
  "createdBy": "550e8400-e29b-41d4-a716-446655440002",
  "createdAt": "2025-06-26T10:30:00Z",
  "updatedAt": "2025-06-26T10:30:00Z",
  "deleted": false
}
```

---

#### `GET /api/v1/organizations/{orgId}/minds`

List all minds in an organization accessible to the current user.

**Response:** `200`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "orgId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Engineering Wiki",
    "description": "Internal engineering documentation",
    "storageQuotaMb": 1024,
    "createdBy": "550e8400-e29b-41d4-a716-446655440002",
    "createdAt": "2025-06-26T10:30:00Z",
    "updatedAt": "2025-06-26T10:30:00Z",
    "deleted": false
  }
]
```

---

#### `GET /api/v1/minds/{mindId}`

Get a single mind. Requires membership (READ role).

**Response:** `200`

(Same shape as `MindResponse` above.)

---

#### `PATCH /api/v1/minds/{mindId}`

Update mind metadata. Requires ADMIN role.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "storageQuotaMb": 2048
}
```

All fields optional. Only send what you want to change.

**Response:** `200`

(Shape: `MindResponse`)

---

#### `DELETE /api/v1/minds/{mindId}`

Soft-delete a mind (sets `deleted_at`). Requires ADMIN role.

**Response:** `204` (no body)

---

#### `GET /api/v1/minds/{mindId}/members`

List members of a mind. Requires READ role.

**Response:** `200`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "userDisplayName": "Alice",
    "role": "ADMIN",
    "joinedAt": "2025-06-26T10:30:00Z"
  }
]
```

**Roles:** `READ` (0) < `READ_WRITE` (1) < `ADMIN` (2)

---

#### `PATCH /api/v1/minds/{mindId}/members/{userId}`

Change a member's role. Requires ADMIN.

**Request:**
```json
{
  "role": "READ_WRITE"
}
```

**Response:** `204` (no body)

---

#### `DELETE /api/v1/minds/{mindId}/members/{userId}`

Remove a member from a mind. Requires ADMIN.

**Response:** `204` (no body)

---

### Invites (`/api/v1/invites`)

Invites let users join a mind by email. The invitee must have an account with the same email.

#### `POST /api/v1/minds/{mindId}/invites`

Create an invite to a mind. Requires ADMIN role.

**Request:**
```json
{
  "inviteeEmail": "colleague@example.com",
  "role": "READ_WRITE"
}
```

**Response:** `201`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "mindId": "550e8400-e29b-41d4-a716-446655440001",
  "inviteeEmail": "colleague@example.com",
  "role": "READ_WRITE",
  "status": "PENDING",
  "token": "<invite_token_uuid>",
  "expiresAt": "2025-07-03T10:30:00Z",
  "createdAt": "2025-06-26T10:30:00Z"
}
```

Status values: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`.

---

#### `POST /api/v1/invites/accept`

Accept a pending invite.

**Request:**
```json
{
  "token": "<invite_token>"
}
```

**Response:** `204` (no body)

---

#### `POST /api/v1/invites/decline`

Decline a pending invite.

**Request:**
```json
{
  "token": "<invite_token>"
}
```

**Response:** `204` (no body)

---

#### `GET /api/v1/invites/pending`

List all pending invites for the current user (matched by email).

**Response:** `200`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "mindId": "550e8400-e29b-41d4-a716-446655440001",
    "inviteeEmail": "colleague@example.com",
    "role": "READ_WRITE",
    "status": "PENDING",
    "token": "<invite_token_uuid>",
    "expiresAt": "2025-07-03T10:30:00Z",
    "createdAt": "2025-06-26T10:30:00Z"
  }
]
```

---

### Documents (`/api/v1/documents`, `/api/v1/minds/{mindId}/documents`)

Documents are files uploaded to a mind. Upload triggers ingestion: text extraction → chunking → embedding.

#### `POST /api/v1/minds/{mindId}/documents`

Upload a file. Requires READ_WRITE role. Content-Type: `multipart/form-data`.

| Field | Type | Description |
|---|---|---|
| `file` | MultipartFile | The file to upload |

Max file size: **50 MB** (configurable via `MAX_UPLOAD_SIZE_MB`).  
Mind storage quota applies (default 2 GB per mind).

**Response:** `200`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "mindId": "550e8400-e29b-41d4-a716-446655440001",
  "uploadedBy": "550e8400-e29b-41d4-a716-446655440002",
  "fileName": "report.pdf",
  "mediaType": "application/pdf",
  "fileSizeBytes": 1048576,
  "processingStatus": "PENDING",
  "errorMessage": null,
  "createdAt": "2025-06-26T10:30:00Z",
  "deleted": false
}
```

**Processing status values:** `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

---

#### `GET /api/v1/minds/{mindId}/documents`

List documents in a mind (excluding soft-deleted). Requires READ role.

**Response:** `200`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "mindId": "550e8400-e29b-41d4-a716-446655440001",
    "uploadedBy": "550e8400-e29b-41d4-a716-446655440002",
    "fileName": "report.pdf",
    "mediaType": "application/pdf",
    "fileSizeBytes": 1048576,
    "processingStatus": "COMPLETED",
    "errorMessage": null,
    "createdAt": "2025-06-26T10:30:00Z",
    "deleted": false
  }
]
```

---

#### `GET /api/v1/documents/{docId}`

Get a single document. Requires READ access to the parent mind.

**Response:** `200`

(Same shape as `DocumentResponse` above.)

---

#### `DELETE /api/v1/documents/{docId}`

Soft-delete a document. Requires ADMIN role on the parent mind.

**Response:** `204` (no body)

---

### Query (`/api/v1/query`)

Ask a natural-language question against one or more minds. Uses vector search + Gemini 2.0 Flash to generate an answer with citations.

**Rate limited:** 30 burst / 15 per minute.

**Request:**
```json
{
  "query": "What is the deployment process?",
  "mindIds": ["550e8400-e29b-41d4-a716-446655440000"],
  "topK": 10
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `query` | string | Yes | — | The question |
| `mindIds` | array of UUIDs | Yes | — | At least one mind ID. User must be member of each. |
| `topK` | integer | No | `10` | Max chunks to retrieve (capped at 20) |

**Response:** `200`
```json
{
  "answer": "The deployment process involves... [1][2]",
  "citations": [
    {
      "chunkId": "550e8400-e29b-41d4-a716-446655440000",
      "documentId": "550e8400-e29b-41d4-a716-446655440001",
      "fileName": "deployment-guide.pdf",
      "content": "The deployment pipeline consists of...",
      "score": 0.92
    }
  ]
}
```

When no relevant content is found:
```json
{
  "answer": "No relevant content found in the selected knowledge bases.",
  "citations": []
}
```

---

### Notifications (`/api/v1/notifications`)

Short-polling notification system (client polls every 30s).

#### `GET /api/v1/notifications`

List notifications for the current user (paginated).

**Query params:** Spring Data `Pageable` — `?page=0&size=20&sort=createdAt,desc`

**Response:** `200`
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "INVITE",
      "title": "New Invitation",
      "body": "You've been invited to Engineering Wiki",
      "payload": "{...}",
      "read": false,
      "createdAt": "2025-06-26T10:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Standard Spring Page response.

---

#### `PATCH /api/v1/notifications/{id}/read`

Mark a single notification as read.

**Response:** `204` (no body)

---

#### `PATCH /api/v1/notifications/read-all`

Mark all unread notifications as read.

**Response:** `204` (no body)

---

## Data Model Overview

```
User (id, email, passwordHash, displayName, emailVerified, createdAt, updatedAt)
  │
  ├─ Organization (id, name, owner → User, createdAt, updatedAt)
  │    └─ Mind (id, org → Organization, name, description, storageQuotaMb,
  │              createdBy → User, createdAt, updatedAt, deletedAt)
  │           ├─ Document (id, mind → Mind, uploadedBy → User, fileName, r2Key,
  │           │            mediaType, fileSizeBytes, processingStatus, errorMessage,
  │           │            createdAt, updatedAt, deletedAt)
  │           │    └─ Chunk (id, document → Document, mind → Mind, content,
  │           │              chunkIndex, tokenCount, embedding vector(768), createdAt)
  │           ├─ MindMembership (id, mind → Mind, user → User, role, joinedAt)
  │           └─ MindInvite (id, mind → Mind, invitedBy → User, inviteeEmail,
  │                          role, token, status, expiresAt, createdAt, updatedAt)
  │
  ├─ RefreshToken (id, user → User, tokenHash, expiresAt, createdAt)
  ├─ EmailVerificationToken (id, user → User, token, expiresAt, createdAt)
  └─ Notification (id, user → User, type, title, body, payload, read, createdAt, updatedAt)
```

---

## CORS

All origins allowed for `/api/**` paths. Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`. Headers: all.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/gnosis` | PostgreSQL connection string |
| `DB_USERNAME` | `gnosis` | DB user |
| `DB_PASSWORD` | `gnosis` | DB password |
| `JWT_SECRET` | — | HMAC-SHA256 key (256+ bit base64) |
| `JWT_EXPIRATION` | `86400000` (24h) | JWT lifetime in ms |
| `R2_ENDPOINT` | `http://localhost:9000` | S3-compatible storage endpoint |
| `R2_ACCESS_KEY` | `minioadmin` | Storage access key |
| `R2_SECRET_KEY` | `minioadmin` | Storage secret key |
| `R2_REGION` | `us-east-1` | Storage region |
| `R2_BUCKET` | `gnosis` | Storage bucket name |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `MCP_SERVER_URL` | `http://localhost:9001` | MCP server URL (not yet implemented) |
| `RESEND_API_KEY` | — | Resend email API key |
| `RATE_LIMIT_PUBLIC_CAPACITY` | `20` | Auth endpoint rate limit burst |
| `RATE_LIMIT_PUBLIC_REFILL` | `10` | Auth endpoint rate limit refill/min |
| `RATE_LIMIT_QUERY_CAPACITY` | `30` | Query endpoint rate limit burst |
| `RATE_LIMIT_QUERY_REFILL` | `15` | Query endpoint rate limit refill/min |
| `MAX_UPLOAD_SIZE_MB` | `50` | Max file upload size in MB |
