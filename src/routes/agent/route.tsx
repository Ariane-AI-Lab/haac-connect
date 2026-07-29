import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { clearAuth, getAuth, type AuthUser } from "@/lib/api";
import logo from "@/assets/haac-logo.png";

export const Route = createFileRoute("/agent")({
  component: AgentLayout,
});

function AgentLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getAuth();
    if (!u || u.role !== "agent") {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
  }, [navigate]);

  function handleLogout() {
    clearAuth();
    navigate({ to: "/login" });
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-haac-green-darker text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/agent/conversations" className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="HAAC" className="h-10 w-auto bg-white rounded p-0.5" />
            <span className="font-semibold text-sm sm:text-base hidden sm:inline">
              Espace Agents — HAAC
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user.nom}</div>
              <div className="text-[11px] text-white/70 capitalize">{user.role}</div>
            </div>
            <Link
              to="/agent/profile"
              className="hidden sm:inline px-3 py-1 text-sm rounded-md border hover:bg-muted"
            >
              Profil
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}