export interface Org {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  memberCount: number;
  mindCount: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface OrgResponse {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  memberCount: number;
  mindCount: number;
}

export interface CreateOrgRequest {
  name: string;
}

export interface UpdateOrgRequest {
  name: string;
}

export interface OrgMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  mindAccess: Record<string, string>;
}

export interface OrgMemberResponse {
  userId: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  mindAccess: Record<string, string>;
}

export interface UpdateOrgMemberRequest {
  role?: 'MEMBER' | 'ADMIN';
  mindAccess?: Record<string, string>;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  inviteeEmail: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  token: string;
}

export interface OrgInviteRequest {
  inviteeEmail: string;
  role: 'MEMBER' | 'ADMIN';
}

export interface OrgInviteResponse {
  id: string;
  orgId: string;
  orgName: string;
  inviteeEmail: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  token: string;
}

export interface UserInvite {
  id: string;
  orgId: string;
  orgName: string;
  inviteeEmail: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  token: string;
}

export interface Mind {
  id: string;
  name: string;
  description?: string;
  storageQuotaMb?: number;
  createdAt: string;
  updatedAt: string;
  role?: MindRole;
}

export interface CreateMindRequest {
  name: string;
  description?: string;
  storageQuotaMb?: number;
}

export interface UpdateMindRequest {
  name?: string;
  description?: string;
  storageQuotaMb?: number;
}

export type MindRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface MindMember {
  userId: string;
  email: string;
  displayName: string;
  role: MindRole;
  joinedAt: string;
}

export interface MindMemberResponse {
  userId: string;
  email: string;
  displayName: string;
  role: MindRole;
  joinedAt: string;
}

export interface UpdateMindMemberRequest {
  role: MindRole;
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
  citations: Citation[];
}

export interface QueryRequest {
  query: string;
  mindIds: string[];
  topK?: number;
}

export interface Document {
  id: string;
  mindId: string;
  uploadedBy: string;
  fileName: string;
  mediaType: string;
  fileSizeBytes: number;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  deleted: boolean;
}

export interface UploadDocumentResponse {
  id: string;
  mindId: string;
  uploadedBy: string;
  fileName: string;
  mediaType: string;
  fileSizeBytes: number;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  deleted: boolean;
}

export interface SubscriptionPlan {
  code: string;
  name: string;
  amountCents: number;
  currency: string;
  interval: string;
  maxOrgs: number;
  maxMindsPerOrg: number;
  maxStorageMbPerMind: number;
  maxMembersPerOrg: number;
  features: string[];
  sortOrder: number;
}

export interface SubscriptionInfo {
  id: string;
  planCode: string;
  planName: string;
  amountCents: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  maxOrgs: number;
  maxMindsPerOrg: number;
  maxStorageMbPerMind: number;
  maxMembersPerOrg: number;
}

export interface SubscriptionUsage {
  orgCount: number;
  maxOrgs: number;
  planCode: string;
  planName: string;
  mindsPerOrg: Record<string, { count: number; max: number; orgName: string }>;
}

export interface SubscriptionCurrent {
  plan: SubscriptionPlan;
  subscription: SubscriptionInfo | null;
  usage: SubscriptionUsage;
}

export interface CheckoutSession {
  accessCode: string | null;
  authorizationUrl: string | null;
  reference: string | null;
  free: boolean;
}

export interface PaymentTransaction {
  id: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
  planName: string;
}