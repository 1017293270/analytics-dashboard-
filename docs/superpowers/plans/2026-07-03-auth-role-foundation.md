# Auth Role Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the real login, session, current-user, and role foundation needed by the smart education demo platform.

**Architecture:** Keep the current Express/Vue monorepo shape. Add database-backed users, roles, user-role assignments, and sessions in the API, expose `/api/auth/*` and `/api/roles`, then add a Vue auth API, Pinia store, login view, and router guard. Existing big-screen dashboard behavior stays intact in this plan; later plans will consume the authenticated actor and roles for workbench visibility.

**Tech Stack:** Vue 3, Pinia, Vue Router, TypeScript, Express, Prisma SQLite, Zod, Vitest, Supertest, Node `crypto`.

---

## Scope

This is plan 1 of the approved smart education demo platform design. It covers only:

- Shared auth/role types.
- Prisma auth tables and test migration loading.
- Password hashing and demo user/role seed data.
- Cookie-backed sessions.
- Auth and role API routes.
- Frontend login, current-user store, and route guard.

It does not convert dashboard permissions from `demo-user` yet. That happens in the later workbench visibility plan after a stable auth context exists.

Before implementing frontend UI in this plan, read `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md` and keep the login view aligned with the smart education shell language.

## File Structure

- `packages/shared/src/auth.ts`: shared role codes, user status, current-user validators, and helper functions.
- `packages/shared/src/auth.test.ts`: shared auth type/helper tests.
- `packages/shared/src/index.ts`: export auth types.
- `apps/api/prisma/schema.prisma`: add `User`, `Role`, `UserRole`, and `Session`.
- `apps/api/prisma/migrations/20260703090000_auth_roles/migration.sql`: auth/role/session tables.
- `apps/api/tests/setup-database.ts`: apply every migration in order and clear auth tables between tests.
- `apps/api/src/errors.ts`: add `sendUnauthorized`.
- `apps/api/src/auth/password.ts`: password hash/verify helpers using Node `crypto.scryptSync`.
- `apps/api/src/auth/auth.seed.ts`: idempotent seeded roles and demo users.
- `apps/api/src/auth/session.ts`: cookie parsing, session creation/destruction, auth context middleware, and require-auth middleware.
- `apps/api/src/auth/auth.routes.ts`: login, logout, and current-user routes.
- `apps/api/src/auth/role.routes.ts`: role list route.
- `apps/api/src/app.ts`: enable CORS credentials, install auth context middleware, and mount auth/role routes.
- `apps/api/tests/auth.routes.test.ts`: API tests for login, logout, current user, and role list access.
- `apps/web/src/features/auth/api/authApi.ts`: frontend auth requests with `credentials: 'include'`.
- `apps/web/src/features/auth/stores/useAuthStore.ts`: current-user state and auth actions.
- `apps/web/src/features/auth/stores/useAuthStore.test.ts`: auth store tests.
- `apps/web/src/features/auth/LoginView.vue`: compact login screen.
- `apps/web/src/features/auth/LoginView.test.ts`: login screen behavior tests.
- `apps/web/src/router.ts`: login route and navigation guard.
- `apps/web/src/smoke.test.ts`: route expectations.

---

### Task 1: Shared Auth Contract

**Files:**
- Create: `packages/shared/src/auth.ts`
- Create: `packages/shared/src/auth.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write the failing shared tests**

Create `packages/shared/src/auth.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  currentUserValidator,
  hasRole,
  isSystemAdmin,
  roleCodeValidator,
  userStatusValidator,
  type CurrentUser,
} from './auth.js'

describe('auth shared contract', () => {
  test('validates supported smart education role codes', () => {
    expect(roleCodeValidator.parse('system-admin')).toBe('system-admin')
    expect(roleCodeValidator.parse('all-staff')).toBe('all-staff')
    expect(roleCodeValidator.parse('electro-education-director')).toBe('electro-education-director')
    expect(roleCodeValidator.parse('moral-education-director')).toBe('moral-education-director')
    expect(roleCodeValidator.parse('teaching-research-director')).toBe('teaching-research-director')
    expect(() => roleCodeValidator.parse('guest')).toThrow()
  })

  test('validates active and disabled user statuses', () => {
    expect(userStatusValidator.parse('active')).toBe('active')
    expect(userStatusValidator.parse('disabled')).toBe('disabled')
    expect(() => userStatusValidator.parse('locked')).toThrow()
  })

  test('validates the current user response shape', () => {
    const parsed = currentUserValidator.parse({
      id: 'user-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-admin', code: 'system-admin', name: '系统管理员' }],
    })

    expect(parsed.roles[0]?.code).toBe('system-admin')
  })

  test('checks role membership helpers', () => {
    const user: CurrentUser = {
      id: 'user-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-admin', code: 'system-admin', name: '系统管理员' }],
    }

    expect(hasRole(user, 'system-admin')).toBe(true)
    expect(hasRole(user, 'all-staff')).toBe(false)
    expect(isSystemAdmin(user)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the shared test and verify it fails**

Run:

```powershell
npm --workspace packages/shared run test -- auth
```

Expected: FAIL because `packages/shared/src/auth.ts` does not exist.

- [ ] **Step 3: Add the shared auth contract**

Create `packages/shared/src/auth.ts`:

```ts
import { z } from 'zod'

export const roleCodeValidator = z.enum([
  'system-admin',
  'all-staff',
  'electro-education-director',
  'moral-education-director',
  'teaching-research-director',
])

export type RoleCode = z.infer<typeof roleCodeValidator>

export const userStatusValidator = z.enum(['active', 'disabled'])
export type UserStatus = z.infer<typeof userStatusValidator>

export const currentUserRoleValidator = z.object({
  id: z.string().min(1),
  code: roleCodeValidator,
  name: z.string().min(1),
})

export type CurrentUserRole = z.infer<typeof currentUserRoleValidator>

export const currentUserValidator = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  status: userStatusValidator,
  roles: z.array(currentUserRoleValidator),
})

export type CurrentUser = z.infer<typeof currentUserValidator>

export function hasRole(user: CurrentUser | null, roleCode: RoleCode): boolean {
  return Boolean(user?.roles.some((role) => role.code === roleCode))
}

export function isSystemAdmin(user: CurrentUser | null): boolean {
  return hasRole(user, 'system-admin')
}
```

Modify `packages/shared/src/index.ts`:

```ts
export const sharedVersion = '0.1.0'
export * from './api.js'
export * from './auth.js'
export * from './dashboard-schema.js'
export * from './permissions.js'
```

- [ ] **Step 4: Run the shared auth tests and verify they pass**

Run:

```powershell
npm --workspace packages/shared run test -- auth
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Run the shared package test suite**

Run:

```powershell
npm --workspace packages/shared run test
```

Expected: PASS, including the new auth tests.

- [ ] **Step 6: Commit**

Run:

```powershell
git add packages/shared/src/auth.ts packages/shared/src/auth.test.ts packages/shared/src/index.ts
git commit -m "feat: add shared auth role contract"
```

---

### Task 2: Prisma Auth Schema and Test Migration Loading

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260703090000_auth_roles/migration.sql`
- Modify: `apps/api/tests/setup-database.ts`

- [ ] **Step 1: Write the failing schema-backed API test**

Create `apps/api/tests/auth.routes.test.ts` with this initial test only:

```ts
import { describe, expect, test } from 'vitest'
import { prisma } from '../src/db.js'

describe('auth persistence schema', () => {
  test('can create users, roles, user-role assignments, and sessions', async () => {
    const user = await prisma.user.create({
      data: {
        id: 'user-admin',
        username: 'admin',
        displayName: '系统管理员',
        passwordHash: 'hash-value',
        status: 'active',
      },
    })
    const role = await prisma.role.create({
      data: {
        id: 'role-admin',
        code: 'system-admin',
        name: '系统管理员',
        description: '平台管理账号',
      },
    })
    await prisma.userRole.create({
      data: {
        id: 'user-role-admin',
        userId: user.id,
        roleId: role.id,
      },
    })
    await prisma.session.create({
      data: {
        id: 'session-admin',
        tokenHash: 'token-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })

    const loaded = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: { roles: { include: { role: true } }, sessions: true },
    })

    expect(loaded?.roles[0]?.role.code).toBe('system-admin')
    expect(loaded?.sessions[0]?.tokenHash).toBe('token-hash')
  })
})
```

- [ ] **Step 2: Run the API auth test and verify it fails**

Run:

```powershell
npm --workspace apps/api run test -- auth.routes
```

Expected: FAIL because `prisma.user`, `prisma.role`, `prisma.userRole`, and `prisma.session` are not generated models.

- [ ] **Step 3: Add Prisma models**

Append these models to `apps/api/prisma/schema.prisma` after `AuditLog`:

```prisma
model User {
  id           String   @id
  username     String   @unique
  displayName  String
  passwordHash String
  status       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  roles    UserRole[]
  sessions Session[]
}

model Role {
  id          String   @id
  code        String   @unique
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users UserRole[]
}

model UserRole {
  id     String @id
  userId String
  roleId String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([roleId])
}

model Session {
  id         String   @id
  tokenHash  String   @unique
  userId     String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  lastSeenAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

- [ ] **Step 4: Add the auth migration SQL**

Create `apps/api/prisma/migrations/20260703090000_auth_roles/migration.sql`:

```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "Role" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

CREATE TABLE "UserRole" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
```

- [ ] **Step 5: Update the test database setup to apply all migrations**

Replace `apps/api/tests/setup-database.ts` with:

```ts
import { readFile, readdir } from 'node:fs/promises'
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import type { prisma as prismaClient } from '../src/db.js'

const testDbPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'test.db')
process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, '/')}`
rmSync(testDbPath, { force: true })
rmSync(`${testDbPath}-journal`, { force: true })

let prisma: typeof prismaClient

async function applyMigrationFile(migrationPath: string) {
  const migration = await readFile(migrationPath, 'utf8')
  for (const statement of migration.split(/;\s*(?:\r?\n|$)/).map((sql) => sql.trim())) {
    if (statement.length > 0) await prisma.$executeRawUnsafe(statement)
  }
}

beforeAll(async () => {
  prisma = (await import('../src/db.js')).prisma
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'migrations')
  const migrationDirs = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const migrationDir of migrationDirs) {
    await applyMigrationFile(join(migrationsDir, migrationDir, 'migration.sql'))
  }
})

beforeEach(async () => {
  await prisma.auditLog.deleteMany()
  await prisma.dashboardShareLink.deleteMany()
  await prisma.dashboardPermission.deleteMany()
  await prisma.dashboardVersion.deleteMany()
  await prisma.dashboard.deleteMany()
  await prisma.session.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

- [ ] **Step 6: Regenerate Prisma Client**

Run:

```powershell
npm --workspace apps/api run prisma:generate
```

Expected: Prisma Client generated successfully and includes `user`, `role`, `userRole`, and `session`.

- [ ] **Step 7: Run the schema-backed API test and verify it passes**

Run:

```powershell
npm --workspace apps/api run test -- auth.routes
```

Expected: PASS with the schema persistence test.

- [ ] **Step 8: Commit**

Run:

```powershell
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260703090000_auth_roles/migration.sql apps/api/tests/setup-database.ts apps/api/tests/auth.routes.test.ts
git commit -m "feat: add auth persistence schema"
```

---

### Task 3: API Passwords, Demo Seed, Sessions, and Auth Routes

**Files:**
- Create: `apps/api/src/auth/password.ts`
- Create: `apps/api/src/auth/password.test.ts`
- Create: `apps/api/src/auth/auth.seed.ts`
- Create: `apps/api/src/auth/session.ts`
- Create: `apps/api/src/auth/auth.routes.ts`
- Modify: `apps/api/src/errors.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/tests/auth.routes.test.ts`

- [ ] **Step 1: Replace the API auth route tests with behavior tests**

Replace `apps/api/tests/auth.routes.test.ts` with:

```ts
import request from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'
import { prisma } from '../src/db.js'

const app = createApp()

async function login(username = 'admin', password = 'Admin@123') {
  return request(app).post('/api/auth/login').send({ username, password })
}

function getSessionCookie(response: request.Response) {
  const cookies = response.headers['set-cookie']
  const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
  return cookieList.find((cookie) => cookie.startsWith('analytics_session='))
}

describe('auth routes', () => {
  beforeEach(async () => {
    await ensureDemoAuthSeed()
  })

  test('logs in a seeded system admin and returns the current user', async () => {
    const response = await login().expect(200)

    expect(response.body).toMatchObject({
      success: true,
      data: {
        username: 'admin',
        displayName: '系统管理员',
        status: 'active',
        roles: [{ code: 'system-admin', name: '系统管理员' }],
      },
    })
    expect(getSessionCookie(response)).toContain('HttpOnly')
    expect(getSessionCookie(response)).toContain('SameSite=Lax')

    const sessionCount = await prisma.session.count()
    expect(sessionCount).toBe(1)
  })

  test('rejects an invalid password without creating a session', async () => {
    const response = await login('admin', 'wrong-password').expect(401)

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Username or password is invalid' },
    })
    await expect(prisma.session.count()).resolves.toBe(0)
  })

  test('loads the current user from the session cookie', async () => {
    const loginResponse = await login().expect(200)
    const cookie = getSessionCookie(loginResponse)
    expect(cookie).toBeTruthy()

    const response = await request(app).get('/api/auth/me').set('Cookie', cookie ?? '').expect(200)

    expect(response.body.data.username).toBe('admin')
    expect(response.body.data.roles.map((role: { code: string }) => role.code)).toContain('system-admin')
  })

  test('returns 401 for current user without a valid session', async () => {
    const response = await request(app).get('/api/auth/me').expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  test('logs out by deleting the session and clearing the cookie', async () => {
    const loginResponse = await login().expect(200)
    const cookie = getSessionCookie(loginResponse)
    expect(cookie).toBeTruthy()

    const logoutResponse = await request(app).post('/api/auth/logout').set('Cookie', cookie ?? '').send({}).expect(200)

    expect(logoutResponse.body.data).toEqual({ loggedOut: true })
    expect(getSessionCookie(logoutResponse)).toContain('Max-Age=0')
    await expect(prisma.session.count()).resolves.toBe(0)
  })
})
```

- [ ] **Step 2: Add password helper tests**

Create `apps/api/src/auth/password.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password helpers', () => {
  test('hashes and verifies a password', () => {
    const hash = hashPassword('Admin@123')

    expect(hash).toMatch(/^scrypt\$/)
    expect(verifyPassword('Admin@123', hash)).toBe(true)
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })

  test('rejects malformed hashes', () => {
    expect(verifyPassword('Admin@123', 'not-a-valid-hash')).toBe(false)
  })
})
```

- [ ] **Step 3: Run the auth API tests and verify they fail**

Run:

```powershell
npm --workspace apps/api run test -- auth.routes password
```

Expected: FAIL because the auth helper and route files do not exist.

- [ ] **Step 4: Add password hashing helpers**

Create `apps/api/src/auth/password.ts`:

```ts
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString('base64url')

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, nValue, rValue, pValue, salt, hash] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !nValue || !rValue || !pValue || !salt || !hash) return false

  const expected = Buffer.from(hash, 'base64url')
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(nValue),
    r: Number(rValue),
    p: Number(pValue),
  })

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
```

- [ ] **Step 5: Add demo role and user seed data**

Create `apps/api/src/auth/auth.seed.ts`:

```ts
import type { RoleCode } from '@analytics/shared'
import { prisma } from '../db.js'
import { hashPassword } from './password.js'

type DemoRole = {
  id: string
  code: RoleCode
  name: string
  description: string
}

type DemoUser = {
  id: string
  username: string
  displayName: string
  password: string
  roleCodes: RoleCode[]
}

export const demoRoles: DemoRole[] = [
  { id: 'role-system-admin', code: 'system-admin', name: '系统管理员', description: '平台配置与演示管理账号' },
  { id: 'role-all-staff', code: 'all-staff', name: '全员', description: '全校教职工默认角色' },
  {
    id: 'role-electro-education-director',
    code: 'electro-education-director',
    name: '电教主任',
    description: '负责电教设备、应用与运维告警',
  },
  {
    id: 'role-moral-education-director',
    code: 'moral-education-director',
    name: '德育主任',
    description: '负责德育与学生成长相关看板',
  },
  {
    id: 'role-teaching-research-director',
    code: 'teaching-research-director',
    name: '教研主任',
    description: '负责教研与教师发展相关看板',
  },
]

export const demoUsers: DemoUser[] = [
  {
    id: 'user-system-admin',
    username: 'admin',
    displayName: '系统管理员',
    password: 'Admin@123',
    roleCodes: ['system-admin'],
  },
  {
    id: 'user-all-staff',
    username: 'all_staff',
    displayName: '全员演示账号',
    password: 'Demo@123',
    roleCodes: ['all-staff'],
  },
  {
    id: 'user-electro-director',
    username: 'electro_director',
    displayName: '电教主任',
    password: 'Demo@123',
    roleCodes: ['electro-education-director'],
  },
  {
    id: 'user-moral-director',
    username: 'moral_director',
    displayName: '德育主任',
    password: 'Demo@123',
    roleCodes: ['moral-education-director'],
  },
  {
    id: 'user-research-director',
    username: 'research_director',
    displayName: '教研主任',
    password: 'Demo@123',
    roleCodes: ['teaching-research-director'],
  },
]

export async function ensureDemoAuthSeed() {
  for (const role of demoRoles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    })
  }

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        status: 'active',
      },
      create: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        passwordHash: hashPassword(user.password),
        status: 'active',
      },
    })

    for (const roleCode of user.roleCodes) {
      const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } })
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: {
          id: `user-role-${user.id}-${role.id}`,
          userId: user.id,
          roleId: role.id,
        },
      })
    }
  }
}
```

- [ ] **Step 6: Add session and auth-context helpers**

Create `apps/api/src/auth/session.ts`:

```ts
import { createHash } from 'node:crypto'
import type { CurrentUser } from '@analytics/shared'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'
import { sendUnauthorized } from '../errors.js'

export const SESSION_COOKIE_NAME = 'analytics_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

export type AuthContext = {
  user: CurrentUser | null
  sessionId: string | null
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function parseCookies(header: string | undefined) {
  const cookies = new Map<string, string>()
  for (const part of header?.split(';') ?? []) {
    const [rawName, ...rawValueParts] = part.trim().split('=')
    if (!rawName || rawValueParts.length === 0) continue
    cookies.set(rawName, decodeURIComponent(rawValueParts.join('=')))
  }
  return cookies
}

function serializeCookie(name: string, value: string, options: { maxAgeSeconds?: number } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`)
  }
  return parts.join('; ')
}

function toCurrentUser(user: {
  id: string
  username: string
  displayName: string
  status: string
  roles: Array<{ role: { id: string; code: string; name: string } }>
}): CurrentUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status === 'disabled' ? 'disabled' : 'active',
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      code: role.code as CurrentUser['roles'][number]['code'],
      name: role.name,
    })),
  }
}

export async function createSession(userId: string) {
  const token = nanoid(64)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const session = await prisma.session.create({
    data: {
      id: nanoid(),
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  })
  return { token, session }
}

export async function destroySession(token: string | null) {
  if (!token) return
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
}

export function setSessionCookie(res: Response, token: string) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, token, { maxAgeSeconds: SESSION_TTL_MS / 1000 }))
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', { maxAgeSeconds: 0 }))
}

export function getSessionToken(req: Request) {
  return parseCookies(req.headers.cookie).get(SESSION_COOKIE_NAME) ?? null
}

async function loadAuthContext(req: Request) {
  const token = getSessionToken(req)
  req.auth = { user: null, sessionId: null }

  if (!token) {
    return
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roles: { include: { role: true } } } } },
  })

  if (!session || session.expiresAt.getTime() <= Date.now() || session.user.status !== 'active') {
    await destroySession(token)
    return
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  })

  req.auth = { user: toCurrentUser(session.user), sessionId: session.id }
}

export const attachAuthContext: RequestHandler = (req, _res, next: NextFunction) => {
  void loadAuthContext(req).then(() => next()).catch(next)
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.auth?.user) {
    sendUnauthorized(res, 'Authentication is required')
    return
  }
  next()
}

export { toCurrentUser }
```

- [ ] **Step 7: Add auth routes**

Create `apps/api/src/auth/auth.routes.ts`:

```ts
import { ok } from '@analytics/shared'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { asyncHandler, sendUnauthorized } from '../errors.js'
import { ensureDemoAuthSeed } from './auth.seed.js'
import { verifyPassword } from './password.js'
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionToken,
  requireAuth,
  setSessionCookie,
  toCurrentUser,
} from './session.js'

const loginBody = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
})

export const authRoutes = Router()

authRoutes.post('/auth/login', asyncHandler(async (req, res) => {
  await ensureDemoAuthSeed()
  const body = loginBody.safeParse(req.body)
  if (!body.success) return sendUnauthorized(res, 'Username or password is invalid')

  const user = await prisma.user.findUnique({
    where: { username: body.data.username },
    include: { roles: { include: { role: true } } },
  })

  if (!user || user.status !== 'active' || !verifyPassword(body.data.password, user.passwordHash)) {
    return sendUnauthorized(res, 'Username or password is invalid')
  }

  const { token } = await createSession(user.id)
  setSessionCookie(res, token)
  res.json(ok(toCurrentUser(user)))
}))

authRoutes.get('/auth/me', requireAuth, (req, res) => {
  res.json(ok(req.auth?.user))
})

authRoutes.post('/auth/logout', asyncHandler(async (req, res) => {
  await destroySession(getSessionToken(req))
  clearSessionCookie(res)
  res.json(ok({ loggedOut: true }))
}))
```

- [ ] **Step 8: Add unauthorized error helper**

Modify `apps/api/src/errors.ts`:

```ts
import { fail } from '@analytics/shared'
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next)
  }
}

export function sendBadRequest(res: Response, code: string, message: string) {
  return res.status(400).json(fail(code, message))
}

export function sendUnauthorized(res: Response, message = 'Authentication is required') {
  return res.status(401).json(fail('UNAUTHORIZED', message))
}

export function sendForbidden(res: Response, message = 'You do not have permission for this dashboard') {
  return res.status(403).json(fail('FORBIDDEN', message))
}

export function sendConflict(res: Response, code: string, message: string) {
  return res.status(409).json(fail(code, message))
}

export function sendNotFound(res: Response, message = 'Dashboard not found') {
  return res.status(404).json(fail('NOT_FOUND', message))
}

export const errorMiddleware: ErrorRequestHandler = (_error, _req, res, _next) => {
  res.status(500).json(fail('INTERNAL_ERROR', 'An internal server error occurred'))
}
```

- [ ] **Step 9: Mount auth middleware and routes**

Modify `apps/api/src/app.ts`:

```ts
import cors from 'cors'
import express from 'express'
import { ok } from '@analytics/shared'
import { authRoutes } from './auth/auth.routes.js'
import { attachAuthContext } from './auth/session.js'
import { dashboardRoutes } from './dashboards/dashboard.routes.js'
import { dataRoutes } from './data/data.routes.js'
import { env } from './env.js'
import { errorMiddleware } from './errors.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(attachAuthContext)

  app.get('/api/health', (_req, res) => {
    res.json(ok({ status: 'ok' }))
  })
  app.use('/api', authRoutes)
  app.use('/api', dashboardRoutes)
  app.use('/api', dataRoutes)
  app.use(errorMiddleware)

  return app
}
```

- [ ] **Step 10: Run the auth API tests and verify they pass**

Run:

```powershell
npm --workspace apps/api run test -- auth.routes password
```

Expected: PASS for password helper tests and auth route tests.

- [ ] **Step 11: Run the full API test suite**

Run:

```powershell
npm --workspace apps/api run test
```

Expected: PASS. Existing dashboard and data route tests should still pass because auth middleware is passive unless a route calls `requireAuth`.

- [ ] **Step 12: Commit**

Run:

```powershell
git add apps/api/src/auth apps/api/src/app.ts apps/api/src/errors.ts apps/api/tests/auth.routes.test.ts
git commit -m "feat: add API auth sessions"
```

---

### Task 4: API Role List Route

**Files:**
- Create: `apps/api/src/auth/role.routes.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/tests/role.routes.test.ts`

- [ ] **Step 1: Write role route tests**

Create `apps/api/tests/role.routes.test.ts`:

```ts
import request from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'

const app = createApp()

async function login(username: string, password: string) {
  const response = await request(app).post('/api/auth/login').send({ username, password }).expect(200)
  const cookies = response.headers['set-cookie']
  const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
  return cookieList.find((cookie) => cookie.startsWith('analytics_session=')) ?? ''
}

describe('role routes', () => {
  beforeEach(async () => {
    await ensureDemoAuthSeed()
  })

  test('system admin can list seeded roles', async () => {
    const cookie = await login('admin', 'Admin@123')

    const response = await request(app).get('/api/roles').set('Cookie', cookie).expect(200)

    expect(response.body.data.map((role: { code: string }) => role.code)).toEqual([
      'system-admin',
      'all-staff',
      'electro-education-director',
      'moral-education-director',
      'teaching-research-director',
    ])
  })

  test('non-admin users cannot list roles', async () => {
    const cookie = await login('all_staff', 'Demo@123')

    const response = await request(app).get('/api/roles').set('Cookie', cookie).expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('anonymous users cannot list roles', async () => {
    const response = await request(app).get('/api/roles').expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})
```

- [ ] **Step 2: Run role route tests and verify they fail**

Run:

```powershell
npm --workspace apps/api run test -- role.routes
```

Expected: FAIL because `/api/roles` is not mounted.

- [ ] **Step 3: Add role routes**

Create `apps/api/src/auth/role.routes.ts`:

```ts
import { isSystemAdmin, ok } from '@analytics/shared'
import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler, sendForbidden } from '../errors.js'
import { demoRoles, ensureDemoAuthSeed } from './auth.seed.js'
import { requireAuth } from './session.js'

export const roleRoutes = Router()

roleRoutes.get('/roles', requireAuth, asyncHandler(async (req, res) => {
  if (!isSystemAdmin(req.auth?.user ?? null)) {
    return sendForbidden(res, 'Only system administrators can manage roles')
  }

  await ensureDemoAuthSeed()
  const roles = await prisma.role.findMany({
    where: { code: { in: demoRoles.map((role) => role.code) } },
  })
  const rolesByCode = new Map(roles.map((role) => [role.code, role]))
  res.json(
    ok(
      demoRoles.map((demoRole) => {
        const role = rolesByCode.get(demoRole.code)
        return {
          id: role?.id ?? demoRole.id,
          code: demoRole.code,
          name: role?.name ?? demoRole.name,
          description: role?.description ?? demoRole.description,
        }
      }),
    ),
  )
}))
```

- [ ] **Step 4: Mount role routes**

Modify `apps/api/src/app.ts`:

```ts
import cors from 'cors'
import express from 'express'
import { ok } from '@analytics/shared'
import { authRoutes } from './auth/auth.routes.js'
import { roleRoutes } from './auth/role.routes.js'
import { attachAuthContext } from './auth/session.js'
import { dashboardRoutes } from './dashboards/dashboard.routes.js'
import { dataRoutes } from './data/data.routes.js'
import { env } from './env.js'
import { errorMiddleware } from './errors.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(attachAuthContext)

  app.get('/api/health', (_req, res) => {
    res.json(ok({ status: 'ok' }))
  })
  app.use('/api', authRoutes)
  app.use('/api', roleRoutes)
  app.use('/api', dashboardRoutes)
  app.use('/api', dataRoutes)
  app.use(errorMiddleware)

  return app
}
```

- [ ] **Step 5: Run role and auth route tests**

Run:

```powershell
npm --workspace apps/api run test -- auth.routes role.routes
```

Expected: PASS for both suites.

- [ ] **Step 6: Commit**

Run:

```powershell
git add apps/api/src/auth/role.routes.ts apps/api/src/app.ts apps/api/tests/role.routes.test.ts
git commit -m "feat: expose role list API"
```

---

### Task 5: Frontend Auth API, Store, Login View, and Route Guard

**Files:**
- Create: `apps/web/src/features/auth/api/authApi.ts`
- Create: `apps/web/src/features/auth/stores/useAuthStore.ts`
- Create: `apps/web/src/features/auth/stores/useAuthStore.test.ts`
- Create: `apps/web/src/features/auth/LoginView.vue`
- Create: `apps/web/src/features/auth/LoginView.test.ts`
- Modify: `apps/web/src/router.ts`
- Modify: `apps/web/src/smoke.test.ts`

- [ ] **Step 0: Read the smart education UI guidelines**

Read:

```powershell
Get-Content -LiteralPath 'docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md' -Encoding utf8
```

Expected: The login view follows the documented auth page rules: one centered panel, compact demo account hints, existing tokens, no marketing hero, and no decorative background art.

- [ ] **Step 1: Write auth store tests**

Create `apps/web/src/features/auth/stores/useAuthStore.test.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { authApi } from '../api/authApi'
import { useAuthStore } from './useAuthStore'

vi.mock('../api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

const adminUser = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  status: 'active' as const,
  roles: [{ id: 'role-system-admin', code: 'system-admin' as const, name: '系统管理员' }],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('loads the current user', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const store = useAuthStore()

    await store.loadCurrentUser()

    expect(store.user?.username).toBe('admin')
    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isSystemAdmin).toBe(true)
  })

  test('treats current-user failures as anonymous', async () => {
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Authentication is required'))
    const store = useAuthStore()

    await store.loadCurrentUser()

    expect(store.user).toBeNull()
    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(false)
  })

  test('logs in and stores the returned user', async () => {
    vi.mocked(authApi.login).mockResolvedValue(adminUser)
    const store = useAuthStore()

    await store.login({ username: 'admin', password: 'Admin@123' })

    expect(store.user?.displayName).toBe('系统管理员')
    expect(store.error).toBeNull()
  })

  test('logs out and clears the current user', async () => {
    vi.mocked(authApi.login).mockResolvedValue(adminUser)
    vi.mocked(authApi.logout).mockResolvedValue({ loggedOut: true })
    const store = useAuthStore()

    await store.login({ username: 'admin', password: 'Admin@123' })
    await store.logout()

    expect(store.user).toBeNull()
  })
})
```

- [ ] **Step 2: Write login view tests**

Create `apps/web/src/features/auth/LoginView.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import { useAuthStore } from './stores/useAuthStore'

vi.mock('./api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: LoginView },
      { path: '/', component: { template: '<div>home</div>' } },
    ],
  })
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('renders demo account hints and submits credentials', async () => {
    const router = createTestRouter()
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as never)
    const store = useAuthStore()
    const loginSpy = vi.spyOn(store, 'login').mockResolvedValue()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('智慧教育集控平台')
    expect(wrapper.text()).toContain('admin / Admin@123')

    await wrapper.find('input[name="username"]').setValue('admin')
    await wrapper.find('input[name="password"]').setValue('Admin@123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(loginSpy).toHaveBeenCalledWith({ username: 'admin', password: 'Admin@123' })
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  test('shows login errors from the store', async () => {
    const router = createTestRouter()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockRejectedValue(new Error('Username or password is invalid'))

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('input[name="username"]').setValue('admin')
    await wrapper.find('input[name="password"]').setValue('wrong-password')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Username or password is invalid')
  })
})
```

- [ ] **Step 3: Run frontend auth tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- useAuthStore LoginView
```

Expected: FAIL because the auth API, store, and login view do not exist.

- [ ] **Step 4: Add frontend auth API**

Create `apps/web/src/features/auth/api/authApi.ts`:

```ts
import type { ApiResponse, CurrentUser } from '@analytics/shared'

export type LoginInput = {
  username: string
  password: string
}

export type LogoutResult = {
  loggedOut: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isRecord(value)) return false
  if (value.success === true) return Object.prototype.hasOwnProperty.call(value, 'data')
  if (value.success === false) {
    const error = value.error
    return isRecord(error) && typeof error.code === 'string' && typeof error.message === 'string'
  }
  return false
}

async function requestAuthJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init?.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })
  const text = await response.text()
  const body = text ? JSON.parse(text) as unknown : null

  if (!isApiResponse<T>(body)) throw new Error('Invalid API response')
  if (!body.success) throw new Error(body.error.message)
  return body.data
}

export const authApi = {
  login(input: LoginInput, init?: RequestInit) {
    return requestAuthJson<CurrentUser>('/api/auth/login', {
      ...init,
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  logout(init?: RequestInit) {
    return requestAuthJson<LogoutResult>('/api/auth/logout', {
      ...init,
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  getCurrentUser(init?: RequestInit) {
    return requestAuthJson<CurrentUser>('/api/auth/me', init)
  },
}
```

- [ ] **Step 5: Add auth store**

Create `apps/web/src/features/auth/stores/useAuthStore.ts`:

```ts
import { isSystemAdmin as sharedIsSystemAdmin, type CurrentUser, type RoleCode } from '@analytics/shared'
import { defineStore } from 'pinia'
import { authApi, type LoginInput } from '../api/authApi'

type AuthState = {
  user: CurrentUser | null
  initialized: boolean
  isLoading: boolean
  error: string | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '认证服务暂不可用'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    isLoading: false,
    error: null,
  }),
  getters: {
    isAuthenticated(state): boolean {
      return state.user !== null
    },
    isSystemAdmin(state): boolean {
      return sharedIsSystemAdmin(state.user)
    },
  },
  actions: {
    hasRole(roleCode: RoleCode) {
      return Boolean(this.user?.roles.some((role) => role.code === roleCode))
    },
    async loadCurrentUser() {
      this.isLoading = true
      this.error = null
      try {
        this.user = await authApi.getCurrentUser()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
        this.isLoading = false
      }
    },
    async login(input: LoginInput) {
      this.isLoading = true
      this.error = null
      try {
        this.user = await authApi.login(input)
        this.initialized = true
      } catch (error) {
        this.user = null
        this.error = getErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    async logout() {
      this.isLoading = true
      this.error = null
      try {
        await authApi.logout()
      } finally {
        this.user = null
        this.initialized = true
        this.isLoading = false
      }
    },
  },
})
```

- [ ] **Step 6: Add login view**

Create `apps/web/src/features/auth/LoginView.vue`:

```vue
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/useAuthStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: 'admin', password: 'Admin@123' })
const submitError = ref<string | null>(null)
const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
})

async function submitLogin() {
  submitError.value = null
  try {
    await auth.login({ username: form.username, password: form.password })
    await router.push(redirectTarget.value)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '登录失败'
  }
}
</script>

<template>
  <main class="login-view">
    <section class="login-view__panel" aria-labelledby="login-title">
      <div class="login-view__brand">
        <p class="login-view__eyebrow">Smart Education Console</p>
        <h1 id="login-title">智慧教育集控平台</h1>
        <p>使用演示账号登录，进入角色化工作台与集控管理功能。</p>
      </div>

      <form class="login-view__form" @submit.prevent="submitLogin">
        <label>
          <span>账号</span>
          <input v-model="form.username" name="username" autocomplete="username" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" name="password" type="password" autocomplete="current-password" />
        </label>
        <p v-if="submitError || auth.error" class="login-view__error" role="alert">{{ submitError || auth.error }}</p>
        <button type="submit" :disabled="auth.isLoading">{{ auth.isLoading ? '登录中' : '登录' }}</button>
      </form>

      <div class="login-view__demo">
        <strong>演示账号</strong>
        <span>系统管理员：admin / Admin@123</span>
        <span>全员：all_staff / Demo@123</span>
        <span>电教主任：electro_director / Demo@123</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-view {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px;
  background: #eef2f7;
  color: var(--color-text);
}

.login-view__panel {
  display: grid;
  gap: 22px;
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.login-view__brand,
.login-view__brand h1,
.login-view__brand p {
  margin: 0;
}

.login-view__brand {
  display: grid;
  gap: 8px;
}

.login-view__eyebrow {
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 900;
}

.login-view__brand h1 {
  font-size: 28px;
  line-height: 1.1;
}

.login-view__brand p,
.login-view__demo {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.login-view__form {
  display: grid;
  gap: 14px;
}

.login-view__form label,
.login-view__demo {
  display: grid;
  gap: 6px;
}

.login-view__form label span {
  font-size: 13px;
  font-weight: 800;
}

.login-view__form input {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font: inherit;
}

.login-view__form input:focus {
  border-color: var(--color-accent);
  outline: 3px solid var(--color-accent-soft);
}

.login-view__form button {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: var(--color-accent);
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 900;
}

.login-view__form button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.login-view__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 800;
}

.login-view__demo {
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

.login-view__demo strong {
  color: var(--color-text);
}
</style>
```

- [ ] **Step 7: Add route guard and login route**

Replace `apps/web/src/router.ts` with:

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './features/auth/stores/useAuthStore'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/big-screens' },
    {
      path: '/login',
      component: () => import('./features/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/big-screens',
      component: () => import('./features/big-screen/designer/DashboardList.vue'),
    },
    {
      path: '/big-screens/:id',
      component: () => import('./features/big-screen/designer/DesignerShell.vue'),
    },
    {
      path: '/runtime/:id',
      component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
    },
    {
      path: '/share/:token',
      component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.loadCurrentUser()
  }

  if (to.meta.public) {
    if (to.path === '/login' && auth.isAuthenticated) return '/'
    return true
  }

  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})
```

- [ ] **Step 8: Update smoke test for login route**

Modify `apps/web/src/smoke.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { router } from './router'

describe('web smoke test', () => {
  test('registers expected application routes', () => {
    const routePaths = router.getRoutes().map((route) => route.path)

    expect(routePaths).toEqual(expect.arrayContaining([
      '/',
      '/login',
      '/big-screens',
      '/big-screens/:id',
      '/runtime/:id',
      '/share/:token',
    ]))
  })
})
```

- [ ] **Step 9: Run frontend auth tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- useAuthStore LoginView smoke
```

Expected: PASS.

- [ ] **Step 10: Run web lint**

Run:

```powershell
npm --workspace apps/web run lint
```

Expected: PASS.

- [ ] **Step 11: Commit**

Run:

```powershell
git add apps/web/src/features/auth apps/web/src/router.ts apps/web/src/smoke.test.ts
git commit -m "feat: add frontend login guard"
```

---

### Task 6: End-to-End Verification for Auth Foundation

**Files:**
- Modify only if a prior task left a failing type or test issue in an already-touched file.

- [ ] **Step 1: Regenerate Prisma Client**

Run:

```powershell
npm --workspace apps/api run prisma:generate
```

Expected: Prisma Client generation succeeds.

- [ ] **Step 2: Run shared tests**

Run:

```powershell
npm --workspace packages/shared run test
```

Expected: PASS.

- [ ] **Step 3: Run API tests**

Run:

```powershell
npm --workspace apps/api run test
```

Expected: PASS.

- [ ] **Step 4: Run web tests**

Run:

```powershell
npm --workspace apps/web run test
```

Expected: PASS.

- [ ] **Step 5: Run full build**

Run:

```powershell
npm run build
```

Expected: PASS. The existing Vite chunk-size warning may appear and is acceptable.

- [ ] **Step 6: Commit final verification fixes if any were required**

If Step 1 through Step 5 required code changes, commit them:

```powershell
git add apps packages
git commit -m "fix: stabilize auth foundation verification"
```

If no code changes were required, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: this plan covers the approved design's account system requirement, seeded users/roles, current-user endpoint, route guard foundation, and role list management endpoint. Workbench visibility, application visibility, alarms, smart blackboard, and interactive teaching are intentionally left to later plans named in the approved spec.
- Red-flag scan: this plan contains concrete file paths, commands, expected test outcomes, and implementation snippets for each task.
- Type consistency: role codes use the shared `RoleCode` enum values across shared, API, and web code; current user responses use `CurrentUser`; auth cookies use `analytics_session` consistently.
