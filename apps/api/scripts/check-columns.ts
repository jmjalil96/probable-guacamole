import { db } from "../src/config/db.js";

async function main() {
  const result = await db.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `;

  console.log("Columns in users table:");
  for (const row of result) {
    console.log("  -", row.column_name);
  }

  await db.$disconnect();
}

main();
