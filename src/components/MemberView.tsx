"use client";

import { useState, useMemo } from "react";
import type { MemberAssignment } from "@/lib/types";

const CAPACITY = 160;

const TYPE_COLORS: Record<string, string> = {
  "本開発": "#3b82f6",
  "先行着手（内示なし）": "#f59e0b",
  "プリセ": "#10b981",
  "社内": "#9ca3af",
};

interface MemberViewProps {
  data: MemberAssignment[];
  months: string[];
}

export default function MemberView({ data, months }: MemberViewProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const memberSummaries = useMemo(() => {
    return data.map((member) => {
      const monthTotals = new Map<string, number>();
      const monthByType = new Map<string, Map<string, number>>();

      member.projects.forEach((p) => {
        p.monthlyHours.forEach((mh) => {
          monthTotals.set(mh.month, (monthTotals.get(mh.month) || 0) + mh.hours);
          if (!monthByType.has(mh.month)) monthByType.set(mh.month, new Map());
          const typeMap = monthByType.get(mh.month)!;
          typeMap.set(p.manHoursType, (typeMap.get(p.manHoursType) || 0) + mh.hours);
        });
      });

      return { member, monthTotals, monthByType };
    });
  }, [data]);

  return (
    <div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="sticky left-0 z-10 bg-gray-800 px-2 py-1.5 text-left w-[50px]">TM</th>
            <th className="sticky left-[50px] z-10 bg-gray-800 px-2 py-1.5 text-left w-[100px]">メンバー</th>
            {months.map((m) => (
              <th key={m} className="px-1 py-1.5 text-center min-w-[90px]">{fmtMonth(m)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memberSummaries.map(({ member, monthTotals, monthByType }) => {
            const isExpanded = expandedMember === member.memberName;
            return (
              <>
                {/* Summary row - one per member */}
                <tr
                  key={member.memberName}
                  className={`border-b cursor-pointer hover:bg-blue-50 ${isExpanded ? "bg-blue-50" : ""}`}
                  onClick={() => setExpandedMember(isExpanded ? null : member.memberName)}
                >
                  <td className="sticky left-0 z-10 bg-white px-2 py-1 font-bold text-[10px] border-r">
                    {member.team}
                  </td>
                  <td className="sticky left-[50px] z-10 bg-white px-2 py-1 font-medium border-r whitespace-nowrap">
                    <span className="mr-1 text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                    {member.memberName}
                  </td>
                  {months.map((month) => {
                    const total = Math.round(monthTotals.get(month) || 0);
                    const typeBreakdown = monthByType.get(month) || new Map();
                    return (
                      <td key={month} className="px-1 py-1 border-r">
                        {total > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {/* Stacked bar */}
                            <div className="w-full h-4 flex rounded overflow-hidden bg-gray-100">
                              {["先行着手（内示なし）", "プリセ", "本開発", "社内"].map((type) => {
                                const h = typeBreakdown.get(type) || 0;
                                if (h === 0) return null;
                                const pct = (h / Math.max(total, CAPACITY)) * 100;
                                return (
                                  <div
                                    key={type}
                                    style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] }}
                                    title={`${type}: ${Math.round(h)}h`}
                                  />
                                );
                              })}
                            </div>
                            <span className={`text-[10px] font-bold ${
                              total > CAPACITY ? "text-red-600" : total < 140 && total > 0 ? "text-blue-600" : total === 0 ? "text-gray-300" : "text-gray-700"
                            }`}>
                              {total}h
                            </span>
                          </div>
                        ) : (
                          <div className="text-center text-gray-300 text-[10px]">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Expanded detail rows */}
                {isExpanded && member.projects.map((proj, projIdx) => {
                  const rowBg = projIdx % 2 === 0 ? "bg-gray-50" : "bg-white";
                  return (
                  <tr
                    key={`${member.memberName}-${proj.projectName}-${proj.manHoursType}`}
                    className={`${rowBg} border-b border-gray-100 hover:!bg-blue-50 group`}
                  >
                    <td className={`sticky left-0 z-10 ${rowBg} group-hover:!bg-blue-50 border-r`} />
                    <td className={`sticky left-[50px] z-10 ${rowBg} group-hover:!bg-blue-50 px-2 py-0.5 border-r`}>
                      <div className="flex items-center gap-1 pl-3">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[proj.manHoursType] || "#ccc" }}
                        />
                        <span className="truncate text-[10px]" title={proj.projectName}>
                          {proj.projectName}
                        </span>
                      </div>
                    </td>
                    {months.map((month) => {
                      const h = proj.monthlyHours.find((mh) => mh.month === month)?.hours || 0;
                      return (
                        <td key={month} className="px-1 py-0.5 text-center text-[10px] border-r">
                          {h > 0 ? <span className="text-gray-600">{h}</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-2 text-[10px] text-gray-500">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded" style={{ backgroundColor: color }} />
            {type === "先行着手（内示なし）" ? "先行着手" : type}
          </span>
        ))}
        <span className="ml-4">
          <span className="text-blue-600 font-medium">〜140h 余裕あり</span>
          {" | "}
          <span className="text-gray-700">140〜160h 適正</span>
          {" | "}
          <span className="text-red-600 font-medium">160h〜 過負荷</span>
          {" | クリックで展開"}
        </span>
      </div>
    </div>
  );
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return `${y.slice(2)}/${mo}`;
}
