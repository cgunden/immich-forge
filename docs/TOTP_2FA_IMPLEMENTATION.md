# TOTP 2FA Implementation Guide

## Overview
This implementation adds Time-based One-Time Password (TOTP) two-factor authentication to Immich, allowing users to opt-in to an additional security layer for their accounts.

## Features Implemented

### Backend (Server)
1. **Database Schema**
   - Added `totpSecret` column to `user` table (nullable, stores base64-encoded secret)
   - Added `isTrustedDevice` column to `session` table (boolean, default false)
   - Migration: `1787200000000-AddTotpFields.ts`

2. **TOTP Implementation**
   - RFC 6238 compliant TOTP generation and verification
   - 30-second time steps
   - 6-digit codes
   - Time window tolerance (±30 seconds)
   - HMAC-SHA1 algorithm

3. **API Endpoints**
   - `POST /auth/totp/setup` - Generate TOTP secret and QR code
   - `POST /auth/totp/enable` - Enable 2FA by verifying TOTP code
   - `DELETE /auth/totp` - Disable 2FA with password verification
   - `POST /auth/totp/verify` - Verify TOTP code during login

4. **Security Features**
   - Password verification required for setup and disable operations
   - TOTP secrets stored securely in database
   - Device trust mechanism (90-day trusted device tokens)
   - All sessions invalidated when 2FA is disabled

### Frontend (Web)
1. **User Settings Component** (`TotpSettings.svelte`)
   - Setup flow with QR code display
   - Enable/disable functionality
   - Password verification
   - Success/error messaging

2. **Login Flow Updates**
   - TOTP code input field when 2FA is enabled
   - Trust device checkbox
   - Seamless integration with existing login flow

## Usage

### For Users

#### Enabling TOTP 2FA
1. Navigate to User Settings
2. Find "Two-Factor Authentication" section
3. Enter your password
4. Click "Setup Two-Factor Authentication"
5. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
6. Enter the 6-digit code from your app
7. Click "Enable Two-Factor Authentication"

#### Logging In with TOTP
1. Enter email and password as usual
2. If 2FA is enabled, you'll be prompted for a TOTP code
3. Enter the 6-digit code from your authenticator app
4. Optionally check "Trust this device" to skip 2FA for 90 days
5. Click "Login"

#### Disabling TOTP 2FA
1. Navigate to User Settings
2. Find "Two-Factor Authentication" section
3. Enter your password
4. Click "Disable Two-Factor Authentication"

### For Developers

#### Testing TOTP Locally
```bash
# Run unit tests
cd server
npm test crypto.repository.spec.ts

# Test TOTP setup endpoint
curl -X POST http://localhost:3001/api/auth/totp/setup \
  -H "Content-Type: application/json" \
  -H "Cookie: immich_access_token=YOUR_TOKEN" \
  -d '{"password": "your_password"}'

# Test TOTP enable endpoint
curl -X POST http://localhost:3001/api/auth/totp/enable \
  -H "Content-Type: application/json" \
  -H "Cookie: immich_access_token=YOUR_TOKEN" \
  -d '{"secret": "BASE64_SECRET", "code": "123456"}'
```

## Technical Details

### TOTP Algorithm
The implementation follows RFC 6238 (TOTP: Time-Based One-Time Password Algorithm):

1. **Secret Generation**: 20-byte (160-bit) random secret, base64-encoded
2. **Time Step**: 30 seconds (T = floor(Unix_time / 30))
3. **HMAC**: HMAC-SHA1(secret, time_step)
4. **Truncation**: Dynamic truncation to 6-digit code
5. **Verification Window**: ±1 time step (±30 seconds)

### Database Schema
```sql
-- User table
ALTER TABLE "user" ADD "totpSecret" character varying;

-- Session table
ALTER TABLE "session" ADD "isTrustedDevice" boolean DEFAULT false;
```

### API Request/Response Examples

#### Setup TOTP
**Request:**
```json
POST /auth/totp/setup
{
  "password": "user_password"
}
```

**Response:**
```json
{
  "secret": "BASE64_ENCODED_SECRET",
  "qrCode": "data:image/svg+xml,..."
}
```

#### Enable TOTP
**Request:**
```json
POST /auth/totp/enable
{
  "secret": "BASE64_ENCODED_SECRET",
  "code": "123456"
}
```

**Response:** 204 No Content

#### Verify TOTP
**Request:**
```json
POST /auth/totp/verify
{
  "code": "123456",
  "trustDevice": true
}
```

**Response:** 204 No Content

## Known Limitations

1. **QR Code Generation**: Currently uses a placeholder SVG. Should be replaced with a proper QR code library (e.g., `qrcode` npm package).

2. **Backup Codes**: Not implemented. Users who lose access to their authenticator app cannot recover their account without admin intervention.

3. **Rate Limiting**: No rate limiting on TOTP verification attempts. Should be added to prevent brute-force attacks.

4. **Mobile App**: Mobile app integration not yet implemented.

5. **Audit Logging**: 2FA events (enable, disable, failed attempts) are not logged.

## Future Enhancements

1. **Backup Codes**: Generate one-time backup codes during setup
2. **QR Code Library**: Replace placeholder with proper QR code generation
3. **Rate Limiting**: Add rate limiting for TOTP verification
4. **Audit Logging**: Log all 2FA-related events
5. **Mobile Support**: Add TOTP support to mobile apps
6. **Recovery Options**: Add email-based recovery for lost 2FA devices
7. **Multiple 2FA Methods**: Support for SMS, email, or hardware keys
8. **Admin Controls**: Allow admins to enforce 2FA for all users

## Security Considerations

1. **Secret Storage**: TOTP secrets are stored in the database. Consider encrypting them at rest.
2. **Time Synchronization**: Server time must be accurate for TOTP to work correctly.
3. **Brute Force Protection**: Implement rate limiting to prevent brute-force attacks.
4. **Session Management**: Trusted device tokens are tied to sessions and expire after 90 days.
5. **Password Verification**: All TOTP management operations require password verification.

## Compatibility

- **Authenticator Apps**: Compatible with any RFC 6238-compliant authenticator app:
  - Google Authenticator
  - Microsoft Authenticator
  - Authy
  - 1Password
  - Bitwarden
  - And many others

## Testing Checklist

- [x] TOTP secret generation
- [x] TOTP code verification
- [x] TOTP URI generation
- [ ] Setup flow (requires build environment)
- [ ] Enable flow (requires build environment)
- [ ] Disable flow (requires build environment)
- [ ] Login with TOTP (requires build environment)
- [ ] Trust device functionality (requires build environment)
- [ ] Error handling (requires build environment)
- [ ] Mobile app integration (not implemented)

## References

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [RFC 4226 - HOTP](https://tools.ietf.org/html/rfc4226)
- [Google Authenticator Key URI Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
