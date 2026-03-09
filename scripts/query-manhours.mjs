import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

// Query ManHours for DS2 members for recent/future months
// ManHoursType__c values and ForecastAchievement__c values
console.log("=== ManHoursType__c picklist values ===");
const mhDesc = await conn.sobject("ManHours__c").describe();
const typeField = mhDesc.fields.find((f) => f.name === "ManHoursType__c");
console.log("ManHoursType__c type:", typeField.type);
// It's a picklist? No, it says picklist in schema
if (typeField.picklistValues) {
  typeField.picklistValues.forEach((v) => console.log(`  - ${v.value} (${v.label})`));
}

const faField = mhDesc.fields.find((f) => f.name === "ForecastAchievement__c");
console.log("\nForecastAchievement__c type:", faField.type);
if (faField.picklistValues) {
  faField.picklistValues.forEach((v) => console.log(`  - ${v.value} (${v.label})`));
}

// Check RecordType
const rtField = mhDesc.fields.find((f) => f.name === "RecordTypeId");
console.log("\nRecordTypeId references:", rtField.referenceTo);

// Query RecordTypes for ManHours__c
const rts = await conn.query(`
  SELECT Id, Name, DeveloperName FROM RecordType WHERE SObjectType = 'ManHours__c'
`);
console.log("\nManHours__c RecordTypes:");
rts.records.forEach((r) => console.log(`  ${r.Id} | ${r.Name} | ${r.DeveloperName}`));

// Query actual ManHours data for a DS2 member with hours > 0 in recent months
console.log("\n=== Sample ManHours for 谷川 (recent months, hours > 0) ===");
const tanigawaHours = await conn.query(`
  SELECT CostOccurrenceMonth__c, ManHoursTime__c, ManHoursType__c,
         ForecastAchievement__c, ExportProject__c, ExportAsign__c, UserName__c,
         RecordTypeId, WorkType__c
  FROM ManHours__c
  WHERE UserName__c = '谷川知弘'
    AND CostOccurrenceMonth__c >= 2025-07-01
    AND ManHoursTime__c > 0
  ORDER BY CostOccurrenceMonth__c
  LIMIT 30
`);
console.log(`Found ${tanigawaHours.totalSize} records`);
tanigawaHours.records.forEach((r) => {
  console.log(`  ${r.CostOccurrenceMonth__c} | ${r.ManHoursTime__c}h | type:${r.ManHoursType__c} | FA:${r.ForecastAchievement__c} | RT:${r.RecordTypeId} | work:${r.WorkType__c} | ${r.ExportProject__c}`);
});

// Also try querying with RecordType name to distinguish 計画 vs 見通し/実績
console.log("\n=== Sample ManHours for 水口和也 (recent, hours > 0) ===");
const mizuguchiHours = await conn.query(`
  SELECT CostOccurrenceMonth__c, ManHoursTime__c, ManHoursType__c,
         ForecastAchievement__c, ExportProject__c, UserName__c, RecordTypeId, WorkType__c
  FROM ManHours__c
  WHERE UserName__c = '水口和也'
    AND CostOccurrenceMonth__c >= 2025-11-01
    AND ManHoursTime__c > 0
  ORDER BY CostOccurrenceMonth__c
  LIMIT 30
`);
console.log(`Found ${mizuguchiHours.totalSize} records`);
mizuguchiHours.records.forEach((r) => {
  console.log(`  ${r.CostOccurrenceMonth__c} | ${r.ManHoursTime__c}h | type:${r.ManHoursType__c} | FA:${r.ForecastAchievement__c} | RT:${r.RecordTypeId} | work:${r.WorkType__c} | ${r.ExportProject__c}`);
});
