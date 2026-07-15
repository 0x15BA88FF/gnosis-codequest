import { z } from "zod";

export const healthParams = z.object({});

export const createOrganizationParams = z.object({
  name: z.string().min(1).max(255),
});

export const listMindsParams = z.object({
  orgId: z.uuid(),
});

export const createMindParams = z.object({
  orgId: z.uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  storageQuotaMb: z.number().int().positive().optional(),
});

export const getMindParams = z.object({
  mindId: z.uuid(),
});

export const listMindDocumentsParams = z.object({
  mindId: z.uuid(),
});

export const getDocumentParams = z.object({
  documentId: z.uuid(),
});

export const uploadDocumentParams = z.object({
  mindId: z.uuid(),
  filePath: z.string(),
});

export const queryMindsParams = z.object({
  query: z.string(),
  mindIds: z.array(z.uuid()).min(1),
  topK: z.number().int().max(20).optional(),
});
