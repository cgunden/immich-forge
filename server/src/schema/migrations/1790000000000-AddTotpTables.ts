import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotpTables1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "totp" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "secret" text NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updateId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        CONSTRAINT "PK_totp_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_totp_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UQ_totp_userId" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_totp_updateId" ON "totp" ("updateId")
    `);

    await queryRunner.query(`
      CREATE TABLE "totp_device" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "deviceFingerprint" text NOT NULL,
        "totpVerified" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updateId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        CONSTRAINT "PK_totp_device_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_totp_device_sessionId" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UQ_totp_device_sessionId" UNIQUE ("sessionId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_totp_device_updateId" ON "totp_device" ("updateId")
    `);

    await queryRunner.query(`
      CREATE TRIGGER "totp_updatedAt" BEFORE UPDATE ON "totp"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await queryRunner.query(`
      CREATE TRIGGER "totp_device_updatedAt" BEFORE UPDATE ON "totp_device"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "totp_device_updatedAt" ON "totp_device"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS "totp_updatedAt" ON "totp"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "totp_device"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "totp"`);
  }
}
