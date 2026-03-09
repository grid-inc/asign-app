import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

// Find the ManHours record for "発電計画最適化_改修" to get the Project__c ID
const mh = await conn.query(`
  SELECT Project__c, ExportProject__c, AsignPlan__c
  FROM ManHours__c
  WHERE (UserName__c = '孝治吉春' OR UserName__c = '孝治 吉春')
    AND ExportProject__c = '発電計画最適化_改修'
  LIMIT 1
`);
console.log("ManHours for 発電計画最適化_改修:", mh.records[0]);

const projectId = mh.records[0]?.Project__c;
if (projectId) {
  const proj = await conn.query(`
    SELECT Id, Name, Phase__c, ContractStartDate__c, ContractEndDate__c,
           DevelopmentStartDate__c, DevelopmentEndDate__c, ExportAccount__c
    FROM Project__c
    WHERE Id = '${projectId}'
  `);
  console.log("\nProject details:", proj.records[0]);
}

// Also check the other project
const mh2 = await conn.query(`
  SELECT Project__c, ExportProject__c
  FROM ManHours__c
  WHERE (UserName__c = '孝治吉春' OR UserName__c = '孝治 吉春')
    AND ExportProject__c = '発電計画最適化_改修及び追加機能開発'
  LIMIT 1
`);
const projectId2 = mh2.records[0]?.Project__c;
if (projectId2) {
  const proj2 = await conn.query(`
    SELECT Id, Name, Phase__c, ContractStartDate__c, ContractEndDate__c,
           DevelopmentStartDate__c, DevelopmentEndDate__c, ExportAccount__c
    FROM Project__c
    WHERE Id = '${projectId2}'
  `);
  console.log("\nProject details (改修及び追加機能開発):", proj2.records[0]);
}
