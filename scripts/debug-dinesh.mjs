import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

// Search for any name containing "Malla" or "マルラ" or "Dinesh" or "デイネス"
const records = await conn.query(`
  SELECT UserName__c
  FROM ManHours__c
  WHERE UserName__c LIKE '%Malla%' OR UserName__c LIKE '%マルラ%'
    OR UserName__c LIKE '%Dinesh%' OR UserName__c LIKE '%デイネス%'
    OR UserName__c LIKE '%ディネス%'
  LIMIT 10
`);

console.log("Found name variants:");
records.records.forEach((r) => console.log(`  '${r.UserName__c}'`));
