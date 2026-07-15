import type { FastMCP } from "fastmcp";
import * as api from "./fetch.js";
import * as s from "./schemas.js";

export function addTools(server: FastMCP) {
  server.addTool({
    name: "health",
    description:
      "Checks whether the Gnosis MCP server and backend API are running.",
    parameters: s.healthParams,
    execute: async () => {
      const backendStatus = await api.checkHealth();
      return JSON.stringify({ mcpServer: "ok", backendApi: backendStatus });
    },
  });

  server.addTool({
    name: "create_organization",
    description: "Creates a new organization.",
    parameters: s.createOrganizationParams,
    execute: async (args) => {
      const org = await api.createOrganization(args);
      return JSON.stringify(org, null, 2);
    },
  });

  server.addTool({
    name: "list_minds",
    description: "Lists all minds in an organization.",
    parameters: s.listMindsParams,
    execute: async (args) => {
      const minds = await api.listMinds(args.orgId);
      return JSON.stringify(minds, null, 2);
    },
  });

  server.addTool({
    name: "create_mind",
    description: "Creates a new mind in an organization.",
    parameters: s.createMindParams,
    execute: async (args) => {
      const { orgId, ...data } = args;
      const mind = await api.createMind(orgId, data);
      return JSON.stringify(mind, null, 2);
    },
  });

  server.addTool({
    name: "get_mind",
    description: "Returns information about a specific mind.",
    parameters: s.getMindParams,
    execute: async (args) => {
      const mind = await api.getMind(args.mindId);
      return JSON.stringify(mind, null, 2);
    },
  });

  server.addTool({
    name: "list_mind_documents",
    description: "Lists all documents inside a mind.",
    parameters: s.listMindDocumentsParams,
    execute: async (args) => {
      const docs = await api.listMindDocuments(args.mindId);
      return JSON.stringify(docs, null, 2);
    },
  });

  server.addTool({
    name: "get_document",
    description: "Returns information about a specific document.",
    parameters: s.getDocumentParams,
    execute: async (args) => {
      const doc = await api.getDocument(args.documentId);
      return JSON.stringify(doc, null, 2);
    },
  });

  server.addTool({
    name: "upload_document",
    description: "Uploads a document to a mind.",
    parameters: s.uploadDocumentParams,
    execute: async (args) => {
      const doc = await api.uploadDocument(args.mindId, args.filePath);
      return JSON.stringify(doc, null, 2);
    },
  });

  server.addTool({
    name: "query_minds",
    description:
      "Searches one or more minds and returns an AI-generated answer with citations.",
    parameters: s.queryMindsParams,
    execute: async (args) => {
      const result = await api.queryMinds(args);
      return JSON.stringify(result, null, 2);
    },
  });
}
