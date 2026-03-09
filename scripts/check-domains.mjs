import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "token.env") });

const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login(
  process.env.SALESFORCE_BATCH_USERNAME,
  process.env.SALESFORCE_BATCH_PASSWORD + process.env.SALESFORCE_BATCH_SECURITY_TOKEN
);

const records = await conn.query(`
  SELECT Id, Name, ExportDomainName__c
  FROM Project__c
  WHERE Id IN (
    SELECT Project__c FROM ManHours__c
    WHERE (UserName__c = '孝治吉春' OR UserName__c = '越本直季' OR UserName__c = '金田亘平'
      OR UserName__c = '水口和也' OR UserName__c = '谷川知弘' OR UserName__c = '野澤和輝'
      OR UserName__c = '浅井海図' OR UserName__c = '藤田直樹' OR UserName__c = '赤木亮輔'
      OR UserName__c = '飯田英之介' OR UserName__c = '本馬佳賢' OR UserName__c = '岩田迪也')
    AND ManHoursTime__c > 0
    AND CostOccurrenceMonth__c >= 2026-03-01
  )
  ORDER BY ExportDomainName__c, Name
`);

const domains = new Map();
records.records.forEach((r) => {
  const d = r.ExportDomainName__c || "(空白)";
  if (!domains.has(d)) domains.set(d, []);
  domains.get(d).push(r.Name);
});

for (const [domain, projects] of domains) {
  console.log(`\n【${domain}】 ${projects.length}件`);
  projects.forEach((p) => console.log(`  - ${p}`));
}
