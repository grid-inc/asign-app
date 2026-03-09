import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

const FORECAST_TYPE = "012IS000000x0WqYAI";

// Query ALL ManHours for 孝治 in 2026-03 with ForecastType
const records = await conn.query(`
  SELECT ExportProject__c, ManHoursTime__c, ManHoursType__c,
         ForecastAchievement__c, CostOccurrenceMonth__c, RecordTypeId
  FROM ManHours__c
  WHERE (UserName__c = '孝治吉春' OR UserName__c = '孝治 吉春')
    AND CostOccurrenceMonth__c = 2026-03-01
    AND RecordTypeId = '${FORECAST_TYPE}'
    AND ManHoursTime__c > 0
  ORDER BY ExportProject__c
`);

console.log(`Total records: ${records.totalSize}`);
let total = 0;
let totalMitoshi = 0;
for (const r of records.records) {
  console.log(`  ${r.ManHoursTime__c}h | FA:${r.ForecastAchievement__c} | ${r.ManHoursType__c} | ${r.ExportProject__c}`);
  total += r.ManHoursTime__c;
  if (r.ForecastAchievement__c === '見通し') totalMitoshi += r.ManHoursTime__c;
}
console.log(`\nTotal (all): ${Math.round(total)}h`);
console.log(`Total (見通しonly): ${Math.round(totalMitoshi)}h`);
