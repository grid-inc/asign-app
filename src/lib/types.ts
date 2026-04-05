export interface MemberAssignment {
  memberName: string;
  team: "GL" | "A" | "B" | "C";
  projects: ProjectAssignment[];
}

export interface ProjectAssignment {
  projectName: string;
  customerName: string;
  manHoursType: string;
  monthlyHours: MonthlyHour[];
}

export interface MonthlyHour {
  month: string; // "2026-03" format
  hours: number;
  actualHours?: number; // 実績
}

// Project-centric view
export interface ProjectInfo {
  projectId: string;
  projectName: string;
  customerName: string;
  domain: string;
  pm: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  presalesStartDate: string | null;
  developmentStartDate: string | null;
  developmentEndDate: string | null;
  phase: string;
  members: ProjectMemberHours[];
}

export interface ProjectMemberHours {
  memberName: string;
  team: "GL" | "A" | "B" | "C";
  manHoursType: string;
  monthlyHours: MonthlyHour[];
}

// DS2 members grouped by team
export const DS2_MEMBERS: Record<string, { team: "GL" | "A" | "B" | "C"; nameVariants: string[] }> = {
  "谷川 知弘": { team: "GL", nameVariants: ["谷川知弘", "谷川 知弘"] },
  "孝治 吉春": { team: "A", nameVariants: ["孝治吉春", "孝治 吉春"] },
  "金田 亘平": { team: "A", nameVariants: ["金田亘平", "金田 亘平"] },
  "本馬 佳賢": { team: "A", nameVariants: ["本馬佳賢", "本馬 佳賢"] },
  "浅井 海図": { team: "B", nameVariants: ["浅井海図", "浅井 海図"] },
  "Liu Jung Hsuan": { team: "B", nameVariants: ["LiuJung Hsuan", "Liu Jung Hsuan", "Liu JungHsuan"] },
  "赤木 亮輔": { team: "B", nameVariants: ["赤木亮輔", "赤木 亮輔"] },
  "水口 和也": { team: "C", nameVariants: ["水口和也", "水口 和也"] },
  "飯田 英之介": { team: "C", nameVariants: ["飯田英之介", "飯田 英之介"] },
  "藤田 直樹": { team: "C", nameVariants: ["藤田直樹", "藤田 直樹"] },
};
