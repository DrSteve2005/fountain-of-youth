import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { isMigrationFile, migrationName, pendingMigrations } from "./migration-plan.mjs";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

test("_migrations keys on basename, not path", () => {
  assert.equal(migrationName("/migrations/0002_faucet.sql"), "0002_faucet.sql");
  assert.equal(migrationName("migrations/0002_faucet.sql"), "0002_faucet.sql");
  assert.equal(migrationName("0002_faucet.sql"), "0002_faucet.sql");
});

test("a file already applied does not re-apply", () => {
  assert.deepEqual(pendingMigrations(["/migrations/0002_faucet.sql"], ["0002_faucet.sql"]), []);
});

test("pending migrations are returned in name order", () => {
  assert.deepEqual(
    pendingMigrations(
      ["/migrations/0003_c.sql", "/migrations/0001_a.sql", "/migrations/0002_b.sql"],
      ["0001_a.sql"],
    ),
    [
      { name: "0002_b.sql", path: "/migrations/0002_b.sql" },
      { name: "0003_c.sql", path: "/migrations/0003_c.sql" },
    ],
  );
});

test("non-.sql entries are dropped", () => {
  assert.equal(isMigrationFile("notes"), false);
  assert.deepEqual(pendingMigrations(["notes", "README.md"], []), []);
});

test("every migration in migrations/ has its own number", () => {
  const files = readdirSync(migrationsDir).filter(isMigrationFile);
  assert.ok(files.length > 0, "no migrations found");
  const numbers = files.map((name) => name.split("_", 1)[0]);
  for (const n of numbers) assert.match(n, /^\d{4}$/, `bad migration name prefix: ${n}`);
  assert.equal(new Set(numbers).size, numbers.length, "two migrations share a number");
});
