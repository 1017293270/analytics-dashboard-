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

  const n = Number(nValue)
  const r = Number(rValue)
  const p = Number(pValue)
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || n <= 0 || r <= 0 || p <= 0) {
    return false
  }

  let actual: Buffer
  const expected = Buffer.from(hash, 'base64url')
  try {
    actual = scryptSync(password, salt, expected.length, { N: n, r, p })
  } catch {
    return false
  }

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
