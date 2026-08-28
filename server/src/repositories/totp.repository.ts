import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TotpTable } from 'src/schema/tables/totp.table';
import { TotpDeviceTable } from 'src/schema/tables/totp-device.table';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class TotpRepository extends BaseRepository {
  constructor(
    @InjectRepository(TotpTable) private totpRepository: Repository<TotpTable>,
    @InjectRepository(TotpDeviceTable) private totpDeviceRepository: Repository<TotpDeviceTable>,
  ) {
    super();
  }

  async getTotpByUserId(userId: string): Promise<TotpTable | null> {
    return this.totpRepository.findOne({ where: { userId } });
  }

  async createTotp(userId: string, secret: string): Promise<TotpTable> {
    return this.totpRepository.save({
      userId,
      secret,
      enabled: false,
    });
  }

  async enableTotp(userId: string): Promise<TotpTable> {
    await this.totpRepository.update({ userId }, { enabled: true });
    const totp = await this.getTotpByUserId(userId);
    if (!totp) {
      throw new Error('TOTP not found');
    }
    return totp;
  }

  async disableTotp(userId: string): Promise<void> {
    await this.totpRepository.update({ userId }, { enabled: false });
  }

  async deleteTotp(userId: string): Promise<void> {
    await this.totpRepository.delete({ userId });
  }

  async getTotpDeviceBySessionId(sessionId: string): Promise<TotpDeviceTable | null> {
    return this.totpDeviceRepository.findOne({ where: { sessionId } });
  }

  async createTotpDevice(sessionId: string, deviceFingerprint: string): Promise<TotpDeviceTable> {
    return this.totpDeviceRepository.save({
      sessionId,
      deviceFingerprint,
      totpVerified: false,
    });
  }

  async markTotpDeviceVerified(sessionId: string): Promise<void> {
    await this.totpDeviceRepository.update({ sessionId }, { totpVerified: true });
  }

  async getTotpDeviceByFingerprint(userId: string, deviceFingerprint: string): Promise<TotpDeviceTable | null> {
    return this.totpDeviceRepository
      .createQueryBuilder('td')
      .innerJoin('session', 's', 's.id = td.sessionId')
      .where('s.userId = :userId', { userId })
      .andWhere('td.deviceFingerprint = :deviceFingerprint', { deviceFingerprint })
      .andWhere('td.totpVerified = true')
      .orderBy('td.createdAt', 'DESC')
      .getOne();
  }
}
