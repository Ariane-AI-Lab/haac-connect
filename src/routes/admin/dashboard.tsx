import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Clock,
  CheckCheck,
  Users,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { api, type DashboardStats, type Conversation } from "@/lib/api";
import { timeAgo, truncate } from "@/lib/format";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api<DashboardStats>("/admin/dashboard"),
    refetchInterval: 30_000,
  });

  const recent = useQuery({
    queryKey: ["admin", "recent-conversations"],
    queryFn: () => api<Conversation[]>("/conversations-humaines"),
    refetchInterval: 30_000,
  });

  const s = stats.data;
  const cards = [
    {
      label: "En attente",
      value: s?.en_attente ?? 0,
      icon: Clock,
      color: "bg-haac-yellow/20 text-yellow-900",
      accent: "border-l-haac-yellow",
    },
    {
      label: "En cours",
      value: s?.en_cours ?? 0,
      icon: MessageSquare,
      color: "bg-haac-green/15 text-haac-green-darker",
      accent: "border-l-haac-green",
    },
    {
      label: "Clôturées aujourd'hui",
      value: s?.cloturees_jour ?? 0,
      icon: CheckCheck,
      color: "bg-blue-100 text-blue-800",
      accent: "border-l-blue-500",
    },
    {
      label: "Agents actifs",
      value: `${s?.agents_actifs ?? 0}/${s?.agents_total ?? 0}`,
      icon: Users,
      color: "bg-purple-100 text-purple-800",
      accent: "border-l-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-haac-green-darker">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble du système — actualisation automatique toutes les 30 secondes.
        </p>
      </div>

      {stats.isError && (
        <div className="text-sm text-haac-red bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Impossible de charger les statistiques.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`bg-white rounded-lg border-l-4 ${c.accent} border border-border shadow-sm p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-medium text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {stats.isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      c.value
                    )}
                  </div>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${c.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-haac-green" />
              Conversations en attente
            </h2>
            <Link to="/admin/conversations" className="text-xs text-haac-green hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="divide-y">
            {recent.isLoading && (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-haac-green" />
              </div>
            )}
            {!recent.isLoading &&
              (recent.data ?? [])
                .filter((c) => c.statut === "HUMAIN")
                .slice(0, 6)
                .map((c) => {
                  const first = (c.messages ?? [])[0];
                  return (
                    <div key={c.phone} className="px-5 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-haac-yellow/30 flex items-center justify-center text-xs font-semibold text-yellow-900">
                        {c.phone.slice(-2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {c.phone}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {truncate(first?.text || "(aucun message)", 80)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(c.en_attente_depuis || first?.timestamp)}
                      </div>
                    </div>
                  );
                })}
            {!recent.isLoading &&
              (recent.data ?? []).filter((c) => c.statut === "HUMAIN").length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune conversation en attente ✅
                </div>
              )}
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-haac-green" />
              Activité
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <Row label="Conversations totales" value={s?.total_conversations} />
            <Row label="Clôturées (total)" value={s?.cloturees_total} />
            <Row label="Messages aujourd'hui" value={s?.messages_jour} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value ?? "—"}</span>
    </div>
  );
}