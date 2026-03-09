import jsforce from "jsforce";
import { config } from "dotenv";
import { resolve } from "path";

// Load from token.env
config({ path: resolve(process.cwd(), "token.env") });

const username = process.env.SALESFORCE_BATCH_USERNAME;
const password = process.env.SALESFORCE_BATCH_PASSWORD;
const securityToken = process.env.SALESFORCE_BATCH_SECURITY_TOKEN;

console.log("Connecting to Salesforce...");
console.log("Username:", username);

const conn = new jsforce.Connection({
  loginUrl: "https://login.salesforce.com",
});

try {
  const userInfo = await conn.login(username, password + securityToken);
  console.log("Connected successfully!");
  console.log("User ID:", userInfo.id);
  console.log("Org ID:", userInfo.organizationId);
  console.log("Instance URL:", conn.instanceUrl);

  // List custom objects that might be related to projects/assignments
  const globalDescribe = await conn.describeGlobal();
  const customObjects = globalDescribe.sobjects
    .filter((obj) => obj.custom)
    .map((obj) => obj.name);

  console.log("\n=== Custom Objects ===");
  // Filter for likely project/assignment related objects
  const relevant = customObjects.filter(
    (name) =>
      name.toLowerCase().includes("project") ||
      name.toLowerCase().includes("assign") ||
      name.toLowerCase().includes("resource") ||
      name.toLowerCase().includes("member") ||
      name.toLowerCase().includes("kosuu") ||
      name.toLowerCase().includes("kosu") ||
      name.toLowerCase().includes("man_hour") ||
      name.toLowerCase().includes("manhour") ||
      name.toLowerCase().includes("allocation")
  );

  console.log("\nRelevant objects (project/assign/resource related):");
  relevant.forEach((name) => console.log(" -", name));

  console.log("\nAll custom objects:");
  customObjects.forEach((name) => console.log(" -", name));
} catch (err) {
  console.error("Connection failed:", err.message);
}
