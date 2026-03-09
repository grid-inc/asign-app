import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

// Describe Project__c
console.log("=== Project__c Fields ===");
const projectDesc = await conn.sobject("Project__c").describe();
projectDesc.fields.forEach((f) => {
  console.log(`  ${f.name} (${f.type}) - ${f.label}`);
});

console.log("\n=== ManHours__c Fields ===");
const manHoursDesc = await conn.sobject("ManHours__c").describe();
manHoursDesc.fields.forEach((f) => {
  console.log(`  ${f.name} (${f.type}) - ${f.label}`);
});

// Also check AsignPlan__c
console.log("\n=== AsignPlan__c Fields ===");
const asignDesc = await conn.sobject("AsignPlan__c").describe();
asignDesc.fields.forEach((f) => {
  console.log(`  ${f.name} (${f.type}) - ${f.label}`);
});
