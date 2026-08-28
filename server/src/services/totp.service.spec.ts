import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TotpService } from './totp.service';
import { TotpRepository } from 'src/repositories/totp.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';

describe('TotpService', () => {
  let service: TotpService;
  let totpRepository: jest.Mocked<TotpRepository>;
  let cryptoRepository: jest.Mocked<CryptoRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        {
          provide: TotpRepository,
          useValue: {
            getTotpByUserId: jest.fn(),
            createTotp: jest.fn(),
            enableTotp: jest.fn(),
            disableTotp: jest.fn(),
            deleteTotp: jest.fn(),
            getTotpDeviceBySessionId: jest.fn(),
            createTotpDevice: jest.fn(),
            markTotpDeviceVerified: jest.fn(),
            getTotpDeviceByFingerprint: jest.fn(),
          },
        },
        {
          provide: CryptoRepository,
          useValue: {
            randomBytes: jest.fn(),
            randomUUID: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TotpService>(TotpService);
    totpRepository = module.get(TotpRepository) as jest.Mocked<TotpRepository>;
    cryptoRepository = module.get(CryptoRepository) as jest.Mocked<CryptoRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setupTotp', () => {
    it('should generate a new TOTP secret and QR code', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';

      totpRepository.getTotpByUserId.mockResolvedValue(null);
      totpRepository.createTotp.mockResolvedValue({
        id: 'totp-id',
        userId,
        secret: 'test-secret',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateId: 'update-id',
      });

      const result = await service.setupTotp(userId, userEmail);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(totpRepository.getTotpByUserId).toHaveBeenCalledWith(userId);
      expect(totpRepository.createTotp).toHaveBeenCalled();
    });

    it('should throw error if TOTP is already enabled', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';

      totpRepository.getTotpByUserId.mockResolvedValue({
        id: 'totp-id',
        userId,
        secret: 'test-secret',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateId: 'update-id',
      });

      await expect(service.setupTotp(userId, userEmail)).rejects.toThrow(BadRequestException);
    });
  });

  describe('isTotpEnabled', () => {
    it('should return true if TOTP is enabled', async () => {
      const userId = 'test-user-id';

      totpRepository.getTotpByUserId.mockResolvedValue({
        id: 'totp-id',
        userId,
        secret: 'test-secret',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateId: 'update-id',
      });

      const result = await service.isTotpEnabled(userId);

      expect(result).toBe(true);
    });

    it('should return false if TOTP is not enabled', async () => {
      const userId = 'test-user-id';

      totpRepository.getTotpByUserId.mockResolvedValue(null);

      const result = await service.isTotpEnabled(userId);

      expect(result).toBe(false);
    });
  });

  describe('getTotpStatus', () => {
    it('should return TOTP status', async () => {
      const userId = 'test-user-id';

      totpRepository.getTotpByUserId.mockResolvedValue({
        id: 'totp-id',
        userId,
        secret: 'test-secret',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateId: 'update-id',
      });

      const result = await service.getTotpStatus(userId);

      expect(result).toEqual({ enabled: true });
    });
  });

  describe('disableTotp', () => {
    it('should disable TOTP for a user', async () => {
      const userId = 'test-user-id';

      totpRepository.getTotpByUserId.mockResolvedValue({
        id: 'totp-id',
        userId,
        secret: 'test-secret',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateId: 'update-id',
      });

      await service.disableTotp(userId);

      expect(totpRepository.disableTotp).toHaveBeenCalledWith(userId);
    });

    it('should throw error if TOTP is not set up', async () => {
      const userId = 'test-user-id';

      totpRepository.getTotpByUserId.mockResolvedValue(null);

      await expect(service.disableTotp(userId)).rejects.toThrow(BadRequestException);
    });
  });
});
