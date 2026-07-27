const API_BASE = "https://haac-chatbot-api.onrender.com";

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
  text: string;
  timestamp: string;
  nom_agent?: string;
}

export interface Conversation {
  id: number;           // ← ajouter
  phone: string;
  statut: "IA" | "HUMAIN" | "PRISE" | "CLOTUREE";  // ← ajouter CLOTUREE
  agent?: string | null;
  agent_cloture?: string | null;
  date_prise_charge?: string | null;
  date_cloture?: string | null;
  messages: Message[];
  en_attente_depuis?: string;
}

export interface Agent {
  id: number | string;
  nom: string;
  email: string;
  role: "agent" | "admin" | "superadmin";
  actif: boolean;
  date_creation?: string;
  derniere_connexion?: string | null;
}

export interface DashboardStats {
  total_conversations: number;
  en_attente: number;
  en_cours: number;
  cloturees_jour: number;
  cloturees_total: number;
  agents_actifs: number;
  agents_total: number;
  messages_jour?: number;
}

export interface SerieJour {
  date: string;
  conversations: number;
  cloturees: number;
}

export interface ProblematiqueStat {
  libelle: string;
  total: number;
}

export interface AgentStat {
  nom: string;
  prises: number;
  cloturees: number;
}

export interface Problematique {
  id: number | string;
  libelle: string;
  actif?: boolean;
}

export interface StatsIA {
  periode: string;
  total_sessions_ia: number;
  total_handovers: number;
  taux_handover_pct: number;
  duree_reponse_moy_sec: number | null;
  sessions_par_periode: { jour: string; total: number }[];
}

export interface QuestionFrequente {
  phone: string;
  question: string;
  duree_sec: number | null;
  date: string;
}

export interface ThemeFrequent {
  theme: string;
  nombre: number;
}