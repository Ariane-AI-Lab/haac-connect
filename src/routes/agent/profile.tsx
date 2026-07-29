import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";
import { api, clearAuth } from "@/lib/api";
import { ProfileField, PasswordField } from "@/components/ui/profile-fields";

export const Route = createFileRoute("/agent/profile")({
  component: AgentProfile,
});

interface Profile {
  id: number;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  cree_le: string | null;
}

function AgentProfile() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [editingField, setEditingField] = useState<"nom" | "email" | "password" | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["agent", "me"],
    queryFn: () => api<Profile>("/agent/me"),
  });

  function logout() {
    clearAuth();
    navigate({ to: "/login" });
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/agent/conversations"
            title="Retour aux conversations"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold">Profil</h2>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="text-sm text-haac-green hover:underline font-medium"
          >
            Modifier mes informations
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-haac-green" />
        </div>
      )}

      {profile && (
        <div className="space-y-3">
          <ProfileField
            label="Nom"
            value={profile.nom}
            editable={editMode}
            editing={editingField === "nom"}
            onEdit={() => setEditingField("nom")}
            onCancel={() => setEditingField(null)}
            endpoint="/agent/me"
            fieldKey="nom"
            queryKey={["agent", "me"]}
          />
          <ProfileField
            label="Email"
            value={profile.email}
            editable={editMode}
            editing={editingField === "email"}
            onEdit={() => setEditingField("email")}
            onCancel={() => setEditingField(null)}
            endpoint="/agent/me"
            fieldKey="email"
            queryKey={["agent", "me"]}
            type="email"
          />
          <PasswordField
            editable={editMode}
            editing={editingField === "password"}
            onEdit={() => setEditingField("password")}
            onCancel={() => setEditingField(null)}
          />
        </div>
      )}

      <div className="pt-2 border-t flex justify-between items-center">
        {editMode ? (
          <button
            onClick={() => {
              setEditMode(false);
              setEditingField(null);
            }}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
          >
            Terminer la modification
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border hover:bg-muted text-haac-red"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}