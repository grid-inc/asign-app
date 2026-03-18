// eslint-disable-next-line @typescript-eslint/no-require-imports
const jsforce = require("jsforce");
import {
  DS2_MEMBERS,
  type MemberAssignment,
  type ProjectAssignment,
  type MonthlyHour,
  type ProjectInfo,
  type ProjectMemberHours,
} from "./types";

const RECORD_TYPE_FORECAST = "012IS000000x0WqYAI";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connectionCache: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getConnection(): Promise<any> {
  if (connectionCache) {
    try {
      await connectionCache.identity();
      return connectionCache;
    } catch {
      connectionCache = null;
    }
  }

  const conn = new jsforce.Connection({
    loginUrl: "https://login.salesforce.com",
  });

  await conn.login(
    process.env.SALESFORCE_USERNAME!,
    process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_SECURITY_TOKEN!
  );

  connectionCache = conn;
  return conn;
}

interface ManHoursRecord {
  UserName__c: string;
  ExportProject__c: string;
  CostOccurrenceMonth__c: string;
  ManHoursTime__c: number;
  ManHoursType__c: string;
  WorkType__c: string;
  Project__c: string;
}

interface ProjectRecord {
  Id: string;
  Name: string;
  ExportAccount__c: string;
  ExportDomainName__c: string;
  Export_ResponsibleProjectManager__c: string;
  ContractStartDate__c: string | null;
  ContractEndDate__c: string | null;
  PresalesStartDate__c: string | null;
  DevelopmentStartDate__c: string | null;
  DevelopmentEndDate__c: string | null;
  Phase__c: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryAll(conn: any, soql: string): Promise<any[]> {
  const result = await conn.query(soql);
  let records = result.records;
  let queryResult = result;
  while (!queryResult.done && queryResult.nextRecordsUrl) {
    queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
    records = records.concat(queryResult.records);
  }
  return records;
}

function getDateRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 13, 0);
  return {
    startStr: startDate.toISOString().split("T")[0],
    endStr: endDate.toISOString().split("T")[0],
  };
}

function buildNameMapping(): Record<string, { canonical: string; team: "GL" | "A" | "B" | "C" }> {
  const map: Record<string, { canonical: string; team: "GL" | "A" | "B" | "C" }> = {};
  for (const [canonical, { team, nameVariants }] of Object.entries(DS2_MEMBERS)) {
    for (const variant of nameVariants) {
      map[variant] = { canonical, team };
    }
  }
  return map;
}

export async function fetchDS2Data(): Promise<{
  members: MemberAssignment[];
  projects: ProjectInfo[];
}> {
  const conn = await getConnection();
  const { startStr, endStr } = getDateRange();
  const nameToInfo = buildNameMapping();

  const allNames = Object.values(DS2_MEMBERS).flatMap((m) => m.nameVariants);
  const nameCondition = allNames.map((n) => `'${n}'`).join(",");

  // Query ManHours with Project reference (見通し)
  const manHoursRecords: ManHoursRecord[] = await queryAll(conn, `
    SELECT UserName__c, ExportProject__c, CostOccurrenceMonth__c,
           ManHoursTime__c, ManHoursType__c, WorkType__c, Project__c
    FROM ManHours__c
    WHERE UserName__c IN (${nameCondition})
      AND RecordTypeId = '${RECORD_TYPE_FORECAST}'
      AND ForecastAchievement__c = '見通し'
      AND CostOccurrenceMonth__c >= ${startStr}
      AND CostOccurrenceMonth__c <= ${endStr}
      AND ManHoursTime__c > 0
    ORDER BY UserName__c, ExportProject__c, CostOccurrenceMonth__c
  `);

  // Query ManHours (実績)
  const actualRecords: ManHoursRecord[] = await queryAll(conn, `
    SELECT UserName__c, ExportProject__c, CostOccurrenceMonth__c,
           ManHoursTime__c, ManHoursType__c, WorkType__c, Project__c
    FROM ManHours__c
    WHERE UserName__c IN (${nameCondition})
      AND RecordTypeId = '${RECORD_TYPE_FORECAST}'
      AND ForecastAchievement__c = '実績'
      AND CostOccurrenceMonth__c >= ${startStr}
      AND CostOccurrenceMonth__c <= ${endStr}
      AND ManHoursTime__c > 0
    ORDER BY UserName__c, ExportProject__c, CostOccurrenceMonth__c
  `);

  // Collect unique project IDs
  const projectIds = new Set<string>();
  for (const rec of manHoursRecords) {
    if (rec.Project__c) projectIds.add(rec.Project__c);
  }

  // Query Project details
  const projectMap = new Map<string, ProjectRecord>();
  if (projectIds.size > 0) {
    const idChunks: string[][] = [];
    const ids = Array.from(projectIds);
    for (let i = 0; i < ids.length; i += 200) {
      idChunks.push(ids.slice(i, i + 200));
    }
    for (const chunk of idChunks) {
      const idCondition = chunk.map((id) => `'${id}'`).join(",");
      const projects: ProjectRecord[] = await queryAll(conn, `
        SELECT Id, Name, ExportAccount__c, ExportDomainName__c,
               Export_ResponsibleProjectManager__c,
               ContractStartDate__c, ContractEndDate__c,
               PresalesStartDate__c,
               DevelopmentStartDate__c, DevelopmentEndDate__c,
               Phase__c
        FROM Project__c
        WHERE Id IN (${idCondition})
      `);
      for (const p of projects) {
        projectMap.set(p.Id, p);
      }
    }
  }

  // Exclude projects with Phase__c = '0'
  const excludedProjectIds = new Set<string>();
  for (const [id, p] of projectMap) {
    if (p.Phase__c === '0') excludedProjectIds.add(id);
  }
  const filteredRecords = manHoursRecords.filter(
    (rec: ManHoursRecord) => !rec.Project__c || !excludedProjectIds.has(rec.Project__c)
  );

  // Filter actual records for excluded projects
  const filteredActualRecords = actualRecords.filter(
    (rec: ManHoursRecord) => !rec.Project__c || !excludedProjectIds.has(rec.Project__c)
  );

  // --- Build Member-centric view ---
  const memberDataMap = new Map<string, Map<string, { type: string; projectId: string | null; months: Map<string, number>; actualMonths: Map<string, number> }>>();

  for (const rec of filteredRecords) {
    const info = nameToInfo[rec.UserName__c];
    if (!info) continue;
    const { canonical } = info;

    if (!memberDataMap.has(canonical)) memberDataMap.set(canonical, new Map());
    const projMap = memberDataMap.get(canonical)!;
    const key = `${rec.ExportProject__c}|${rec.ManHoursType__c}`;

    if (!projMap.has(key)) projMap.set(key, { type: rec.ManHoursType__c, projectId: rec.Project__c || null, months: new Map(), actualMonths: new Map() });
    const proj = projMap.get(key)!;
    const monthKey = rec.CostOccurrenceMonth__c.substring(0, 7);
    proj.months.set(monthKey, (proj.months.get(monthKey) || 0) + rec.ManHoursTime__c);
  }

  // Add actual data to member data map
  for (const rec of filteredActualRecords) {
    const info = nameToInfo[rec.UserName__c];
    if (!info) continue;
    const { canonical } = info;

    if (!memberDataMap.has(canonical)) memberDataMap.set(canonical, new Map());
    const projMap = memberDataMap.get(canonical)!;
    const key = `${rec.ExportProject__c}|${rec.ManHoursType__c}`;

    if (!projMap.has(key)) projMap.set(key, { type: rec.ManHoursType__c, projectId: rec.Project__c || null, months: new Map(), actualMonths: new Map() });
    const proj = projMap.get(key)!;
    const monthKey = rec.CostOccurrenceMonth__c.substring(0, 7);
    proj.actualMonths.set(monthKey, (proj.actualMonths.get(monthKey) || 0) + rec.ManHoursTime__c);
  }

  const members: MemberAssignment[] = [];
  for (const [memberName, memberInfo] of Object.entries(DS2_MEMBERS)) {
    const projMap = memberDataMap.get(memberName) || new Map();
    const projects: ProjectAssignment[] = [];

    for (const [projectKey, data] of projMap) {
      const [projectName] = projectKey.split("|");
      const monthlyHours: MonthlyHour[] = [];
      const allMonths = new Set([...data.months.keys(), ...data.actualMonths.keys()]);
      for (const month of allMonths) {
        const hours = data.months.get(month) || 0;
        const actualHours = data.actualMonths.get(month);
        monthlyHours.push({ month, hours: Math.round(hours * 10) / 10, actualHours: actualHours !== undefined ? Math.round(actualHours * 10) / 10 : undefined });
      }
      monthlyHours.sort((a, b) => a.month.localeCompare(b.month));
      const projRecord = data.projectId ? projectMap.get(data.projectId) : null;
      const customerName = projRecord?.ExportAccount__c || "";
      const manHoursType = (data.type === "本開発" && projectName.includes("保守")) ? "保守" : data.type;
      projects.push({ projectName, customerName, manHoursType, monthlyHours });
    }

    projects.sort((a, b) => {
      const order = ["本開発", "保守", "先行着手（内示なし）", "プリセ", "社内"];
      return order.indexOf(a.manHoursType) - order.indexOf(b.manHoursType);
    });

    members.push({ memberName, team: memberInfo.team, projects });
  }

  const teamOrder = ["GL", "A", "B", "C"];
  const memberKeys = Object.keys(DS2_MEMBERS);
  members.sort((a, b) => {
    const teamDiff = teamOrder.indexOf(a.team) - teamOrder.indexOf(b.team);
    if (teamDiff !== 0) return teamDiff;
    return memberKeys.indexOf(a.memberName) - memberKeys.indexOf(b.memberName);
  });

  // --- Build Project-centric view ---
  // Group by project name -> member -> monthly hours
  const projDataMap = new Map<string, {
    projectId: string;
    members: Map<string, { team: "GL" | "A" | "B" | "C"; types: Map<string, Map<string, number>> }>;
  }>();

  for (const rec of filteredRecords) {
    const info = nameToInfo[rec.UserName__c];
    if (!info) continue;

    const projName = rec.ExportProject__c;
    if (!projDataMap.has(projName)) {
      projDataMap.set(projName, { projectId: rec.Project__c, members: new Map() });
    }
    const pd = projDataMap.get(projName)!;
    if (!pd.members.has(info.canonical)) {
      pd.members.set(info.canonical, { team: info.team, types: new Map() });
    }
    const memberData = pd.members.get(info.canonical)!;
    if (!memberData.types.has(rec.ManHoursType__c)) {
      memberData.types.set(rec.ManHoursType__c, new Map());
    }
    const monthMap = memberData.types.get(rec.ManHoursType__c)!;
    const mk = rec.CostOccurrenceMonth__c.substring(0, 7);
    monthMap.set(mk, (monthMap.get(mk) || 0) + rec.ManHoursTime__c);
  }

  const projects: ProjectInfo[] = [];
  for (const [projName, pd] of projDataMap) {
    const pRec = projectMap.get(pd.projectId);
    const membersList: ProjectMemberHours[] = [];

    for (const [memberName, mData] of pd.members) {
      for (const [type, monthMap] of mData.types) {
        const monthlyHours: MonthlyHour[] = [];
        for (const [month, hours] of monthMap) {
          monthlyHours.push({ month, hours: Math.round(hours * 10) / 10 });
        }
        monthlyHours.sort((a, b) => a.month.localeCompare(b.month));
        const manHoursType = (type === "本開発" && projName.includes("保守")) ? "保守" : type;
        membersList.push({ memberName, team: mData.team, manHoursType, monthlyHours });
      }
    }

    membersList.sort((a, b) => a.memberName.localeCompare(b.memberName));

    projects.push({
      projectId: pd.projectId,
      projectName: projName,
      customerName: pRec?.ExportAccount__c || "",
      domain: pRec?.ExportDomainName__c || "",
      pm: pRec?.Export_ResponsibleProjectManager__c || "",
      contractStartDate: pRec?.ContractStartDate__c || null,
      contractEndDate: pRec?.ContractEndDate__c || null,
      presalesStartDate: pRec?.PresalesStartDate__c || null,
      developmentStartDate: pRec?.DevelopmentStartDate__c || null,
      developmentEndDate: pRec?.DevelopmentEndDate__c || null,
      phase: pRec?.Phase__c || "",
      members: membersList,
    });
  }

  // Sort: 社内PJは後ろ、それ以外は開始日の早い順
  projects.sort((a, b) => {
    const aIsShanai = a.projectName.startsWith("COM_") || a.projectName.startsWith("PLN_") || a.projectName.startsWith("PRE_");
    const bIsShanai = b.projectName.startsWith("COM_") || b.projectName.startsWith("PLN_") || b.projectName.startsWith("PRE_");
    if (aIsShanai !== bIsShanai) return aIsShanai ? 1 : -1;

    const startDate = (p: ProjectInfo) =>
      p.contractStartDate || p.developmentStartDate || p.presalesStartDate || "9999-99-99";
    return startDate(a).localeCompare(startDate(b));
  });

  return { members, projects };
}
