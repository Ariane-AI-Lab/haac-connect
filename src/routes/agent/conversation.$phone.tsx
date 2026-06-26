import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { api, getAuth, type Conversation } from "@/lib/api";
import { formatTime } from "@/lib/format";

export const Route = createFileRoute("/agent/conversation/$phone")({
  component: ConversationView,
});

const PROBLEMATIQUES = [
  "Plainte contre une chaîne de télévision",
  "Plainte contre une station de radio",
  "Demande d'autorisation d'exploitation",
  "Demande d'information sur la réglementation",
  "Signalement de contenu illicite",
  "Demande de renouvellement de licence",
  "Problème technique lié à la diffusion",
  "Demande de rendez-vous",
  "Autre",
];

function ConversationView() {
  const { phone } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = getAuth();
  const [reply, setReply] = useState("");
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conversations-humaines"],
    queryFn: () => api<Conversation[]>("/conversations-humaines"),
    refetchInterval: 10_000,
  });

  const conv = useMemo(
    () => data?.find((c) => c.phone === phone),
    [data, phone],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [(conv?.messages ?? []).length]);

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api(`/repondre/${encodeURIComponent(phone)}`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["conversations-humaines"] });
    },
    onError: (e: Error) => toast.error(e.message || "Échec de l'envoi"),
  });

  const isMine = conv?.statut === "PRISE" && conv.agent === me?.nom;
  const isClosed =
    conv?.statut === "IA" && conv.agent_cloture === me?.nom;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Link
          to="/agent/conversations"
          className="p-2 rounded-md hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{phone}</div>
          {conv && (
            <div className="text-xs text-muted-foreground">
              {isMine && "En cours avec vous"}
              {isClosed && "Conversation clôturée — lecture seule"}
              {!isMine && !isClosed && conv.statut === "HUMAIN" && "En attente"}
            </div>
          )}
        </div>
        {conv && (
          <span
            className={`text-[10px] uppercase font-semibold px-2 py-1 rounded-full ${
              isClosed
                ? "bg-muted text-muted-foreground"
                : conv.statut === "HUMAIN"
                ? "bg-haac-yellow/30 text-yellow-900"
                : "bg-haac-green/15 text-haac-green-darker"
            }`}
          >
            {isClosed ? "Clôturée" : conv.statut === "HUMAIN" ? "En attente" : "En cours"}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-1 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-haac-green" />
          </div>
        )}
        {isError && (
          <p className="text-center text-sm text-haac-red">Erreur de chargement</p>
        )}
        {(conv?.messages ?? []).map((m, i) => {
          const isClient = m.expediteur === "client";
          return (
            <div
              key={i}
              className={`flex ${isClient ? "justify-start" : "justify-end"}`}
            >
              <div className={`max-w-[80%] sm:max-w-[70%]`}>
                <div
                  className={`text-[10px] mb-1 font-medium ${
                    isClient ? "text-muted-foreground" : "text-haac-green-darker text-right"
                  }`}
                >
                  {isClient
                    ? "Client"
                    : m.nom_agent || (m.expediteur === "ia" ? "Assistant IA" : me?.nom || "Agent")}
                  <span className="text-muted-foreground"> · {formatTime(m.timestamp)}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    isClient
                      ? "bg-muted text-foreground rounded-bl-sm"
                      : "bg-haac-green text-white rounded-br-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        {conv && (conv.messages ?? []).length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Aucun message</p>
        )}
      </div>

      {isMine && (
        <div className="border-t bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-4 space-y-2">
          <button
            onClick={() => setClosing(true)}
            className="w-full bg-haac-red text-white text-sm font-semibold py-2 rounded-md hover:opacity-90 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" /> Clôturer la session
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reply.trim()) sendMutation.mutate(reply.trim());
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Écrire une réponse..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (reply.trim()) sendMutation.mutate(reply.trim());
                }
              }}
              className="flex-1 resize-none border border-input rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-haac-green min-h-10 max-h-32"
            />
            <button
              type="submit"
              disabled={!reply.trim() || sendMutation.isPending}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-haac-green text-white hover:bg-haac-green-dark disabled:opacity-50"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {isClosed && (
        <div className="border-t bg-muted/50 -mx-4 sm:-mx-6 px-4 py-3 text-center text-sm text-muted-foreground">
          Session clôturée — lecture seule
        </div>
      )}

      {closing && (
        <CloseModal
          phone={phone}
          onClose={() => setClosing(false)}
          onClosed={() => {
            qc.invalidateQueries({ queryKey: ["conversations-humaines"] });
            navigate({ to: "/agent/conversations" });
          }}
        />
      )}
    </div>
  );
}

function CloseModal({
  phone,
  onClose,
  onClosed,
}: {
  phone: string;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [problematique, setProblematique] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api(`/cloturer-session/${encodeURIComponent(phone)}`, {
        method: "POST",
        body: JSON.stringify({
          problematique,
          commentaire_agent: commentaire,
        }),
      }),
    onSuccess: () => {
      toast.success("Session clôturée");
      onClosed();
    },
    onError: (e: Error) => toast.error(e.message || "Échec de la clôture"),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">Clôturer la session</h3>
            <p className="text-sm text-muted-foreground">
              Veuillez renseigner les informations suivantes avant de clôturer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!problematique) {
              toast.error("Veuillez sélectionner une problématique");
              return;
            }
            mutation.mutate();
          }}
          className="p-5 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Problématique traitée <span className="text-haac-red">*</span>
            </label>
            <select
              value={problematique}
              onChange={(e) => setProblematique(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-haac-green"
            >
              <option value="">— Choisir —</option>
              {PROBLEMATIQUES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Commentaire (optionnel)</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-haac-green"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-input text-sm hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-md bg-haac-red text-white text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Clôturer la session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}