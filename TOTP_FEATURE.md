# TOTP (Time-based One-Time Password) Feature Documentation

## Overview

This document describes the implementation of TOTP (Time-based One-Time Password) support for Immich, enabling users to opt-in to two-factor authentication (2FA) using time-based one-time passwords. The implementation includes device fingerprinting to require TOTP verification only once per device.

## Features

- **User-initiated TOTP Setup**: Users can opt-in to enable TOTP 2FA
- **QR Code Generation**: Automatic QR code generation for easy setup with authenticator apps
- **Device Fingerprinting**: TOTP verification is required only once per device
- **Secure Secret Storage**: TOTP secrets are stored securely in the database
- **Easy Disable**: Users can disable TOTP at any time

## Database Schema

### TOTP Table
Stores user TOTP settings:
- `id` (UUID): Primary key
- `userId` (UUID): Foreign key to user table (unique constraint)
- `secret` (text): Base32-encoded TOTP secret
- `enabled` (boolean): Whether TOTP is enabled for this user
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp
- `updateId` (UUID): Update tracking ID

### TOTP Device Table
Tracks device verification status:
- `id` (UUID): Primary key
- `sessionId` (UUID): Foreign key to session table (unique constraint)
- `deviceFingerprint` (text): Device identifier (combination of device type, OS, app version)
- `totpVerified` (boolean): Whether TOTP has been verified for this device
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp
- `updateId` (UUID): Update tracking ID

## API Endpoints

### 1. Setup TOTP
**POST** `/auth/totp/setup`

Generates a new TOTP secret and QR code for setup.

**Authentication**: Required (user must be logged in)

**Response**:
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAA..."
}
```

**Error Cases**:
- `400 Bad Request`: TOTP is already enabled for this user
- `401 Unauthorized`: User not authenticated

### 2. Verify and Enable TOTP
**POST** `/auth/totp/verify`

Verifies the TOTP code and enables TOTP for the user.

**Authentication**: Required

**Request Body**:
```json
{
  "code": "123456",
  "deviceFingerprint": "device-identifier"
}
```

**Response**: `204 No Content`

**Error Cases**:
- `400 Bad Request`: TOTP setup not found or already enabled
- `401 Unauthorized`: Invalid TOTP code or user not authenticated

### 3. Get TOTP Status
**GET** `/auth/totp/status`

Retrieves the current TOTP status for the authenticated user.

**Authentication**: Required

**Response**:
```json
{
  "enabled": true
}
```

### 4. Disable TOTP
**DELETE** `/auth/totp`

Disables TOTP for the authenticated user.

**Authentication**: Required

**Response**: `204 No Content`

**Error Cases**:
- `400 Bad Request`: TOTP is not set up for this user
- `401 Unauthorized`: User not authenticated

## Implementation Details

### TOTP Service (`TotpService`)

The service handles all TOTP-related operations:

- **setupTotp(userId, userEmail)**: Generates a new TOTP secret and QR code
- **verifyAndEnableTotp(userId, code)**: Verifies the TOTP code and enables TOTP
- **verifyTotpCode(code, secret)**: Verifies a TOTP code against a secret
- **disableTotp(userId)**: Disables TOTP for a user
- **isTotpEnabled(userId)**: Checks if TOTP is enabled
- **getTotpStatus(userId)**: Gets TOTP status
- **isDeviceTotpVerified(userId, deviceFingerprint)**: Checks if device is verified
- **markDeviceVerified(sessionId)**: Marks a device as verified
- **createTotpDevice(sessionId, deviceFingerprint)**: Creates a new device record

### TOTP Repository (`TotpRepository`)

Handles database operations using Kysely ORM:

- Database queries for TOTP and device records
- CRUD operations for TOTP settings
- Device verification tracking

### Authentication Flow with TOTP

1. User logs in with email and password
2. If TOTP is enabled for the user:
   - Check if device is already verified
   - If not verified, require TOTP code
   - Verify TOTP code
   - Mark device as verified
3. Create session and return access token

## Device Fingerprinting

Device fingerprinting is used to identify unique devices and reduce the need for TOTP verification on trusted devices.

**Fingerprint Components**:
- Device type (mobile, web, desktop)
- Device OS (iOS, Android, Windows, macOS, Linux)
- App version (for mobile apps)

**Example Fingerprint**: `"web-linux-3.1.0"`

## Security Considerations

1. **Secret Storage**: TOTP secrets are stored in plaintext in the database. Consider encrypting them in production.
2. **Time Synchronization**: TOTP relies on accurate time synchronization between server and client.
3. **Backup Codes**: Consider implementing backup codes for account recovery.
4. **Rate Limiting**: Implement rate limiting on TOTP verification attempts to prevent brute force attacks.
5. **Device Fingerprinting**: Device fingerprints should be cryptographically hashed for better security.

## Dependencies

- `otplib`: TOTP generation and verification
- `qrcode`: QR code generation for easy setup

## Future Enhancements

1. **Backup Codes**: Generate and store backup codes for account recovery
2. **Device Management**: Allow users to view and manage trusted devices
3. **TOTP Enforcement**: Admin option to require TOTP for all users
4. **Recovery Options**: Email-based recovery if device is lost
5. **Encrypted Secrets**: Encrypt TOTP secrets at rest
6. **Audit Logging**: Log TOTP setup, verification, and disabling events

## Testing

Unit tests are provided in `totp.service.spec.ts` covering:
- TOTP setup
- TOTP verification
- Status retrieval
- Error handling

## Migration

A database migration is provided in `1790000000000-AddTotpTables.ts` that:
- Creates the `totp` table
- Creates the `totp_device` table
- Sets up indexes and triggers
- Adds foreign key constraints

To run the migration:
```bash
npm run migrations:run
```

## Usage Example

### Setup TOTP (Frontend)

```typescript
// 1. Request TOTP setup
const setupResponse = await fetch('/auth/totp/setup', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { secret, qrCode } = await setupResponse.json();

// 2. Display QR code to user
// User scans QR code with authenticator app

// 3. Verify TOTP code
const verifyResponse = await fetch('/auth/totp/verify', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({
    code: '123456',
    deviceFingerprint: 'web-linux-3.1.0'
  })
});
```

### Check TOTP Status

```typescript
const statusResponse = await fetch('/auth/totp/status', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { enabled } = await statusResponse.json();
```

### Disable TOTP

```typescript
const disableResponse = await fetch('/auth/totp', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## References

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [otplib Documentation](https://github.com/yeojz/otplib)
- [QRCode Documentation](https://github.com/davidshimjs/qrcodejs)
