# Invitation Endpoints

## Overview

The invitation system enables administrators to invite new users to the platform by associating them with an existing profile (Employee, Agent, ClientAdmin, or Affiliate). Invitations are token-based, time-limited, and ensure that each profile can only be linked to a single user account.

---

## Database Tables

### Primary Tables

| Table | Purpose |
|-------|---------|
| `invitations` | Stores invitation records with hashed tokens, target email, role assignment, and profile linkage |
| `users` | Created when an invitation is accepted; stores credentials and role assignment |
| `sessions` | Created upon acceptance to immediately authenticate the new user |

### Profile Tables (exactly one linked per invitation)

| Table | Description |
|-------|-------------|
| `employees` | Internal platform staff profiles |
| `agents` | External broker/agent profiles |
| `client_admins` | Client administrator profiles |
| `affiliates` | End-user/member profiles |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `roles` | Defines the role assigned to the invited user |
| `role_permissions` | Maps permissions to roles |
| `permissions` | Individual permission definitions |

---

## Endpoints

### 1. Create Invitation

**`POST /auth/invitations`**

Creates a new invitation for a profile that does not yet have a user account.

#### Authentication
- Requires authenticated session
- Requires `users:invite` permission

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleId` | string | Yes | ID of the role to assign to the new user |
| `employeeId` | string | Conditional | Profile ID (exactly one profile field required) |
| `agentId` | string | Conditional | Profile ID (exactly one profile field required) |
| `clientAdminId` | string | Conditional | Profile ID (exactly one profile field required) |
| `affiliateId` | string | Conditional | Profile ID (exactly one profile field required) |
| `email` | string | Conditional | Override email for affiliates without profile email |

#### Validation Rules

1. **Profile ID Constraint**: Exactly one profile ID field must be provided
2. **Role Existence**: The specified role must exist in the system
3. **Profile Existence**: The specified profile must exist
4. **Profile Active Status**: The profile must have `isActive = true`
5. **Profile Not Linked**: The profile must not already be linked to a user (`userId` must be null)
6. **Email Availability**: The invitation email must not already be associated with an existing user

#### Email Resolution Logic

| Profile Type | Email Source |
|--------------|--------------|
| Employee | Profile email (required) |
| Agent | Profile email (required) |
| ClientAdmin | Profile email (required) |
| Affiliate | Provided email, or profile email if not provided |

For non-affiliate profiles, if an email is provided in the request, it must match the profile's email exactly (case-insensitive).

#### Business Logic

1. Validate role exists
2. Determine profile type and retrieve profile
3. Validate profile is active and not already linked to a user
4. Resolve and validate invitation email
5. Check email is not already in use by another user
6. Generate cryptographically secure token (32 bytes, hex-encoded)
7. Hash token using SHA-256 before storage
8. Calculate expiration (7 days from creation)
9. Upsert invitation record (updates existing invitation for same profile if pending)
10. Enqueue email job to send invitation link
11. Log audit event (`INVITATION_SENT`)

#### Response

```json
{
  "invitationId": "clx...",
  "expiresAt": "2024-01-15T10:00:00.000Z"
}
```

---

### 2. Validate Invitation Token

**`GET /auth/invitations/:token`**

Validates an invitation token without consuming it. Used by the frontend to verify the token before displaying the registration form.

#### Authentication
- None required (public endpoint)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | The invitation token from the email link |

#### Validation Rules

1. **Token Format**: Token must be a non-empty string
2. **Token Existence**: Hashed token must match an existing invitation
3. **Not Accepted**: Invitation must not have been previously accepted (`acceptedAt` must be null)
4. **Not Expired**: Current time must be before `expiresAt`

#### Business Logic

1. Hash the provided token using SHA-256
2. Look up invitation by token hash
3. Verify invitation exists, is not accepted, and is not expired
4. Return expiration date and assigned role information

#### Response

```json
{
  "expiresAt": "2024-01-15T10:00:00.000Z",
  "role": {
    "displayName": "Sales Agent"
  }
}
```

#### Error Responses

| Condition | HTTP Status | Message |
|-----------|-------------|---------|
| Invalid/expired/accepted token | 404 | Invalid or expired invitation |

---

### 3. Accept Invitation

**`POST /auth/invitations/accept`**

Accepts an invitation, creates the user account, links the profile, and establishes an authenticated session.

#### Authentication
- None required (public endpoint)

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | The invitation token from the email link |
| `password` | string | Yes | Password for the new account (12-128 characters) |

#### Validation Rules

1. **Token Format**: Token must be a non-empty string
2. **Password Length**: Must be between 12 and 128 characters
3. **Token Existence**: Hashed token must match an existing invitation
4. **Not Accepted**: Invitation must not have been previously accepted
5. **Not Expired**: Current time must be before `expiresAt`
6. **Email Availability**: Invitation email must not be in use by another user (race condition check)
7. **Profile Not Linked**: Target profile must not have been linked to another user (race condition check)

#### Business Logic (Atomic Transaction)

The following operations execute within a single database transaction to ensure consistency:

1. **Mark Invitation Accepted**: Set `acceptedAt` timestamp (conditional update ensures idempotency)
2. **Create User Account**:
   - Email from invitation (normalized to lowercase)
   - Password hashed using Argon2id
   - Role from invitation
   - `emailVerifiedAt` set to current time (invitation receipt proves email ownership)
   - `isActive` set to true
3. **Link Profile to User**: Update profile's `userId` (conditional update prevents race conditions)
4. **Create Session**: Generate session token, hash it, store with 30-day expiration
5. **Set Session Cookie**: HTTP-only secure cookie with session token
6. **Log Audit Event**: Record `INVITATION_ACCEPTED` with user and invitation IDs

#### Concurrency Handling

- **Invitation Already Accepted**: If another request accepted the invitation between validation and transaction, returns 404
- **Profile Already Linked**: If the profile was linked to another user between validation and transaction, returns 409

#### Response

```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "emailVerifiedAt": "2024-01-08T10:00:00.000Z",
    "name": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "role": {
      "id": "clx...",
      "name": "agent",
      "scopeType": "CLIENT"
    },
    "permissions": ["policies:read", "claims:create"]
  },
  "expiresAt": "2024-02-07T10:00:00.000Z"
}
```

#### Error Responses

| Condition | HTTP Status | Message |
|-----------|-------------|---------|
| Invalid/expired/accepted token | 404 | Invalid or expired invitation |
| Email already in use | 409 | Email already in use |
| Profile already linked | 409 | Profile already has a user account |

---

### 4. Resend Invitation

**`POST /auth/invitations/:id/resend`**

Regenerates the invitation token and resends the invitation email. The previous token is invalidated.

#### Authentication
- Requires authenticated session
- Requires `users:invite` permission

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The invitation ID (not the token) |

#### Validation Rules

1. **ID Format**: ID must be a non-empty string
2. **Invitation Existence**: Invitation with the specified ID must exist
3. **Not Accepted**: Invitation must not have been previously accepted (`acceptedAt` must be null)

#### Business Logic

1. Look up invitation by ID
2. Verify invitation exists and has not been accepted
3. Generate new cryptographically secure token (32 bytes)
4. Hash new token using SHA-256
5. Calculate new expiration (7 days from now)
6. Update invitation with new token hash and expiration (conditional update for race safety)
7. Enqueue email job to send new invitation link
8. Log audit event (`INVITATION_SENT` with `resent: true`)

#### Concurrency Handling

If the invitation was accepted between the initial check and the update, returns 409 Conflict.

#### Response

```json
{
  "invitationId": "clx...",
  "expiresAt": "2024-01-15T10:00:00.000Z"
}
```

#### Error Responses

| Condition | HTTP Status | Message |
|-----------|-------------|---------|
| Invitation not found | 404 | Invitation not found |
| Already accepted | 409 | Invitation already accepted |

---

## Security Considerations

### Token Security
- Tokens are 32 bytes of cryptographically secure random data (256 bits of entropy)
- Only SHA-256 hashes are stored in the database; raw tokens exist only in email links
- Token lookup is performed using the hash, preventing timing attacks

### Password Security
- Passwords are hashed using Argon2id with secure defaults
- Minimum length of 12 characters enforced
- Maximum length of 128 characters to prevent DoS via long password hashing

### Email Verification
- Accepting an invitation automatically verifies the email address
- Rationale: receiving and using the invitation token proves email ownership

### Session Security
- Sessions expire after 30 days
- Session tokens are stored as SHA-256 hashes
- HTTP-only secure cookies prevent XSS token theft

### Audit Trail
- All invitation operations are logged to the audit system
- Tracks who created/resent invitations and who accepted them
