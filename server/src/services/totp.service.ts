import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { TotpRepository } from 'src/repositories/totp.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { BaseService } from 'src/services/base.service';

export interface TotpSetupResponse {
  secret: string;
  qrCode: string;
}

export interface TotpVerifyRequest {
  code: string;
  deviceFingerprint: string;
}

@Injectable()
export class TotpService extends BaseService {
  constructor(
    private totpRepository: TotpRepository,
    private cryptoRepository: CryptoRepository,
  ) {
    super();
  }

  /**
   * Generate a new TOTP secret and QR code for setup
   */
  async setupTotp(userId: string, userEmail: string): Promise<TotpSetupResponse> {
    const existingTotp = await this.totpRepository.getTotpByUserId(userId);
    if (existingTotp?.enabled) {
      throw new BadRequestException('TOTP is already enabled for this user');
    }

    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Create or update the TOTP record (disabled by default)
    if (existingTotp) {
      // Update existing disabled TOTP - we need to update via database
      // For now, delete and recreate
      await this.totpRepository.deleteTotp(userId);
    }

    // Create new TOTP
    await this.totpRepository.createTotp(userId, secret);

    // Generate QR code
    const otpauth_url = authenticator.keyuri(userEmail, 'Immich', secret);
    const qrCode = await this.generateQrCode(otpauth_url);

    return {
      secret,
      qrCode,
    };
  }

  /**
   * Verify TOTP code and enable TOTP for the user
   */
  async verifyAndEnableTotp(userId: string, code: string): Promise<void> {
    const totp = await this.totpRepository.getTotpByUserId(userId);
    if (!totp) {
      throw new BadRequestException('TOTP setup not found. Please setup TOTP first.');
    }

    if (totp.enabled) {
      throw new BadRequestException('TOTP is already enabled');
    }

    // Verify the code
    const isValid = authenticator.check(code, totp.secret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Enable TOTP
    await this.totpRepository.enableTotp(userId);
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTotpCode(code: string, secret: string): Promise<boolean> {
    try {
      return authenticator.check(code, secret);
    } catch (error) {
      this.logger.error(`Error verifying TOTP code: ${error}`);
      return false;
    }
  }

  /**
   * Disable TOTP for a user
   */
  async disableTotp(userId: string): Promise<void> {
    const totp = await this.totpRepository.getTotpByUserId(userId);
    if (!totp) {
      throw new BadRequestException('TOTP is not set up for this user');
    }

    await this.totpRepository.disableTotp(userId);
  }

  /**
   * Check if TOTP is enabled for a user
   */
  async isTotpEnabled(userId: string): Promise<boolean> {
    const totp = await this.totpRepository.getTotpByUserId(userId);
    return totp?.enabled ?? false;
  }

  /**
   * Get TOTP status for a user
   */
  async getTotpStatus(userId: string): Promise<{ enabled: boolean; backupCodesCount?: number }> {
    const totp = await this.totpRepository.getTotpByUserId(userId);
    return {
      enabled: totp?.enabled ?? false,
    };
  }

  /**
   * Check if device needs TOTP verification
   */
  async isDeviceTotpVerified(userId: string, deviceFingerprint: string): Promise<boolean> {
    const device = await this.totpRepository.getTotpDeviceByFingerprint(userId, deviceFingerprint);
    return !!device;
  }

  /**
   * Mark device as TOTP verified
   */
  async markDeviceVerified(sessionId: string): Promise<void> {
    await this.totpRepository.markTotpDeviceVerified(sessionId);
  }

  /**
   * Create a new TOTP device record
   */
  async createTotpDevice(sessionId: string, deviceFingerprint: string): Promise<void> {
    await this.totpRepository.createTotpDevice(sessionId, deviceFingerprint);
  }

  /**
   * Generate QR code from otpauth URL
   */
  private async generateQrCode(otpauthUrl: string): Promise<string> {
    try {
      // Using qrcode library to generate QR code
      const QRCode = require('qrcode');
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      this.logger.error(`Error generating QR code: ${error}`);
      throw new BadRequestException('Failed to generate QR code');
    }
  }
}

