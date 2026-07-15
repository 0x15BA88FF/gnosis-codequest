import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register } from "node:module";
import { registerTools } from "./tools/index.js";

export function createServer() {
  const server = new McpServer({
    name: "gnosis-mcp-server",
    version: "1.0.0",
  });

  registerTools(server);

  return server;
}