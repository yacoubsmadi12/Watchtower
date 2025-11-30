import { db } from "./db";
import { logSources } from "@shared/schema";

export async function seedDatabase() {
  const existingSources = await db.select().from(logSources);
  
  if (existingSources.length > 0) {
    return;
  }

  const sources = [
    { name: "NCE FAN HQ", ipAddress: "10.119.19.95", status: "inactive", description: "NCE FAN HQ System" },
    { name: "NCE IP +T", ipAddress: "10.119.19.80", status: "inactive", description: "NCE IP +T System" },
    { name: "NCE HOME_INSIGHT", ipAddress: "10.119.21.6", status: "inactive", description: "NCE HOME_INSIGHT System" },
    { name: "U2020", ipAddress: "10.119.10.4", status: "inactive", description: "U2020 System" },
    { name: "PRS", ipAddress: "10.119.10.104", status: "inactive", description: "PRS System" },
  ];
  
  await db.insert(logSources).values(sources);
  console.log("Database seeded with log sources");
}
