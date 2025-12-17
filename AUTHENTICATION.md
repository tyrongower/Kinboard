# Authentication System Documentation

## Overview

Kinboard implements a dual authentication system:
- **Admin Authentication**: User-based authentication with email/password
- **Kiosk Authentication**: Token-based authentication for display devices

## Architecture

### Token Strategy

**Access Tokens (JWT)**
- Lifetime: 15 minutes
- Storage: Memory (client-side)
- Used for: API request authorization
- Claims: User ID, Role, Email, Display Name

**Refresh Tokens (Admin only)**
- Lifetime: 7 days
- Storage: HttpOnly secure cookie + database
- Rotating: Old token replaced on each refresh
- Used for: Obtaining new access tokens

**Kiosk Tokens**
- Lifetime: No expiration (until revoked)
- Storage: Database
- Used for: One-time authentication via URL parameter

### Security Features

1. **HttpOnly Cookies**: Refresh tokens stored in HttpOnly cookies prevent XSS attacks
2. **Token Rotation**: Refresh tokens are rotated on each use for forward secrecy
3. **Short-Lived Access Tokens**: 15-minute expiration minimizes exposure window
4. **Secure Cookies**: Cookies marked as Secure (HTTPS only) and SameSite=Lax
5. **Password Hashing**: BCrypt with automatic salt generation
6. **HTTPS Enforcement**: All production traffic must use HTTPS
7. **CORS with Credentials**: Properly configured for cross-origin cookie handling

## Authentication Flows

### Admin Login Flow

```
1. User submits email + password to POST /api/auth/admin/login
2. Backend verifies credentials
3. Backend generates:
   - Access token (JWT, 15min)
   - Refresh token (random, 7 days)
4. Refresh token saved to database
5. Refresh token set as HttpOnly cookie
6. Access token returned in response body
7. Frontend stores access token in memory
8. Frontend sets global access token for API calls
```

### Token Refresh Flow

```
1. Frontend detects token near expiration (14 minutes)
2. POST /api/auth/admin/refresh (refresh token sent via cookie)
3. Backend validates refresh token
4. Backend generates new tokens
5. Old refresh token marked as revoked
6. New refresh token saved and returned as cookie
7. New access token returned in response
8. Frontend updates in-memory access token
```

### Kiosk Authentication Flow

```
1. Admin creates kiosk token via POST /api/auth/kiosk/tokens
2. Admin shares URL: /kiosk/auth?token=XXXXX
3. Kiosk navigates to URL
4. Frontend extracts token from query parameter
5. Frontend calls POST /api/auth/kiosk/authenticate
6. Backend validates token (checks active status)
7. Backend generates access token with "kiosk" role
8. Frontend stores access token in memory
9. Kiosk auto-refreshes access token every 14 minutes
```

### Logout Flow

**Admin Logout**
```
1. User clicks logout
2. Frontend calls POST /api/auth/admin/logout (with access token)
3. Backend revokes refresh token in database
4. Backend clears refresh token cookie
5. Frontend clears access token from memory
```

**Kiosk Token Revocation** (Admin action)
```
1. Admin calls DELETE /api/auth/kiosk/tokens/{id}
2. Backend marks token as revoked
3. Kiosk's access token expires naturally (15 min)
4. Kiosk cannot obtain new access token (revoked)
```

## API Endpoints

### Admin Authentication

**POST /api/auth/admin/login**
```json
Request:
{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "role": "admin",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "displayName": "Admin User"
  }
}
```

**POST /api/auth/admin/refresh**
```
Request: (no body, refresh token via cookie)

Response:
{
  "accessToken": "eyJhbGc...",
  "role": "admin",
  "user": { ... }
}
```

**POST /api/auth/admin/logout**
```
Request: (requires Authorization header)

Response:
{
  "message": "Logged out successfully"
}
```

### Kiosk Authentication

**POST /api/auth/kiosk/authenticate**
```json
Request:
{
  "token": "kiosk-token-string"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "role": "kiosk"
}
```

**POST /api/auth/kiosk/tokens** (Admin only)
```json
Request:
{
  "name": "Kitchen Display"
}

Response:
{
  "id": 1,
  "token": "kiosk-token-string",
  "name": "Kitchen Display",
  "createdAt": "2025-12-17T00:00:00Z"
}
```

**GET /api/auth/kiosk/tokens** (Admin only)
```json
Response:
[
  {
    "id": 1,
    "name": "Kitchen Display",
    "createdAt": "2025-12-17T00:00:00Z",
    "isActive": true
  }
]
```

**DELETE /api/auth/kiosk/tokens/{id}** (Admin only)
```json
Response:
{
  "message": "Token revoked successfully"
}
```

### Auth Status

**GET /api/auth/status**
```
Request: (requires Authorization header)

Response:
{
  "role": "admin",
  "user": { ... }
}
```

## Role-Based Access Control

### Admin Access
- Full system access
- User management
- Calendar management
- Site settings
- Kiosk token management
- Job creation/editing/deletion

### Kiosk Access
- Read-only job viewing
- Job completion marking
- Calendar viewing (read-only)
- Weather display
- Shopping list viewing

### Endpoint Authorization Matrix

| Endpoint | Admin | Kiosk |
|----------|-------|-------|
| GET /api/jobs | ✓ | ✓ |
| POST /api/jobs | ✓ | ✗ |
| PUT /api/jobs/* | ✓ | ✗ |
| DELETE /api/jobs/* | ✓ | ✗ |
| POST /api/jobs/*/assignments/*/complete | ✓ | ✓ |
| GET /api/users | ✓ | ✓ |
| POST /api/users | ✓ | ✗ |
| PUT /api/users/* | ✓ | ✗ |
| DELETE /api/users/* | ✓ | ✗ |
| GET /api/calendars | ✓ | ✓ |
| POST /api/calendars | ✓ | ✗ |
| GET /api/sitesettings | ✓ | ✓ |
| PUT /api/sitesettings | ✓ | ✗ |

## Database Schema

### Users Table (Extended)
```sql
- Id: int (PK)
- Username: string
- DisplayName: string
- Email: string (nullable, for admins)
- PasswordHash: string (nullable, for admins)
- IsAdmin: bool
- ColorHex: string
- AvatarUrl: string
- DisplayOrder: int
```

### RefreshTokens Table
```sql
- Id: int (PK)
- Token: string (unique, indexed)
- UserId: int (FK -> Users)
- ExpiresAt: datetime
- CreatedAt: datetime
- RevokedAt: datetime (nullable)
- ReplacedByToken: string (nullable)
- RevocationReason: string (nullable)
```

### KioskTokens Table
```sql
- Id: int (PK)
- Token: string (unique, indexed)
- Name: string
- CreatedAt: datetime
- RevokedAt: datetime (nullable)
- RevocationReason: string (nullable)
```

## Configuration

### Backend (appsettings.json)

```json
{
  "Jwt": {
    "Secret": "YOUR_SECRET_KEY_MINIMUM_32_CHARACTERS",
    "Issuer": "Kinboard.Api",
    "Audience": "Kinboard.Frontend"
  },
  "Cors": {
    "AllowedOrigins": [
      "https://yourdomain.com"
    ]
  }
}
```

**⚠️ IMPORTANT**: Change the JWT secret to a cryptographically secure random string before deploying to production. Generate with:
```bash
openssl rand -base64 32
```

### Frontend (Environment Variables)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Initial Setup

1. **Run database migrations**:
   ```bash
   cd backend/Kinboard.Api
   dotnet ef database update
   ```

2. **Create initial admin user**:
   ```bash
   POST /api/setup/init-admin
   {
     "email": "admin@example.com",
     "password": "SecurePassword123!",
     "displayName": "System Administrator"
   }
   ```

3. **Verify admin login**:
   ```bash
   POST /api/auth/admin/login
   {
     "email": "admin@example.com",
     "password": "SecurePassword123!"
   }
   ```

4. **Create kiosk token** (authenticated as admin):
   ```bash
   POST /api/auth/kiosk/tokens
   Authorization: Bearer <admin-access-token>
   {
     "name": "Kitchen Kiosk"
   }
   ```

5. **Test kiosk access**:
   ```
   Navigate to: https://yourdomain.com/kiosk/auth?token=<kiosk-token>
   ```

## Security Best Practices

1. **JWT Secret**: Use a cryptographically secure random string (minimum 32 characters)
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure allowed origins restrictively
4. **Rate Limiting**: Consider adding rate limiting on auth endpoints (future enhancement)
5. **Password Policy**: Enforce strong passwords (minimum 8 characters currently)
6. **Token Expiration**: Review token lifetimes based on security requirements
7. **Database Backups**: Regular backups of SQLite database (contains refresh tokens)
8. **Log Monitoring**: Monitor authentication logs for suspicious activity

## Troubleshooting

### "Invalid credentials" on login
- Verify email and password are correct
- Check database for user existence
- Verify `IsAdmin` flag is true
- Check logs for BCrypt verification errors

### Token refresh fails
- Refresh token may have expired (7 days)
- Refresh token may have been revoked
- Cookie may not be sent (check CORS/credentials settings)
- Check browser console for cookie issues

### Kiosk authentication fails
- Token may have been revoked
- Token string may be incorrect
- Check database for token existence and active status

### CORS errors
- Verify `AllowedOrigins` in appsettings.json
- Ensure frontend makes requests with `credentials: 'include'`
- Check that cookies have SameSite=Lax (not None)

### Access token not included in API calls
- Verify AuthContext is wrapping the app
- Check that `setGlobalAccessToken` is called
- Verify `authFetch` is used instead of `fetch`

## Future Enhancements

1. **Rate Limiting**: Add rate limiting on authentication endpoints to prevent brute force attacks
2. **2FA**: Add two-factor authentication for admin users
3. **Session Management**: Add ability to view and revoke active sessions
4. **Password Reset**: Implement email-based password reset flow
5. **Audit Logging**: Track authentication events (logins, logouts, token refreshes)
6. **Token Blacklist**: Implement token blacklist for immediate access token revocation
7. **OAuth/SSO**: Add support for OAuth providers (Google, Microsoft, etc.)
