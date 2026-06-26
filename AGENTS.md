# Gnosis — Agent Context

## Overview

Full-stack monorepo with a Spring Boot API backend and Expo (React Native) mobile frontend.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.4, Maven
- **Frontend:** React Native, Expo SDK 56, Expo Router, NativeWind (Tailwind), shadcn/ui
- **Tooling:** Nix flake, pnpm, Docker

## Key Conventions

- Monorepo with two apps under `apps/`: `api/` and `app/`
- Backend uses Spring Boot's conventional package layout (`com.gnosis`)
- Frontend uses Expo Router file-based routing under `src/app/`
- Styling uses NativeWind (Tailwind CSS with CSS variables)
- No state management library yet — keep it simple

## Commands

### Backend (`apps/api/`)

| Command | Description |
|---|---|
| `mvn spring-boot:run` | Run dev server on port 8080 |
| `mvn package` | Build JAR (skips tests) |
| `mvn test` | Run tests |
| `mvn package` | Package runnable JAR |

### Frontend (`apps/app/`)

| Command | Description |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm start` | Expo dev server |
| `pnpm lint` | Lint with ESLint |

### Docker

| Command | Description |
|---|---|
| `docker compose up --build` | Build and run backend |
| `docker compose down` | Stop containers |
