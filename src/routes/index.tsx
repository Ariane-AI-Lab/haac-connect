import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAuth } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    const u = getAuth();
    if (!u) setTarget("/login");
    else if (u.role === "agent") setTarget("/agent/conversations");
    else setTarget("/admin/dashboard");
  }, []);
  if (!target) return null;
  return <Navigate to={target} />;
}