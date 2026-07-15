import { FastMCP } from "fastmcp";
import { addTools } from "./tools.js";
import { logger } from "./logger.js";

export async function createApp(
  options: { port: number; host?: string } = { port: 3000 },
) {
  const server = new FastMCP({
    name: "gnosis-mcp-server",
    version: "1.0.0",
  });

  addTools(server);

  await server.start({
    transportType: "httpStream",
    httpStream: {
      port: options.port,
      host: options.host ?? "0.0.0.0",
    },
  });

  logger.info(
    { port: options.port, host: options.host ?? "0.0.0.0" },
    "MCP server started",
  );

  return server;
}
