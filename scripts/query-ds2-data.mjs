import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

// First, let's find DS2 members by querying User or a related object
// Check if Member__c on AsignPlan is a User reference
const asignDesc = await conn.sobject("AsignPlan__c").describe();
const memberField = asignDesc.fields.find((f) => f.name === "Member__c");
console.log("Member__c references:", memberField.referenceTo);

// Query a sample of AsignPlan records to understand the data
console.log("\n=== Sample AsignPlan__c records ===");
const asignRecords = await conn.query(`
  SELECT Id, Name, Project__c, Member__c, ExportMember__c, ExportProject__c,
         OperatingStartDate__c, OperatingEndDate__c, EngineerClassification__c
  FROM AsignPlan__c
  WHERE ExportMember__c != null
  LIMIT 20
`);
asignRecords.records.forEach((r) => {
  console.log(`  ${r.ExportMember__c} | ${r.ExportProject__c} | ${r.OperatingStartDate__c} - ${r.OperatingEndDate__c}`);
});

// Query ManHours for one of these assignments
if (asignRecords.records.length > 0) {
  const sampleAsignId = asignRecords.records[0].Id;
  console.log("\n=== Sample ManHours__c for first assignment ===");
  const manHours = await conn.query(`
    SELECT Id, CostOccurrenceMonth__c, ManHoursTime__c, ManHoursType__c,
           ForecastAchievement__c, ExportAsign__c, ExportProject__c, UserName__c
    FROM ManHours__c
    WHERE AsignPlan__c = '${sampleAsignId}'
    ORDER BY CostOccurrenceMonth__c
    LIMIT 20
  `);
  manHours.records.forEach((r) => {
    console.log(`  ${r.CostOccurrenceMonth__c} | ${r.ManHoursTime__c}h | type:${r.ManHoursType__c} | ${r.ForecastAchievement__c} | ${r.UserName__c}`);
  });
}

// Check if we can find DS2 group info - look for group/department fields on User
console.log("\n=== Looking for DS2 members - checking known names ===");
const ds2Members = [
  "孝治 吉春", "マルラ デイネス", "越本 直季", "金田 亘平", "本馬 佳賢",
  "野澤 和輝", "浅井 海図", "髙橋 圭太", "岩田 迪也",
  "水口 和也", "藤田 直樹", "赤木 亮輔", "飯田 英之介", "谷川 知弘"
];

// Try querying by member name
const nameQuery = ds2Members.map((n) => `ExportMember__c = '${n}'`).join(" OR ");
const ds2Asigns = await conn.query(`
  SELECT Id, ExportMember__c, ExportProject__c, OperatingStartDate__c, OperatingEndDate__c
  FROM AsignPlan__c
  WHERE (${nameQuery})
  ORDER BY ExportMember__c
  LIMIT 50
`);
console.log(`Found ${ds2Asigns.totalSize} assignments for DS2 members`);
ds2Asigns.records.forEach((r) => {
  console.log(`  ${r.ExportMember__c} | ${r.ExportProject__c} | ${r.OperatingStartDate__c} - ${r.OperatingEndDate__c}`);
});
