import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { api, type Problematique } from "@/lib/api";

export const Route = createFileRoute("/admin/problematiques")({
  component: AdminProblematiques,
});

function AdminProblematiques() {
  const qc = useQueryClient();
  const [libelle, setLibelle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "problematiques"],
    queryFn: () => api<Problematique[]>("/admin/problematiques"),
  });

  const create = useMutation({
    mutationFn: (v: string) =>
      api("/admin/problematiques", {
        method: "POST",
        body: JSON.stringify({ libelle: v }),
      }),
    onSuccess: () => {
      toast.success("Problématique ajoutée");
      setLibelle("");
      qc.invalidateQueries({ queryKey: ["admin", "problematiques"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: Problematique["id"]) =>
      api(`/admin/problematiques/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Problématique supprimée");
      qc.invalidateQueries({ queryKey: ["admin", "problematiques"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-haac-green-darker">Problématiques</h1>
        <p className="text-sm text-muted-foreground">
          Motifs proposés aux agents lors de la clôture d'une conversation.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (libelle.trim()) create.mutate(libelle.trim());
        }}
        className="bg-white border rounded-lg p-4 flex gap-2 shadow-sm"
      >
        <input
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder="Nouveau motif de clôture…"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={create.isPending || !libelle.trim()}
          className="bg-haac-green hover:bg-haac-green-dark text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Ajouter
        </button>
      </form>

      <div className="bg-white border rounded-lg shadow-sm">
        {isLoading && (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-haac-green" />
          </div>
        )}
        {!isLoading && (data ?? []).length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <Tag className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune problématique enregistrée.</p>
          </div>
        )}
        {!isLoading && (data ?? []).length > 0 && (
          <ul className="divide-y">
            {(data ?? []).map((p) => (
              <li
                key={p.id}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-haac-green" />
                  <span className="text-sm font-medium">{p.libelle}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer « ${p.libelle} » ?`)) remove.mutate(p.id);
                  }}
                  className="p-2 rounded hover:bg-red-50 text-haac-red"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}