import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';
import { TotpTable } from 'src/schema/tables/totp.table';
import { TotpDeviceTable } from 'src/schema/tables/totp-device.table';
import { asUuid } from 'src/utils/database';

@Injectable()
export class TotpRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async getTotpByUserId(userId: string): Promise<TotpTable | null> {
    return this.db
      .selectFrom('totp')
      .selectAll()
      .where('userId', '=', asUuid(userId))
      .executeTakeFirst();
  }

  async createTotp(userId: string, secret: string): Promise<TotpTable> {
    return this.db
      .insertInto('totp')
      .values({
        userId: asUuid(userId),
        secret,
        enabled: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async enableTotp(userId: string): Promise<TotpTable> {
    return this.db
      .updateTable('totp')
      .set({ enabled: true })
      .where('userId', '=', asUuid(userId))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async disableTotp(userId: string): Promise<void> {
    await this.db
      .updateTable('totp')
      .set({ enabled: false })
      .where('userId', '=', asUuid(userId))
      .execute();
  }

  async deleteTotp(userId: string): Promise<void> {
    await this.db
      .deleteFrom('totp')
      .where('userId', '=', asUuid(userId))
      .execute();
  }

  async getTotpDeviceBySessionId(sessionId: string): Promise<TotpDeviceTable | null> {
    return this.db
      .selectFrom('totp_device')
      .selectAll()
      .where('sessionId', '=', asUuid(sessionId))
      .executeTakeFirst();
  }

  async createTotpDevice(sessionId: string, deviceFingerprint: string): Promise<TotpDeviceTable> {
    return this.db
      .insertInto('totp_device')
      .values({
        sessionId: asUuid(sessionId),
        deviceFingerprint,
        totpVerified: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async markTotpDeviceVerified(sessionId: string): Promise<void> {
    await this.db
      .updateTable('totp_device')
      .set({ totpVerified: true })
      .where('sessionId', '=', asUuid(sessionId))
      .execute();
  }

  async getTotpDeviceByFingerprint(userId: string, deviceFingerprint: string): Promise<TotpDeviceTable | null> {
    return this.db
      .selectFrom('totp_device')
      .innerJoin('session', (join) => join.onRef('session.id', '=', 'totp_device.sessionId'))
      .selectAll('totp_device')
      .where('session.userId', '=', asUuid(userId))
      .where('totp_device.deviceFingerprint', '=', deviceFingerprint)
      .where('totp_device.totpVerified', '=', true)
      .orderBy('totp_device.createdAt', 'desc')
      .executeTakeFirst();
  }
}

