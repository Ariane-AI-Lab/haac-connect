import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { api, saveAuth, type AuthUser } from "@/lib/api";
import logo from "@/assets/haac-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "agent" | "admin";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("agent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setShow(false);
  }, [mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const data = await api<{
        access_token: string;
        token_type: string;
        nom: string;
        role: AuthUser["role"];
      }>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          mot_de_passe: password,
          remember_me: rememberMe,
        }),
      });

      const isAdminRole = data.role === "admin" || data.role === "superadmin";
      const isAgentRole = data.role === "agent" || isAdminRole;

      if (mode === "agent" && !isAgentRole) {
        toast.error("Ce compte n'a pas accès à l'espace agent");
        setLoading(false);
        return;
      }
      if (mode === "admin" && !isAdminRole) {
        toast.error("Ce compte n'est pas un compte administrateur");
        setLoading(false);
        return;
      }

      saveAuth({ token: data.access_token, nom: data.nom, role: data.role }, rememberMe);
      toast.success(`Bienvenue ${data.nom}`);
      if (mode === "agent") navigate({ to: "/agent/conversations" });
      else navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-haac-green-darker via-haac-green-dark to-haac-green p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="HAAC" className="h-24 w-auto object-contain" />
        </div>
        <h1 className="text-center text-xl font-bold text-haac-green-darker mb-1">HAAC Chatbot</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">Espace de gestion</p>

        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setMode("agent")}
            className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "agent"
                ? "bg-haac-green text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" /> Agent
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "admin"
                ? "bg-haac-green text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4" /> Administrateur
          </button>
        </div>

        <h2 className="text-center text-base font-semibold mb-4">
          {mode === "agent" ? "Connexion Agent" : "Connexion Administrateur"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-haac-green"
              placeholder="email@haac.bj"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-haac-green"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-haac-green"
            />
            Se souvenir de moi sur cet appareil
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-haac-green hover:bg-haac-green-dark text-white font-semibold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Se connecter
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Haute Autorité de l'Audiovisuel et de la Communication — Bénin
        </p>
      </div>
    </div>
  );
}
