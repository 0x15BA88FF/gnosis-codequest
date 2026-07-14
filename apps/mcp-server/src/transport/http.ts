import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"

export function createHttpServer(createServer: () => McpServer) {
  const app = express();

  app.use(express.json());

    app.post("/mcp", async (req, res) => {
    try {
      // Stateless mode (sessionIdGenerator: undefined): create a fresh
      // McpServer + transport pair for every request. Reusing a single
      // shared server across requests would break once the first
      // request's `res.on("close")` handler calls server.close(),
      // tearing down the server for every request after it.
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);

      await transport.handleRequest(req, res, req.body);

      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (err) {
      console.error("MCP error:", err);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

    app.get("/mcp", (_, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed",
      },
      id: null,
    });
  });

  app.delete("/mcp", (_, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed",
      },
      id: null,
    });
  });

  return app;
}
