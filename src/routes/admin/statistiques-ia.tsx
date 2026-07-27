import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2, Bot, MessageCircleQuestion, ArrowRightLeft, Timer } from "lucide-react";
import { api, type StatsIA, type QuestionFrequente, type ThemeFrequent } from "@/lib/api";

export const Route = createFileRoute("/admin/statistiques-ia")({
  component: AdminStatsIA,
});

type Periode = "aujourd'hui" | "semaine" | "mois" | "tout";

function AdminStatsIA() {
  const [periode, setPeriode] = useState<Periode>("semaine");

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin", "stats-ia", periode],
    queryFn: () => api<StatsIA>(`/admin/stats-ia?periode=${periode}`),
  });

  const { data: themesData, isLoading: loadingThemes } = useQuery({
    queryKey: ["admin", "themes-frequents", periode],
    queryFn: () =>
      api<{ themes: ThemeFrequent[]; total_sessions_analysees: number }>(
        `/admin/themes-frequents?periode=${periode}`,
      ),
  });

  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ["admin", "questions-frequentes"],
    queryFn: () =>
      api<{ questions: QuestionFrequente[] }>(`/admin/questions-frequentes?limite=10`),
  });

  const PERIODES: { id: Periode; label: string }[] = [
    { id: "aujourd'hui", label: "Aujourd'hui" },
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
    { id: "tout", label: "Tout" },
  ];

  const themes = themesData?.themes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-haac-green-darker">
            Statistiques IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Performance de l'assistant conversationnel et sujets traités.
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Bot}
          label="Sessions IA"
          value={stats?.total_sessions_ia ?? "—"}
          loading={loadingStats}
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Transférées à un agent"
          value={stats?.total_handovers ?? "—"}
          loading={loadingStats}
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Taux de transfert"
          value={stats ? `${stats.taux_handover_pct}%` : "—"}
          loading={loadingStats}
        />
        <StatCard
          icon={Timer}
          label="Temps de réponse moyen"
          value={
            stats?.duree_reponse_moy_sec != null
              ? `${stats.duree_reponse_moy_sec}s`
              : "—"
          }
          loading={loadingStats}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Évolution des sessions IA */}
        <ChartCard title="Évolution des sessions IA" loading={loadingStats}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats?.sessions_par_periode ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="jour" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Sessions IA"
                stroke="#008000"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Thèmes les plus fréquents */}
        <ChartCard title="Sujets les plus fréquents" loading={loadingThemes}>
          {themes.filter((t) => t.nombre > 0).length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
              Aucun sujet identifié pour cette période.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={themes.filter((t) => t.nombre > 0)}
                layout="vertical"
                margin={{ left: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="theme"
                  fontSize={11}
                  width={140}
                  tick={{ width: 130 }}
                />
                <Tooltip />
                <Bar dataKey="nombre" name="Sessions" fill="#006400" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Dernières questions posées à l'IA */}
        <ChartCard
          title="Dernières questions posées"
          loading={loadingQuestions}
          className="lg:col-span-2"
        >
          {(questionsData?.questions ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Aucune question enregistrée pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Numéro</th>
                    <th className="pb-3 pr-4 font-medium">Question</th>
                    <th className="pb-3 pr-4 font-medium">Temps de réponse</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(questionsData?.questions ?? []).map((q, i) => (
                    <tr key={i}>
                      <td className="py-3 pr-4 whitespace-nowrap flex items-center gap-1.5">
                        <MessageCircleQuestion className="h-3.5 w-3.5 text-haac-green shrink-0" />
                        {q.phone}
                      </td>
                      <td className="py-3 pr-4 max-w-md">{q.question}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {q.duree_sec != null ? `${q.duree_sec}s` : "—"}
                      </td>
                      <td className="py-3 whitespace-nowrap text-muted-foreground">
                        {q.date}
                      </td>
                    </tr>
                  ))}
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
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Bot;
  label: string;
  value: number | string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-bold text-haac-green-darker mt-1">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
      </p>
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
