import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add TOTP secret to user table
  await sql`ALTER TABLE "user" ADD "totpSecret" character varying;`.execute(db);
  
  // Add trusted device token to session table
  await sql`ALTER TABLE "session" ADD "isTrustedDevice" boolean DEFAULT false;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" DROP COLUMN "isTrustedDevice";`.execute(db);
  await sql`ALTER TABLE "user" DROP COLUMN "totpSecret";`.execute(db);
}
