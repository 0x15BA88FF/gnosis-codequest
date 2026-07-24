import { API_BASE_URL } from './api';
import type {
  Org,
  OrgResponse,
  CreateOrgRequest,
  UpdateOrgRequest,
  OrgMember,
  OrgMemberResponse,
  UpdateOrgMemberRequest,
  OrgInvite,
  OrgInviteRequest,
  OrgInviteResponse,
  UserInvite,
  Mind,
  CreateMindRequest,
  UpdateMindRequest,
  MindMember,
  MindMemberResponse,
  UpdateMindMemberRequest,
  QueryRequest,
  QueryResponse,
  Document,
  UploadDocumentResponse,
  SubscriptionPlan,
  SubscriptionCurrent,
  CheckoutSession,
  SubscriptionInfo,
  PaymentTransaction,
} from './api-types';

const ORG_ENDPOINT = `${API_BASE_URL}/api/v1/organizations`;
const MIND_ENDPOINT = `${API_BASE_URL}/api/v1/minds`;

async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {},
  token: string
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const orgApi = {
  // Organizations
  async list(token: string): Promise<Org[]> {
    return fetchWithAuth<Org[]>(ORG_ENDPOINT, { method: 'GET' }, token);
  },

  async create(token: string, data: CreateOrgRequest): Promise<OrgResponse> {
    return fetchWithAuth<OrgResponse>(ORG_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async get(token: string, orgId: string): Promise<Org> {
    return fetchWithAuth<Org>(`${ORG_ENDPOINT}/${orgId}`, { method: 'GET' }, token);
  },

  async update(token: string, orgId: string, data: UpdateOrgRequest): Promise<OrgResponse> {
    return fetchWithAuth<OrgResponse>(`${ORG_ENDPOINT}/${orgId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  async delete(token: string, orgId: string): Promise<void> {
    return fetchWithAuth<void>(`${ORG_ENDPOINT}/${orgId}`, {
      method: 'DELETE',
    }, token);
  },

  async leave(token: string, orgId: string): Promise<void> {
    return fetchWithAuth<void>(`${ORG_ENDPOINT}/${orgId}/leave`, {
      method: 'DELETE',
    }, token);
  },

  // Members
  async listMembers(token: string, orgId: string): Promise<OrgMember[]> {
    return fetchWithAuth<OrgMember[]>(`${ORG_ENDPOINT}/${orgId}/members`, { method: 'GET' }, token);
  },

  async updateMember(
    token: string,
    orgId: string,
    userId: string,
    data: UpdateOrgMemberRequest
  ): Promise<OrgMemberResponse> {
    return fetchWithAuth<OrgMemberResponse>(`${ORG_ENDPOINT}/${orgId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  async removeMember(token: string, orgId: string, userId: string): Promise<void> {
    return fetchWithAuth<void>(`${ORG_ENDPOINT}/${orgId}/members/${userId}`, {
      method: 'DELETE',
    }, token);
  },

  // Invites
  async listInvites(token: string, orgId: string): Promise<OrgInvite[]> {
    return fetchWithAuth<OrgInvite[]>(`${ORG_ENDPOINT}/${orgId}/invites`, { method: 'GET' }, token);
  },

  async createInvite(token: string, orgId: string, data: OrgInviteRequest): Promise<OrgInviteResponse> {
    return fetchWithAuth<OrgInviteResponse>(`${ORG_ENDPOINT}/${orgId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async cancelInvite(token: string, orgId: string, inviteId: string): Promise<void> {
    return fetchWithAuth<void>(`${ORG_ENDPOINT}/${orgId}/invites/${inviteId}`, {
      method: 'DELETE',
    }, token);
  },

  // Minds
  async listMinds(token: string, orgId: string): Promise<Mind[]> {
    return fetchWithAuth<Mind[]>(`${ORG_ENDPOINT}/${orgId}/minds`, { method: 'GET' }, token);
  },

  async createMind(token: string, orgId: string, data: CreateMindRequest): Promise<Mind> {
    return fetchWithAuth<Mind>(`${ORG_ENDPOINT}/${orgId}/minds`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },
};

export const mindApi = {
  async get(token: string, mindId: string): Promise<Mind> {
    return fetchWithAuth<Mind>(`${MIND_ENDPOINT}/${mindId}`, { method: 'GET' }, token);
  },

  async update(token: string, mindId: string, data: UpdateMindRequest): Promise<Mind> {
    return fetchWithAuth<Mind>(`${MIND_ENDPOINT}/${mindId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  async remove(token: string, mindId: string): Promise<void> {
    return fetchWithAuth<void>(`${MIND_ENDPOINT}/${mindId}`, {
      method: 'DELETE',
    }, token);
  },

  async listMembers(token: string, mindId: string): Promise<MindMember[]> {
    return fetchWithAuth<MindMember[]>(`${MIND_ENDPOINT}/${mindId}/members`, {
      method: 'GET',
    }, token);
  },

  async updateMember(
    token: string,
    mindId: string,
    userId: string,
    data: UpdateMindMemberRequest
  ): Promise<MindMemberResponse> {
    return fetchWithAuth<MindMemberResponse>(`${MIND_ENDPOINT}/${mindId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  async removeMember(token: string, mindId: string, userId: string): Promise<void> {
    return fetchWithAuth<void>(`${MIND_ENDPOINT}/${mindId}/members/${userId}`, {
      method: 'DELETE',
    }, token);
  },

  // Documents
  async listDocuments(token: string, mindId: string): Promise<Document[]> {
    return fetchWithAuth<Document[]>(`${MIND_ENDPOINT}/${mindId}/documents`, {
      method: 'GET',
    }, token);
  },

  async uploadDocument(
    token: string, 
    mindId: string, 
    file: { uri: string; name: string; mimeType: string }
  ): Promise<UploadDocumentResponse> {
    console.log('API: Uploading document:', { mindId, file, tokenPreview: token ? `${token.substring(0, 20)}...` : 'undefined' });
    
    // Use XMLHttpRequest for better FormData support in React Native
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);

      const xhr = new XMLHttpRequest();
      const url = `${MIND_ENDPOINT}/${mindId}/documents`;
      console.log('API: XHR URL:', url);
      console.log('API: Full token length:', token.length);
      console.log('API: Full token:', token);
      xhr.open('POST', url);
      console.log('API: Setting Authorization header with token:', token ? `${token.substring(0, 20)}...` : 'undefined');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.onload = () => {
        console.log('API: XHR Response status:', xhr.status);
        console.log('API: XHR Response headers:', xhr.getAllResponseHeaders());
        console.log('API: XHR Response text:', xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('API: Upload success:', result);
            resolve(result);
          } catch (e) {
            console.error('API: Failed to parse response:', e);
            reject(new Error('Invalid response from server'));
          }
        } else {
          let errorData = {};
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {}
          console.error('API: Error response:', errorData);
          reject(new Error(
            (errorData as any).detail || 
            (errorData as any).message || 
            `Request failed: ${xhr.status}`
          ));
        }
      };
      
      xhr.onerror = () => {
        console.error('API: XHR network error');
        reject(new Error('Network error'));
      };
      
      xhr.send(formData);
    });
  },

  async getDocument(token: string, docId: string): Promise<Document> {
    return fetchWithAuth<Document>(`${API_BASE_URL}/api/v1/documents/${docId}`, {
      method: 'GET',
    }, token);
  },

  async deleteDocument(token: string, docId: string): Promise<void> {
    return fetchWithAuth<void>(`${API_BASE_URL}/api/v1/documents/${docId}`, {
      method: 'DELETE',
    }, token);
  },
};

export const userInviteApi = {
  async listPending(token: string): Promise<UserInvite[]> {
    return fetchWithAuth<UserInvite[]>(`${API_BASE_URL}/api/v1/invites/pending`, {
      method: 'GET',
    }, token);
  },

  async accept(token: string, inviteToken: string): Promise<void> {
    return fetchWithAuth<void>(`${API_BASE_URL}/api/v1/invites/accept`, {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken }),
    }, token);
  },

  async decline(token: string, inviteToken: string): Promise<void> {
    return fetchWithAuth<void>(`${API_BASE_URL}/api/v1/invites/decline`, {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken }),
    }, token);
  },
};

export const queryApi = {
  async ask(token: string, data: QueryRequest): Promise<QueryResponse> {
    console.log('[queryApi] POST /api/v1/query', data);
    try {
      const res = await fetchWithAuth<QueryResponse>(`${API_BASE_URL}/api/v1/query`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, token);
      console.log('[queryApi] Response:', res);
      return res;
    } catch (e: any) {
      console.error('[queryApi] Error:', e);
      throw e;
    }
  },
};

export const dashboardApi = {
  async listAllMinds(token: string): Promise<Mind[]> {
    const orgs = await fetchWithAuth<Org[]>(ORG_ENDPOINT, { method: 'GET' }, token);
    const groups = await Promise.all(
      orgs.map((org) =>
        fetchWithAuth<Mind[]>(`${ORG_ENDPOINT}/${org.id}/minds`, { method: 'GET' }, token)
      )
    );
    return groups.flat();
  },
};

const SUBSCRIPTION_ENDPOINT = `${API_BASE_URL}/api/v1/subscriptions`;

export const subscriptionApi = {
  async listPlans(token: string): Promise<SubscriptionPlan[]> {
    return fetchWithAuth<SubscriptionPlan[]>(`${SUBSCRIPTION_ENDPOINT}/plans`, { method: 'GET' }, token);
  },

  async getCurrent(token: string): Promise<SubscriptionCurrent> {
    return fetchWithAuth<SubscriptionCurrent>(`${SUBSCRIPTION_ENDPOINT}/current`, { method: 'GET' }, token);
  },

  async checkout(token: string, planCode: string): Promise<CheckoutSession> {
    return fetchWithAuth<CheckoutSession>(`${SUBSCRIPTION_ENDPOINT}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ planCode }),
    }, token);
  },

  async verify(token: string, reference: string): Promise<SubscriptionInfo> {
    return fetchWithAuth<SubscriptionInfo>(`${SUBSCRIPTION_ENDPOINT}/verify`, {
      method: 'POST',
      body: JSON.stringify({ reference }),
    }, token);
  },

  async getTransactions(token: string): Promise<PaymentTransaction[]> {
    return fetchWithAuth<PaymentTransaction[]>(`${SUBSCRIPTION_ENDPOINT}/transactions`, { method: 'GET' }, token);
  },

  async cancel(token: string): Promise<void> {
    return fetchWithAuth<void>(`${SUBSCRIPTION_ENDPOINT}/current`, { method: 'DELETE' }, token);
  },
};