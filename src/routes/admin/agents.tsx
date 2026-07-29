import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  UserPlus,
  Power,
  Trash2,
  X,
  Users,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { api, type Agent } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/agents")({
  component: AdminAgents,
});

function AdminAgents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [roleEditAgent, setRoleEditAgent] = useState<Agent | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "agents"],
    queryFn: () => api<Agent[]>("/admin/agents"),
  });

  const toggle = useMutation({
    mutationFn: (a: Agent) =>
      api(`/admin/agents/${a.id}`, {
        method: "PUT",
        body: JSON.stringify({ actif: !a.actif }),
      }),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["admin", "agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (a: Agent) => api(`/admin/agents/${a.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Agent supprimé");
      qc.invalidateQueries({ queryKey: ["admin", "agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter(
    (a) =>
      a.nom.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-haac-green-darker">Gestion des agents</h1>
          <p className="text-sm text-muted-foreground">
            {data?.length ?? 0} agent(s) enregistré(s)
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-haac-green hover:bg-haac-green-dark text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition"
        >
          <UserPlus className="h-4 w-4" />
          Nouvel agent
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un agent…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-haac-green/30"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {isLoading && (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-haac-green" />
          </div>
        )}
        {isError && (
          <div className="p-6 text-sm text-haac-red">Impossible de charger les agents.</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucun agent trouvé.</p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Dernière connexion</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-haac-green/15 flex items-center justify-center text-xs font-bold text-haac-green-darker">
                          {a.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{a.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium capitalize">{a.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                          a.actif
                            ? "bg-haac-green/15 text-haac-green-darker"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.derniere_connexion ? formatDateTime(a.derniere_connexion) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setRoleEditAgent(a)}
                          title="Changer le rôle"
                          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-haac-green"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggle.mutate(a)}
                          disabled={toggle.isPending}
                          title={a.actif ? "Désactiver" : "Activer"}
                          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer définitivement ${a.nom} ?`))
                              remove.mutate(a);
                          }}
                          disabled={remove.isPending}
                          title="Supprimer"
                          className="p-2 rounded hover:bg-red-50 text-haac-red disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && <CreateAgentModal onClose={() => setCreating(false)} />}
      {roleEditAgent && (
        <ChangeRoleModal agent={roleEditAgent} onClose={() => setRoleEditAgent(null)} />
      )}
    </div>
  );
}

function CreateAgentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    password: "",
    role: "agent" as "agent" | "admin",
  });

  const create = useMutation({
    mutationFn: () =>
      api("/admin/creer-agent", {
        method: "POST",
        body: JSON.stringify({
          nom: form.nom,
          email: form.email,
          mot_de_passe: form.password || undefined,
          role: form.role,
        }),
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["admin", "agents"] });
      const temp = data?.mot_de_passe_temporaire;
      if (temp) {
        toast.success(`Agent créé — mot de passe temporaire: ${temp}`);
      } else {
        toast.success("Agent créé avec succès");
      }
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Échec de la création"),
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-haac-green" /> Nouvel agent
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="p-5 space-y-4"
        >
          <Field label="Nom complet">
            <input
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Mot de passe (laisser vide pour générer)">
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Rôle">
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "agent" | "admin" })
              }
              className="input"
            >
              <option value="agent">Agent</option>
              <option value="admin">Administrateur</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm rounded-md bg-haac-green hover:bg-haac-green-dark text-white font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer l'agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRoleModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<Agent["role"]>(agent.role);

  const save = useMutation({
    mutationFn: () =>
      api(`/admin/agents/${agent.id}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      qc.invalidateQueries({ queryKey: ["admin", "agents"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Changer le rôle de {agent.nom}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Rôle</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Agent["role"])}
              className="input mt-1"
            >
              <option value="agent">Agent</option>
              <option value="admin">Administrateur</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border hover:bg-muted"
            >
              Annuler
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || role === agent.role}
              className="px-4 py-2 text-sm rounded-md bg-haac-green hover:bg-haac-green-dark text-white font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}