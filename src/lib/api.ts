const API_BASE = "https://overprompt-solfataric-johnathon.ngrok-free.dev";

export interface AuthUser {
  token: string;
  nom: string;
  role: "agent" | "admin" | "superadmin";
}

const STORAGE_KEY = "haac_auth";

export function saveAuth(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(headers as Record<string, string> | undefined),
  };
  if (auth) {
    const user = getAuth();
    if (user?.token) h.Authorization = `Bearer ${user.token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError("Session expirée", 401);
  }
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      msg = data.detail || data.message || msg;
    } catch {
      /* noop */
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- Types ----
export interface Message {
  expediteur: "client" | "agent" | "ia" | string;
  contenu: string;
  horodatage: string;
  nom_agent?: string;
}

export interface Conversation {
  numero_whatsapp: string;
  statut: "IA" | "HUMAIN" | "PRISE";
  agent?: string | null;
  agent_cloture?: string | null;
  date_prise_charge?: string | null;
  date_cloture?: string | null;
  messages: Message[];
  derniere_activite?: string;
}