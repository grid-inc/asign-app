"use client";

import { useState, useMemo } from "react";
import type { ProjectInfo } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  "プリセ": "#10b981",
  "先行着手（内示なし）": "#f59e0b",
  "本開発": "#3b82f6",
  "保守": "#8b5cf6",
  "社内": "#9ca3af",
};

const TEAM_BADGE: Record<string, string> = {
  "A": "bg-blue-100 text-blue-700",
  "B": "bg-green-100 text-green-700",
  "C": "bg-purple-100 text-purple-700",
};

interface ProjectViewProps {
  projects: ProjectInfo[];
  months: string[];
}

export default function ProjectView({ projects, months }: ProjectViewProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [hideShanai, setHideShanai] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  // Extract unique domains
  const domains = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.domain) set.add(p.domain); });
    return Array.from(set).sort();
  }, [projects]);

  const isShanaiProject = (p: ProjectInfo) =>
    p.projectName.startsWith("COM_") || p.projectName.startsWith("PLN_") ||
    p.projectName.startsWith("PRE_") || p.projectName.startsWith("ETC_");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (hideShanai && isShanaiProject(p)) return false;
      if (selectedDomain !== "all" && p.domain !== selectedDomain) return false;
      return true;
    });
  }, [projects, hideShanai, selectedDomain]);

  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-1.5 bg-white border-b border-gray-200 text-xs">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={hideShanai}
            onChange={(e) => setHideShanai(e.target.checked)}
            className="rounded"
          />
          社内PJ非表示
        </label>
        <span className="text-gray-400">|</span>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="border border-gray-300 rounded px-1.5 py-0.5 bg-white text-xs"
        >
          <option value="all">全ドメイン</option>
          {domains.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">{filtered.length}件</span>
        <span className="text-gray-400">|</span>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded" style={{ backgroundColor: color }} />
            {type === "先行着手（内示なし）" ? "先行着手" : type}
          </span>
        ))}
      </div>

      <table className="w-full border-collapse text-xs" style={{ borderSpacing: 0 }}>
        <thead className="sticky top-0 z-30">
          <tr className="bg-slate-50 text-slate-500 border-b border-gray-200">
            <th className="sticky left-0 z-40 bg-slate-50 px-2 py-1.5 text-left w-[80px]">顧客</th>
            <th className="sticky left-[80px] z-40 bg-slate-50 px-2 py-1.5 text-left min-w-[260px]">プロジェクト</th>
            <th className="bg-slate-50 px-2 py-1.5 text-left w-[60px]">PM</th>
            <th className="bg-slate-50 px-2 py-1.5 text-center w-[40px]">人数</th>
            {months.map((m) => (
              <th key={m} className="bg-slate-50 px-1 py-1.5 text-center min-w-[80px]">{fmtMonth(m)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((project) => {
            const isExpanded = expandedProject === project.projectName;
            // Calculate total hours per month across all members
            const monthTotals = new Map<string, number>();
            project.members.forEach((m) => {
              m.monthlyHours.forEach((mh) => {
                monthTotals.set(mh.month, (monthTotals.get(mh.month) || 0) + mh.hours);
              });
            });

            // Unique member count
            const uniqueMembers = new Set(project.members.map((m) => m.memberName));

            // Hours by type per month
            const monthByType = new Map<string, Map<string, number>>();
            project.members.forEach((m) => {
              m.monthlyHours.forEach((mh) => {
                if (mh.hours <= 0) return;
                if (!monthByType.has(mh.month)) monthByType.set(mh.month, new Map());
                const tm = monthByType.get(mh.month)!;
                tm.set(m.manHoursType, (tm.get(m.manHoursType) || 0) + mh.hours);
              });
            });

            // Dominant type for this project (most hours)
            const typeTotals = new Map<string, number>();
            project.members.forEach((m) => {
              m.monthlyHours.forEach((mh) => {
                typeTotals.set(m.manHoursType, (typeTotals.get(m.manHoursType) || 0) + mh.hours);
              });
            });
            let dominantType = "社内";
            let maxTypeHours = 0;
            for (const [t, h] of typeTotals) {
              if (h > maxTypeHours) { dominantType = t; maxTypeHours = h; }
            }

            return (
              <>
                {/* Project summary row */}
                <tr
                  key={project.projectName}
                  className={`border-t border-gray-300 cursor-pointer hover:bg-blue-50 ${isExpanded ? "bg-blue-50 font-medium" : ""}`}
                  onClick={() => setExpandedProject(isExpanded ? null : project.projectName)}
                >
                  <td className="sticky left-0 z-10 bg-white px-2 py-1.5 border-r border-r-gray-200 truncate text-gray-600" title={project.customerName}>
                    {project.customerName}
                  </td>
                  <td className="sticky left-[80px] z-10 bg-white px-2 py-1.5 border-r border-r-gray-200">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 w-3">{isExpanded ? "▼" : "▶"}</span>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: TYPE_COLORS[dominantType] || "#ccc" }}
                        title={dominantType}
                      />
                      <span className="truncate" title={project.projectName}>{project.projectName}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 border-r border-r-gray-200 truncate text-gray-600" title={project.pm}>
                    {project.pm ? project.pm.split(" ")[0] : ""}
                  </td>
                  <td className="px-2 py-1.5 border-r border-r-gray-200 text-center font-bold">
                    {uniqueMembers.size}
                  </td>
                  {months.map((month) => {
                    const total = Math.round(monthTotals.get(month) || 0);
                    const typeMap = monthByType.get(month);
                    return (
                      <td key={month} className="px-1 py-1.5 border-r border-r-gray-200">
                        {total > 0 && typeMap ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-full h-3 flex rounded overflow-hidden">
                              {["先行着手（内示なし）", "プリセ", "本開発", "保守", "社内"].map((type) => {
                                const h = typeMap.get(type) || 0;
                                if (h === 0) return null;
                                const pct = (h / total) * 100;
                                return (
                                  <div
                                    key={type}
                                    style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] }}
                                    title={`${type}: ${Math.round(h)}h`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-[10px] font-medium text-gray-700">
                              {total}h
                            </span>
                          </div>
                        ) : (
                          <div className="text-center text-gray-200 text-[10px]">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Expanded: show members */}
                {isExpanded && (
                  <>
                    {/* Project dates info */}
                    {(project.contractStartDate || project.developmentStartDate) && (
                      <tr className="bg-yellow-50 border-b border-yellow-100">
                        <td colSpan={4 + months.length} className="px-6 py-1 text-[10px] text-yellow-800">
                          {project.contractStartDate && <span className="mr-4">契約: {project.contractStartDate} ~ {project.contractEndDate}</span>}
                          {project.developmentStartDate && <span className="mr-4">開発: {project.developmentStartDate} ~ {project.developmentEndDate}</span>}
                          {project.phase && <span>進捗: {project.phase}</span>}
                        </td>
                      </tr>
                    )}
                    {(() => {
                      // Group members by name, merge types into one row
                      const memberGroups = new Map<string, typeof project.members>();
                      project.members.forEach((m) => {
                        if (!memberGroups.has(m.memberName)) memberGroups.set(m.memberName, []);
                        memberGroups.get(m.memberName)!.push(m);
                      });
                      return Array.from(memberGroups.entries()).map(([name, entries], idx) => {
                        const team = entries[0].team;
                        // Collect types this member has
                        const types = [...new Set(entries.map((e) => e.manHoursType))];
                        const rowBg = idx % 2 === 0 ? "bg-gray-50" : "bg-white";
                        return (
                          <tr
                            key={`${project.projectName}-${name}`}
                            className={`${rowBg} border-b border-gray-100 hover:!bg-blue-50 group`}
                          >
                            <td className={`sticky left-0 z-10 ${rowBg} group-hover:!bg-blue-50 border-r border-r-gray-200`} />
                            <td className={`sticky left-[80px] z-10 ${rowBg} group-hover:!bg-blue-50 px-2 py-0.5 border-r border-r-gray-200`}>
                              <div className="flex items-center gap-1.5 pl-5">
                                <span className={`text-[9px] px-1 rounded ${TEAM_BADGE[team]}`}>{team}</span>
                                <span>{name}</span>
                                {types.map((t) => (
                                  <span
                                    key={t}
                                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: TYPE_COLORS[t] || "#ccc" }}
                                    title={t}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="border-r border-r-gray-200" />
                            <td className="border-r border-r-gray-200" />
                            {months.map((month) => {
                              // Collect hours by type for this month
                              const hoursByType: { type: string; hours: number }[] = [];
                              entries.forEach((e) => {
                                const h = e.monthlyHours.find((mh) => mh.month === month)?.hours || 0;
                                if (h > 0) hoursByType.push({ type: e.manHoursType, hours: h });
                              });
                              return (
                                <td key={month} className="px-1 py-0.5 text-center text-[10px] border-r border-r-gray-200">
                                  {hoursByType.length > 0 ? (
                                    <div className="flex gap-0.5 justify-center">
                                      {hoursByType.map(({ type, hours }) => (
                                        <span
                                          key={type}
                                          className="inline-block px-1 py-0.5 rounded text-white text-[10px]"
                                          style={{ backgroundColor: TYPE_COLORS[type] || "#ccc" }}
                                          title={`${type}: ${hours}h`}
                                        >
                                          {hours}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      });
                    })()}
                  </>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return `${y.slice(2)}/${mo}`;
}
