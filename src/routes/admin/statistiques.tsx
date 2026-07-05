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
import { Loader2, Star } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/statistiques")({
  component: AdminStats,
});

type Periode = "aujourd'hui" | "semaine" | "mois" | "tout";

const COLORS = ["#008000", "#FFD700", "#CC0000", "#006400", "#f59e0b", "#3b82f6"];

function AdminStats() {
  const [periode, setPeriode] = useState<Periode>("semaine");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats", periode],
    queryFn: () =>
      api<{
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
      }>(`/admin/statistiques?periode=${periode}`),
  });

  const PERIODES: { id: Periode; label: string }[] = [
    { id: "aujourd'hui", label: "Aujourd'hui" },
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
    { id: "tout", label: "Tout" },
  ];

  // Fonction pour afficher des étoiles
  const renderStars = (note: number) => {
    return "⭐".repeat(note) + "☆".repeat(5 - note);
  };

  // Couleur de la barre de progression selon la note
  const barColor = (note: number) => {
    if (note >= 4) return "bg-green-500";
    if (note === 3) return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-haac-green-darker">
            Statistiques
          </h1>
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

      {/* Résumé chiffres clés */}
      {data?.resume && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total conversations"
            value={data.resume.total_conversations}
          />
          <StatCard label="Clôturées" value={data.resume.total_cloturees} />
          <StatCard label="En attente" value={data.resume.en_attente} />
          <StatCard
            label="Note globale"
            value={
              data.resume.note_client_globale != null
                ? `${data.resume.note_client_globale.toFixed(2)} / 5`
                : "—"
            }
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Évolution des conversations */}
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

        {/* Répartition par problématique */}
        <ChartCard title="Répartition par problématique" loading={isLoading}>
          {(data?.problematiques ?? []).length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
              Aucune problématique enregistrée pour cette période.
            </div>
          ) : (
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
                    `${(percent * 100).toFixed(0)}%`
                  }
                >
                  {(data?.problematiques ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Performance des agents */}
        <ChartCard
          title="Performance des agents"
          loading={isLoading}
          className="lg:col-span-2"
        >
          {(data?.stats_agents ?? []).length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
              Aucune donnée agent pour cette période.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data?.stats_agents ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="agent" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total_conversations"
                  name="Conversations traitées"
                  fill="#006400"
                />
                <Bar
                  dataKey="note_client_moy"
                  name="Note moyenne /5"
                  fill="#FFD700"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Répartition des avis clients — tableau */}
        <ChartCard
          title="Répartition des avis clients"
          loading={isLoading}
          className="lg:col-span-2"
        >
          {(data?.repartition_notes ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Aucun avis reçu pour cette période.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Note</th>
                    <th className="pb-3 pr-4 font-medium">Nombre d'avis</th>
                    <th className="pb-3 pr-4 font-medium">Pourcentage</th>
                    <th className="pb-3 font-medium">Répartition</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[5, 4, 3, 2, 1].map((note) => {
                    const row = (data?.repartition_notes ?? []).find(
                      (r) => r.note === note
                    );
                    const total = row?.total ?? 0;
                    const pct = row?.pourcentage ?? 0;
                    return (
                      <tr key={note} className="py-3">
                        <td className="py-3 pr-4">
                          <span className="text-base">
                            {renderStars(note)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-semibold">{total}</td>
                        <td className="py-3 pr-4 font-semibold">{pct}%</td>
                        <td className="py-3 w-48">
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor(note)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-haac-green-darker mt-1">{value}</p>
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