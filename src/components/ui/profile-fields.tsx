import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ProfileFieldProps {
  label: string;
  value: string;
  editable: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  endpoint: string; // "/admin/me" | "/agent/me"
  fieldKey: "nom" | "email";
  queryKey: unknown[];
  type?: string;
}

export function ProfileField({
  label,
  value,
  editable,
  editing,
  onEdit,
  onCancel,
  endpoint,
  fieldKey,
  queryKey,
  type = "text",
}: ProfileFieldProps) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(value);

  const save = useMutation({
    mutationFn: () =>
      api(endpoint, { method: "PUT", body: JSON.stringify({ [fieldKey]: draft }) }),
    onSuccess: () => {
      toast.success(`${label} mis à jour.`);
      qc.invalidateQueries({ queryKey });
      onCancel();
    },
    onError: (e: Error) => toast.error(e.message || "Échec de la mise à jour"),
  });

  if (editing) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="input mt-1"
          />
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !draft.trim()}
          title="Enregistrer"
          className="p-2 rounded hover:bg-muted text-haac-green disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          onClick={() => {
            setDraft(value);
            onCancel();
          }}
          title="Annuler"
          className="p-2 rounded hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <p className="text-sm">{value}</p>
      </div>
      {editable && (
        <button
          onClick={onEdit}
          title={`Modifier ${label.toLowerCase()}`}
          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-haac-green"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface PasswordFieldProps {
  editable: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export function PasswordField({ editable, editing, onEdit, onCancel }: PasswordFieldProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  const change = useMutation({
    mutationFn: () =>
      api("/me/password", {
        method: "PUT",
        body: JSON.stringify({
          mot_de_passe_actuel: current,
          nouveau_mot_de_passe: next,
        }),
      }),
    onSuccess: () => {
      toast.success("Mot de passe mis à jour.");
      setCurrent("");
      setNext("");
      onCancel();
    },
    onError: (e: Error) => toast.error(e.message || "Mot de passe actuel incorrect."),
  });

  if (editing) {
    return (
      <div className="space-y-2 p-3 rounded-md border bg-muted/30">
        <div>
          <span className="text-xs font-medium text-muted-foreground">Mot de passe actuel</span>
          <input
            autoFocus
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="input mt-1"
          />
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground">Nouveau mot de passe</span>
          <input
            type="password"
            minLength={6}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="input mt-1"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setCurrent("");
              setNext("");
              onCancel();
            }}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-white"
          >
            Annuler
          </button>
          <button
            onClick={() => change.mutate()}
            disabled={change.isPending || !current || next.length < 6}
            className="px-3 py-1.5 text-sm rounded-md bg-haac-green hover:bg-haac-green-dark text-white font-medium flex items-center gap-2 disabled:opacity-60"
          >
            {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Valider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-xs font-medium text-muted-foreground">Mot de passe</span>
        <p className="text-sm">••••••••</p>
      </div>
      {editable && (
        <button
          onClick={onEdit}
          title="Modifier le mot de passe"
          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-haac-green"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}