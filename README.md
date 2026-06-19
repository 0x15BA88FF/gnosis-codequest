# Gnosis

A full-stack mobile + API project — built with Spring Boot on the backend and Expo (React Native) on the frontend.

## Structure

```
├── apps/
│   ├── api/          # Spring Boot 3.4 backend (Java 21)
│   └── app/          # Expo / React Native frontend
├── Dockerfile        # Backend container image
├── docker-compose.yml
├── pnpm-workspace.yaml
└── ...
```

## Prerequisites

- **Java 21** (JDK)
- **Node.js 24**
- **pnpm** (9+)
- Gradle (via `./gradlew` — wrapper included)

A [Nix flake](flake.nix) provides all tooling — activate it with `direnv allow` or `nix develop`.

## Getting Started

### Backend API

```bash
cd apps/api
./gradlew bootRun
```

The server starts at [http://localhost:8080](http://localhost:8080).

```bash
curl http://localhost:8080/hello
# → Hello, World!
```

### Frontend (Expo)

```bash
cd apps/app
pnpm install
pnpm start
```

Scan the QR code with **Expo Go** on your phone, or press **w** to open in a web browser.

### Docker

Build and run the backend in a container:

```bash
docker compose up --build
```

The API will be available at [http://localhost:8080](http://localhost:8080).

## Scripts

### Backend

| Command | Description |
|---|---|
| `./gradlew bootRun` | Start the dev server |
| `./gradlew build` | Build the project (creates JAR) |
| `./gradlew test` | Run tests |

### Frontend

| Command | Description |
|---|---|
| `pnpm start` | Start Expo dev server |
| `pnpm web` | Start Expo with web target |
| `pnpm ios` | Start Expo with iOS target |
| `pnpm android` | Start Expo with Android target |
