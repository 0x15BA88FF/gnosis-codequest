# Gnosis — Agent Context

Full-stack monorepo, Spring Boot 3.4 backend + Expo (React Native) frontend.

## Repo Map

- `apps/api/` — Java 21, Maven, Spring Boot (`com.gnosis` package), PostgreSQL 16 + pgvector
- `apps/app/` — Expo SDK 56, Expo Router (`src/app/` file-based routing), NativeWind, shadcn/ui
- No `pnpm-workspace.yaml` — the two apps are independent, no shared packages
- No frontend tests, no CI, no codegen, no type-check scripts

## Backend Commands (`apps/api/`)

| Command | Notes |
|---|---|
| `mvn spring-boot:run` | Dev server on :8080; requires PostgreSQL on :5432 |
| `mvn test` | Runs all tests |
| `mvn test -Dtest=IntegrationTest` | Single test class |
| `mvn package` | Builds JAR (`-DskipTests` is default) |

## Frontend Commands (`apps/app/`)

| Command | Notes |
|---|---|
| `pnpm install` | `.npmrc` hoists `react-native*` and `css-interop` patterns |
| `pnpm start` | Expo dev server |
| `pnpm lint` | ESLint via `expo lint` |
| `pnpm web` / `pnpm ios` / `pnpm android` | Expo with target flag |

## Infrastructure

- **Docker Compose** starts postgres (pgvector), MinIO (R2-compatible), and the API. MCP server is behind `--profile mcp` and the directory `apps/mcp/` does not exist yet.
- **Nix flake** provides all tooling (pnpm, JDK 21, Maven, Node 24) — activate via `direnv allow` or `nix develop`.
- Env vars: copy `apps/api/.env.example` to `apps/api/.env`. JWT secret: `openssl rand -base64 32`.
- Tests use H2 in-memory (not pgvector), Flyway disabled, JPA `ddl-auto: update`. Vectors/embeddings are no-ops in tests.
- Rate limiting (Bucket4j) is active on public endpoints; query limit is separate.

## Testing Quirks

- Backend: `@DataJpaTest` for repos, `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Transactional` for integration tests.
- Test profile `@ActiveProfiles("test")`, config at `apps/api/src/test/resources/application-test.yml`.
- Registration auto-returns tokens (bypasses email verification in register endpoint itself). Login still requires `email_verified`.
- `IntegrationTest.setUp()` registers+logs in, creates an org and mind for the `bearerToken` — re-used across test methods.
- `QueryService` is mocked via `@MockitoBean` in integration tests. An embedding/chunk pipeline is not exercised in tests.
- Frontend has no test runner configured.

## Architecture Notes

- **Auth:** BCrypt strength 12, JWT (HS256, 15 min), refresh tokens (UUID, hashed, DB-stored, rotated on use, 7d TTL). Endpoints under `/api/v1/auth/`.
- **Document pipeline:** Upload → stream to R2 → extract text → chunk (512 tokens, 10% overlap) → embed (Gemini text-embedding-004, 768d, batch 100) → persist. Synchronous.
- **Query:** Gemini 1.5 Pro tool-calls `search_knowledge` (FastMCP standalone). MCP server not yet implemented in this repo.
- **Authz:** `@PreAuthorize("@mindSecurity.hasMindRole(...)")` — role levels: READ(0) < READ_WRITE(1) < ADMIN(2).
- **Soft deletes** on `minds` and `documents` (`deleted_at`).
- **Errors** follow RFC 7807 (Problem Details) — see `GlobalExceptionHandler`.
- **FileStorageService** interface abstracts R2; swap for local/MinIO in tests.
- **Notifications** use short-polling (client polls every 30s).
- No DTO mapper library in active use (MapStruct in pom but not heavily leveraged — check patterns before using it).

## Style Conventions

- Backend: standard Spring Boot layered layout (controller → service → repository, no explicit service interfaces). Exceptions in `exception/` package.
- Frontend: `@/` path alias → `src/`, component aliases `@/components/ui`, utility alias `@/lib`.
- No state management library — keep it simple.
