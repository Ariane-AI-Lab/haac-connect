import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Search, MessageSquare, RefreshCw } from "lucide-react";
import { api, type Conversation } from "@/lib/api";
import { formatDateTime, timeAgo, truncate } from "@/lib/format";

export const Route = createFileRoute("/admin/conversations")({
  component: AdminConversations,
});

type Filter = "all" | "HUMAIN" | "PRISE" | "IA";

const LABELS: Record<Filter, string> = {
  all: "Toutes",
  HUMAIN: "En attente",
  PRISE: "En cours",
  IA: "Clôturées / IA",
};

function AdminConversations() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "all-conversations"],
    queryFn: () => api<{ conversations: Conversation[] }>("/conversations-humaines").then((r) => r.conversations ?? []),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (filter !== "all") list = list.filter((c) => c.statut === filter);
    if (search)
      list = list.filter(
        (c) =>
          c.phone.includes(search) ||
          (c.agent ?? "").toLowerCase().includes(search.toLowerCase()),
      );
    return list;
  }, [data, filter, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-haac-green-darker">
            Supervision des conversations
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualisation en temps réel de toutes les conversations.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-white hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
          {(Object.keys(LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                filter === f
                  ? "bg-white shadow text-haac-green-darker"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LABELS[f]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numéro ou agent…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-haac-green/30"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {isLoading && (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-haac-green" />
          </div>
        )}
        {isError && (
          <div className="p-6 text-sm text-haac-red">
            Impossible de charger les conversations.
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune conversation trouvée.</p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Numéro</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Dernier message</th>
                  <th className="px-4 py-3 font-medium">Activité</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => {
                  const last = (c.messages ?? [])[(c.messages ?? []).length - 1];
                  return (
                    <tr key={c.phone} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{c.phone}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.statut} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.agent || c.agent_cloture || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                        {truncate(last?.text || "", 60)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {c.en_attente_depuis ? (
                          <>
                            <div>{formatDateTime(c.en_attente_depuis)}</div>
                            <div className="opacity-70">{timeAgo(c.en_attente_depuis)}</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/agent/conversation/$phone"
                          params={{ phone: c.phone }}
                          className="text-xs text-haac-green hover:underline font-medium"
                        >
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Conversation["statut"] }) {
  const map = {
    HUMAIN: { label: "En attente", cls: "bg-haac-yellow/30 text-yellow-900" },
    PRISE: { label: "En cours", cls: "bg-haac-green/15 text-haac-green-darker" },
    IA: { label: "IA / Clôturée", cls: "bg-muted text-muted-foreground" },
  };
  const cfg = map[status];
  return (
    <span
      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}