import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import {
  api,
  type SerieJour,
  type ProblematiqueStat,
  type AgentStat,
} from "@/lib/api";

export const Route = createFileRoute("/admin/statistiques")({
  component: AdminStats,
});

type Periode = "jour" | "semaine" | "mois";

const COLORS = ["#008000", "#FFD700", "#CC0000", "#006400", "#f59e0b", "#3b82f6"];

function AdminStats() {
  const [periode, setPeriode] = useState<Periode>("semaine");

  const serie = useQuery({
    queryKey: ["admin", "stats", "serie", periode],
    queryFn: () => api<SerieJour[]>(`/admin/statistiques/serie?periode=${periode}`),
  });

  const problematiques = useQuery({
    queryKey: ["admin", "stats", "problematiques", periode],
    queryFn: () =>
      api<ProblematiqueStat[]>(`/admin/statistiques/problematiques?periode=${periode}`),
  });

  const agents = useQuery({
    queryKey: ["admin", "stats", "agents", periode],
    queryFn: () => api<AgentStat[]>(`/admin/statistiques/agents?periode=${periode}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-haac-green-darker">Statistiques</h1>
          <p className="text-sm text-muted-foreground">
            Analyse des conversations et performance des agents.
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["jour", "semaine", "mois"] as Periode[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize ${
                periode === p
                  ? "bg-white shadow text-haac-green-darker"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Évolution des conversations" loading={serie.isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={serie.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="conversations"
                name="Conversations"
                stroke="#008000"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="cloturees"
                name="Clôturées"
                stroke="#CC0000"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Répartition par problématique"
          loading={problematiques.isLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={problematiques.data ?? []}
                dataKey="total"
                nameKey="libelle"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {(problematiques.data ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Performance des agents"
          loading={agents.isLoading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={agents.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="nom" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="prises" name="Prises en charge" fill="#006400" />
              <Bar dataKey="cloturees" name="Clôturées" fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  loading,
  children,
  className = "",
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-haac-green" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}