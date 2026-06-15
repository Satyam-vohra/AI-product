export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type ApiEnvelope<T> = {
  status: "success" | "error";
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "User" | "Company" | "ServiceEngineer" | "Admin";
  companyId?: string;
};

export type AuthState = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type ProductRecord = {
  _id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  manualUrl?: string;
  videoUrl?: string;
  imageUrls: string[];
  updatedAt?: string;
};

export type KnowledgeRecord = {
  _id: string;
  title: string;
  content?: string;
  tags: string[];
  fileUrl?: string;
  productId?: { _id: string; sku: string; name: string };
  updatedAt?: string;
};

export type ChatMessage = {
  sender: "user" | "ai" | "agent";
  message: string;
  timestamp: string;
};

export type DiagnosticSession = {
  _id: string;
  productId: ProductRecord | string;
  chatHistory: ChatMessage[];
  resolutionStatus: string;
  updatedAt: string;
};

const storageKey = "mantis.auth";

export function getAuthState(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function setAuthState(state: AuthState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearAuthState() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers);
  const auth = getAuthState();

  if (auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Request failed with ${response.status}`);
  }
  return payload;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: Record<string, unknown>) =>
    request<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  profile: () => request<{ user: AuthUser }>("/auth/profile"),

  products: (query = "") =>
    request<{ products: ProductRecord[] }>(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`),

  knowledge: (query = "") =>
    request<{ kbEntries: KnowledgeRecord[] }>(`/kb${query ? `?search=${encodeURIComponent(query)}` : ""}`),

  search: (query: string) =>
    request<{ products: ProductRecord[]; knowledge: KnowledgeRecord[]; query: string }>(`/search?q=${encodeURIComponent(query)}`),

  uploadKnowledge: (formData: FormData) =>
    request<{ kbEntry: KnowledgeRecord }>("/kb", {
      method: "POST",
      body: formData,
    }),

  updateProduct: (id: string, formData: FormData) =>
    request<{ product: ProductRecord }>(`/products/${id}`, {
      method: "PUT",
      body: formData,
    }),

  createProduct: (payload: { sku: string; name: string; category: string; description: string }) =>
    request<{ product: ProductRecord }>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  userDashboard: () => request<{ metrics: Record<string, number>; recentDiagnosticSessions: DiagnosticSession[] }>("/dashboards/user"),

  userSessions: () => request<{ sessions: DiagnosticSession[] }>("/sessions/user"),

  createSession: (productId?: string) =>
    request<{ session: DiagnosticSession }>("/sessions", {
      method: "POST",
      body: JSON.stringify(productId ? { productId } : {}),
    }),

  sendSessionMessage: (sessionId: string, message: string, contextPart?: string) =>
    request<{ chatHistory: ChatMessage[]; resolutionStatus: string }>(`/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message, contextPart }),
    }),

  notifications: () => request<{ notifications: Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }> }>("/notifications"),

  acknowledgeNotification: (id: string) =>
    request<{ id: string; read: boolean }>(`/notifications/${encodeURIComponent(id)}/ack`, {
      method: "POST",
    }),

  track: (name: string, properties: Record<string, unknown> = {}) =>
    request<{ eventId: string }>("/analytics/events", {
      method: "POST",
      body: JSON.stringify({
        name,
        path: typeof window === "undefined" ? undefined : window.location.pathname,
        properties,
      }),
    }),
};
