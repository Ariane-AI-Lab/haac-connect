import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Tag,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { clearAuth, getAuth, type AuthUser } from "@/lib/api";
import logo from "@/assets/haac-logo.png";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/admin/agents", label: "Agents", icon: Users },
  { to: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/admin/problematiques", label: "Problématiques", icon: Tag },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const u = getAuth();
    if (!u || (u.role !== "admin" && u.role !== "superadmin")) {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
  }, [navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!user) return null;

  function logout() {
    clearAuth();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-haac-green-darker text-white shadow sticky top-0 z-30">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-1.5 rounded hover:bg-white/10"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="HAAC" className="h-10 w-auto bg-white rounded p-0.5" />
              <div className="hidden sm:block min-w-0">
                <div className="font-semibold text-sm leading-tight truncate">
                  Administration — HAAC
                </div>
                <div className="text-[11px] text-white/70 truncate">
                  Haute Autorité de l'Audiovisuel et de la Communication
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user.nom}</div>
              <div className="text-[11px] text-white/70 capitalize">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-haac-red hover:opacity-90 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`fixed lg:sticky top-16 left-0 z-20 h-[calc(100vh-4rem)] w-64 bg-white border-r transition-transform ${
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                    active
                      ? "bg-haac-green text-white"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        {open && (
          <div
            className="fixed inset-0 top-16 bg-black/30 z-10 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}