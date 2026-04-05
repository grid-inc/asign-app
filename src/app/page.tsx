"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import type { MemberAssignment, ProjectInfo } from "@/lib/types";
import MemberView from "@/components/MemberView";
import ProjectView from "@/components/ProjectView";

type ViewMode = "member" | "project";

export default function Home() {
  const { data: session, status } = useSession();
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

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (session && !dataLoaded) {
      fetchData().then(() => setDataLoaded(true));
    }
  }, [session, dataLoaded, fetchData]);

  const months = generateMonths(13);

  if (status === "loading") {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">読み込み中...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-80 text-center">
          <h1 className="text-lg font-bold mb-4">DS2工数ダッシュボード</h1>
          <p className="text-sm text-gray-500 mb-4">gridpredict.co.jpアカウントでログイン</p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-500 text-white rounded py-2 text-sm hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Googleでログイン
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Header - compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-600 tracking-tight">DS2工数ダッシュボード</h1>
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
              <button
                onClick={() => setViewMode("member")}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === "member" ? "bg-white shadow font-medium text-blue-600" : "text-gray-500"
                }`}
              >
                メンバー別
              </button>
              <button
                onClick={() => setViewMode("project")}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === "project" ? "bg-white shadow font-medium text-blue-600" : "text-gray-500"
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
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "..." : "更新"}
            </button>
            <span className="text-xs text-gray-400">{session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ログアウト
            </button>
          </div>
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
