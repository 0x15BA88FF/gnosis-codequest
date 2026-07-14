import dotenv from "dotenv";

dotenv.config();

/**
 * Static backend access token, provided via environment variable.
 *
 * Every endpoint in the Gnosis API except GET /hello requires a JWT
 * Bearer token (see openapi.yml `bearerAuth` security scheme). This
 * server currently runs as a single server-to-server integration, so
 * one token is read from the environment and attached to all outgoing
 * requests in services/api.ts.
 *
 * TODO (future): if this server needs to act on behalf of individual
 * end users, replace this with either (a) forwarding the caller's own
 * Authorization header from the incoming MCP request, or (b) a login
 * tool that exchanges credentials for a token per session.
 */
export function getBackendToken(): string | undefined {
  return process.env.BACKEND_API_TOKEN;
}