import { describe, it, expect } from 'vitest';
import { CryptoRepository } from '../repositories/crypto.repository';

describe('CryptoRepository - TOTP', () => {
  const cryptoRepository = new CryptoRepository();

  it('should generate a TOTP secret', () => {
    const secret = cryptoRepository.generateTotpSecret();
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThan(0);
    expect(Buffer.from(secret, 'base64').length).toBe(20);
  });

  it('should verify a valid TOTP code', () => {
    const secret = cryptoRepository.generateTotpSecret();
    const secretBuffer = Buffer.from(secret, 'base64');
    
    // Generate a token for the current time
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    const token = generateTotpToken(secretBuffer, timeStep);
    
    // Verify the token
    const isValid = cryptoRepository.verifyTotp(secret, token);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid TOTP code', () => {
    const secret = cryptoRepository.generateTotpSecret();
    const isValid = cryptoRepository.verifyTotp(secret, '000000');
    expect(isValid).toBe(false);
  });

  it('should generate a valid TOTP URI', () => {
    const secret = cryptoRepository.generateTotpSecret();
    const email = 'test@example.com';
    const uri = cryptoRepository.generateTotpUri(secret, email);
    
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('Immich');
    expect(uri).toContain(encodeURIComponent(email));
    expect(uri).toContain('secret=');
  });
});

// Helper function to generate TOTP token (copied from implementation for testing)
function generateTotpToken(secret: Buffer, counter: number): string {
  const { createHmac } = require('node:crypto');
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  
  const hmac = createHmac('sha1', secret);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}
