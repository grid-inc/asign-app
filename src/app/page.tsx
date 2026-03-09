"use client";

import { useState, useEffect, useCallback } from "react";
import type { MemberAssignment, ProjectInfo } from "@/lib/types";
import MemberView from "@/components/MemberView";
import ProjectView from "@/components/ProjectView";

type ViewMode = "member" | "project";

export default function Home() {
  const [members, setMembers] = useState<MemberAssignment[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("member");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salesforce");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || "Failed to fetch data");
      }
      const data = await res.json();
      setMembers(data.members);
      setProjects(data.projects);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const months = generateMonths(13);

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Header - compact */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">DS2アサイン丸わかりマン</h1>
          {/* View toggle */}
          <div className="flex bg-gray-200 rounded-lg p-0.5 text-sm">
            <button
              onClick={() => setViewMode("member")}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === "member" ? "bg-white shadow font-medium" : "text-gray-600"
              }`}
            >
              メンバー別
            </button>
            <button
              onClick={() => setViewMode("project")}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === "project" ? "bg-white shadow font-medium" : "text-gray-600"
              }`}
            >
              プロジェクト別
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && viewMode === "member" && <AlertBadges members={members} months={months} />}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "..." : "更新"}
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-red-50 text-red-700 p-4 m-4 rounded-lg">
          <p className="font-bold">エラー</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Salesforceからデータ取得中...
        </div>
      ) : (
        <div className="flex-1 overflow-auto relative">
          {viewMode === "member" ? (
            <MemberView data={members} months={months} />
          ) : (
            <ProjectView projects={projects} months={months} />
          )}
        </div>
      )}
    </main>
  );
}

function AlertBadges({ members, months }: { members: MemberAssignment[]; months: string[] }) {
  let overCount = 0;
  let idleCount = 0;

  members.forEach((member) => {
    months.forEach((month) => {
      let total = 0;
      member.projects.forEach((p) => {
        const mh = p.monthlyHours.find((h) => h.month === month);
        if (mh) total += mh.hours;
      });
      if (total > 160) overCount++;
      if (total === 0) idleCount++;
    });
  });

  return (
    <div className="flex items-center gap-2 text-xs">
      {overCount > 0 && (
        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
          過負荷 {overCount}
        </span>
      )}
      {idleCount > 0 && (
        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
          空き {idleCount}
        </span>
      )}
    </div>
  );
}

function generateMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}
