export interface Mind {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  storageQuotaMb: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export type DocumentProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface Document {
  id: string;
  mindId: string;
  uploadedBy: string;
  fileName: string;
  mediaType: string;
  fileSizeBytes: number;
  processingStatus: DocumentProcessingStatus;
  errorMessage: string | null;
  createdAt: string;
  deleted: boolean;
}

export interface QueryRequest {
  query: string;
  mindIds: string[];
  topK?: number;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  fileName: string;
  content: string;
  score: number;
}

export interface QueryResponse {
  answer: string;
  citations?: Citation[];
}

/** RFC7807 problem detail, as returned by the Gnosis API on errors. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: string[];
}
export interface CreateOrganizationRequest {
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface CreateMindRequest {
  name: string;
  description?: string;
  storageQuotaMb?: number;
}

export interface CreateMindRequest {
  name: string;
  description?: string;
  storageQuotaMb?: number;
}