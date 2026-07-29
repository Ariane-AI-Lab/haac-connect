import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/agent/password")({
  component: AgentPassword,
});

function AgentPassword() {
  const [form, setForm] = useState({ mot_de_passe_actuel: "", nouveau_mot_de_passe: "" });

  const change = useMutation({
    mutationFn: () =>
      api("/agents/me/password", {
        method: "PUT",
        body: JSON.stringify({
          mot_de_passe_actuel: form.mot_de_passe_actuel,
          nouveau_mot_de_passe: form.nouveau_mot_de_passe,
        }),
      }),
    onSuccess: () => {
      toast.success("Mot de passe mis à jour.");
      setForm({ mot_de_passe_actuel: "", nouveau_mot_de_passe: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Échec de la mise à jour"),
  });

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Modifier mon mot de passe</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Mot de passe actuel</span>
          <input
            required
            type="password"
            value={form.mot_de_passe_actuel}
            onChange={(e) => setForm({ ...form, mot_de_passe_actuel: e.target.value })}
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Nouveau mot de passe</span>
          <input
            required
            minLength={6}
            type="password"
            value={form.nouveau_mot_de_passe}
            onChange={(e) => setForm({ ...form, nouveau_mot_de_passe: e.target.value })}
            className="input mt-1"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={change.isPending}
            className="px-4 py-2 text-sm rounded-md bg-haac-green hover:bg-haac-green-dark text-white font-medium flex items-center gap-2 disabled:opacity-60"
          >
            {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Mettre à jour
          </button>
        </div>
      </form>
    </div>
  );
}
