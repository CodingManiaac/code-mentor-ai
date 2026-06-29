import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let db: any;
let client: any;

if (connectionString) {
  client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
} else {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "⚠️  WARNING: DATABASE_URL is missing in .env.local. Database operations will fail at runtime until provided."
    );
  }

  db = new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === "symbol" || prop === "then" || prop === "inspect") {
        return undefined;
      }
      throw new Error(
        "DATABASE_URL is not configured in .env.local. Please supply a valid Supabase connection string to use database features."
      );
    },
  });
  client = null;
}

export { db, client };
