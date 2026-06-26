import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2, MessageSquare, CheckCheck, Phone, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, getAuth, type Conversation } from "@/lib/api";
import { formatTime, formatDateTime, timeAgo, truncate } from "@/lib/format";

export const Route = createFileRoute("/agent/conversations")({
  component: AgentConversations,
});

type Tab = "waiting" | "mine" | "closed";

function AgentConversations() {
  const [tab, setTab] = useState<Tab>("waiting");
  const [countdown, setCountdown] = useState(30);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const me = getAuth();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["conversations-humaines"],
    queryFn: () => api<{ conversations: Conversation[] }>("/conversations-humaines").then((r) => r.conversations ?? []),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    setCountdown(30);
    const id = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 30 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [data]);

  const conversations = data ?? [];

  const waiting = useMemo(
    () => conversations.filter((c) => c.statut === "HUMAIN"),
    [conversations],
  );
  const mine = useMemo(
    () => conversations.filter((c) => c.statut === "PRISE" && c.agent === me?.nom),
    [conversations, me?.nom],
  );
  const closed = useMemo(
    () =>
      conversations.filter(
        (c) => c.statut === "IA" && c.agent_cloture === me?.nom,
      ),
    [conversations, me?.nom],
  );

  const takeMutation = useMutation({
    mutationFn: (phone: string) =>
      api(`/prendre-en-charge/${encodeURIComponent(phone)}`, { method: "POST" }),
    onSuccess: (_d, phone) => {
      toast.success("Conversation prise en charge");
      qc.invalidateQueries({ queryKey: ["conversations-humaines"] });
      setTab("mine");
      navigate({ to: "/agent/conversation/$phone", params: { phone } });
    },
    onError: (e: Error) => toast.error(e.message || "Échec de la prise en charge"),
  });

  const tabs: { id: Tab; label: string; count: number; icon: typeof Inbox }[] = [
    { id: "waiting", label: "En attente", count: waiting.length, icon: Inbox },
    { id: "mine", label: "Mes conversations", count: mine.length, icon: MessageSquare },
    { id: "closed", label: "Clôturées", count: closed.length, icon: CheckCheck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-haac-green-darker">Conversations</h1>
        <button
          onClick={() => refetch()}
          className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-white hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                active
                  ? "bg-white shadow text-haac-green-darker"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span
                className={`text-xs rounded-full px-1.5 min-w-5 text-center ${
                  active ? "bg-haac-green text-white" : "bg-background"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-haac-green" />
        </div>
      )}

      {isError && (
        <div className="text-sm text-haac-red bg-red-50 border border-red-200 rounded-md p-3">
          Impossible de charger les conversations.
        </div>
      )}

      {!isLoading && tab === "waiting" && (
        <WaitingList
          items={waiting}
          onTake={(p) => takeMutation.mutate(p)}
          taking={takeMutation.isPending ? takeMutation.variables : null}
        />
      )}

      {!isLoading && tab === "mine" && <MineList items={mine} />}

      {!isLoading && tab === "closed" && <ClosedList items={closed} />}

      <p className="text-xs text-center text-muted-foreground pt-4">
        Actualisation automatique dans {countdown}s
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Inbox; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-haac-green/10 flex items-center justify-center mb-3">
        <Icon className="h-8 w-8 text-haac-green" />
      </div>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

function WaitingList({
  items,
  onTake,
  taking,
}: {
  items: Conversation[];
  onTake: (phone: string) => void;
  taking: string | null | undefined;
}) {
  if (items.length === 0)
    return <EmptyState icon={Inbox} text="Aucune conversation en attente ✅" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => {
        const first = (c.messages ?? [])[0];
        return (
          <div
            key={c.phone}
            className="bg-white rounded-lg border p-4 flex flex-col gap-3 shadow-sm hover:shadow transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-haac-green" />
                {c.phone}
              </div>
              <span className="text-[10px] uppercase font-semibold bg-haac-yellow/30 text-yellow-900 px-2 py-0.5 rounded-full">
                En attente
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              En attente depuis {formatTime(c.en_attente_depuis || first?.timestamp)}
            </div>
            <p className="text-sm text-foreground/80 min-h-10">
              {truncate(first?.text || "(aucun message)", 120)}
            </p>
            <button
              onClick={() => onTake(c.phone)}
              disabled={taking === c.phone}
              className="mt-auto bg-haac-green hover:bg-haac-green-dark text-white font-medium text-sm py-2 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {taking === c.phone && <Loader2 className="h-4 w-4 animate-spin" />}
              Prendre en charge
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MineList({ items }: { items: Conversation[] }) {
  const navigate = useNavigate();
  if (items.length === 0)
    return <EmptyState icon={MessageSquare} text="Vous n'avez aucune conversation en cours." />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => {
        const last = (c.messages ?? [])[(c.messages ?? []).length - 1];
        return (
          <div
            key={c.phone}
            className="bg-white rounded-lg border p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-haac-green" />
                {c.phone}
              </div>
              <span className="text-[10px] uppercase font-semibold bg-haac-green/15 text-haac-green-darker px-2 py-0.5 rounded-full">
                En cours
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Prise en charge à {formatTime(c.date_prise_charge)}
            </div>
            <p className="text-sm text-foreground/80 min-h-10">
              {truncate(last?.text || "", 120)}
            </p>
            <button
              onClick={() =>
                navigate({ to: "/agent/conversation/$phone", params: { phone: c.phone } })
              }
              className="mt-auto bg-haac-green-darker hover:bg-haac-green-darker/90 text-white font-medium text-sm py-2 rounded-md transition"
            >
              Continuer
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ClosedList({ items }: { items: Conversation[] }) {
  const navigate = useNavigate();
  if (items.length === 0)
    return <EmptyState icon={CheckCheck} text="Aucune conversation clôturée pour le moment." />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div
          key={c.phone}
          className="bg-white rounded-lg border p-4 flex flex-col gap-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {c.phone}
            </div>
            <span className="text-[10px] uppercase font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Clôturée
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Clôturée le {formatDateTime(c.date_cloture)} ({timeAgo(c.date_cloture)})
          </div>
          <button
            onClick={() =>
              navigate({ to: "/agent/conversation/$phone", params: { phone: c.phone } })
            }
            className="mt-auto border border-input bg-white hover:bg-muted text-foreground font-medium text-sm py-2 rounded-md transition"
          >
            Voir l'historique
          </button>
        </div>
      ))}
    </div>
  );
}