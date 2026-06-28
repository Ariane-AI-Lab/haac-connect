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
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/statistiques")({
  component: AdminStats,
});

type Periode = "aujourd'hui" | "semaine" | "mois" | "tout";

const COLORS = ["#008000", "#FFD700", "#CC0000", "#006400", "#f59e0b", "#3b82f6"];

interface StatsResponse {
  resume: {
    total_conversations: number;
    total_cloturees: number;
    en_attente: number;
    en_cours: number;
    note_client_globale: number | null;
  };
  stats_agents: {
    agent: string;
    total_conversations: number;
    temps_attente_moy_min: number | null;
    temps_reponse_moy_min: number | null;
    note_client_moy: number | null;
    nb_notes: number;
    etoiles: number | null;
  }[];
  problematiques: { label: string; total: number }[];
  conversations_par_jour: { jour: string; total: number }[];
  repartition_notes: { note: number; total: number; pourcentage: number }[];
}

function AdminStats() {
  const [periode, setPeriode] = useState<Periode>("semaine");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats", periode],
    queryFn: () =>
      api<StatsResponse>(
        `/admin/statistiques?periode=${encodeURIComponent(periode)}`,
      ),
  });

  const PERIODES: { id: Periode; label: string }[] = [
    { id: "aujourd'hui", label: "Aujourd'hui" },
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
    { id: "tout", label: "Tout" },
  ];

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
          {PERIODES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriode(p.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                periode === p.id
                  ? "bg-white shadow text-haac-green-darker"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {data?.resume && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total conversations" value={data.resume.total_conversations} />
          <StatCard label="Clôturées" value={data.resume.total_cloturees} />
          <StatCard label="En attente" value={data.resume.en_attente} />
          <StatCard label="En cours" value={data.resume.en_cours} />
          <StatCard
            label="Note client globale"
            value={
              data.resume.note_client_globale != null
                ? `${data.resume.note_client_globale.toFixed(2)} / 5`
                : "—"
            }
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Évolution des conversations" loading={isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data?.conversations_par_jour ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="jour" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Conversations"
                stroke="#008000"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Répartition par problématique"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data?.problematiques ?? []}
                dataKey="total"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {(data?.problematiques ?? []).map((_, i) => (
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
          loading={isLoading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data?.stats_agents ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="agent" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_conversations" name="Conversations" fill="#006400" />
              <Bar dataKey="temps_attente_moy_min" name="Attente moy. (min)" fill="#FFD700" />
              <Bar dataKey="temps_reponse_moy_min" name="Réponse moy. (min)" fill="#CC0000" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Satisfaction client"
          loading={isLoading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={(data?.repartition_notes ?? []).map((r) => ({
                ...r,
                label: `⭐ ${r.note}`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Pourcentage"]}
                labelFormatter={(label) => `Note : ${label}`}
              />
              <Bar dataKey="pourcentage" name="Pourcentage">
                {(data?.repartition_notes ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="text-xs uppercase font-medium text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 text-haac-green-darker">{value}</div>
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