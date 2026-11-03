import crypto from 'crypto';
import QRCode from 'qrcode';
import { getDerivedEncryptionKey } from './jwt.ts';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
const ISSUER_NAME = 'AZ OVERVERSE';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically strong 160-bit (32 Base32 character) TOTP secret.
 */
export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

export function formatManualSecretKey(base32Secret: string): string {
  return base32Secret.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * RFC 6238 / RFC 4226 HMAC-SHA1 6-digit code computation for a given 30-second counter step.
 */
export function generateTotpCodeAtStep(base32Secret: string, counterStep: number): string {
  const key = base32Decode(base32Secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counterStep));

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binaryCode % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

export function generateCurrentTotpCode(
  base32Secret: string,
  timestampMs = Date.now()
): string {
  const step = Math.floor(timestampMs / 1000 / TOTP_PERIOD_SECONDS);
  return generateTotpCodeAtStep(base32Secret, step);
}

/**
 * Constant-time verification of a 6-digit TOTP code with ±1 step (30s) clock drift window.
 */
export function verifyTotpCode(
  base32Secret: string,
  rawCandidateCode: string,
  windowSteps = 1,
  timestampMs = Date.now()
): boolean {
  const candidate = (rawCandidateCode || '').trim();
  if (!/^\d{6}$/.test(candidate)) {
    return false;
  }

  const currentStep = Math.floor(timestampMs / 1000 / TOTP_PERIOD_SECONDS);
  const candidateBuf = Buffer.from(candidate, 'utf8');

  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const expected = generateTotpCodeAtStep(base32Secret, currentStep + delta);
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (
      expectedBuf.length === candidateBuf.length &&
      crypto.timingSafeEqual(expectedBuf, candidateBuf)
    ) {
      return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(params: {
  accountEmail: string;
  base32Secret: string;
  issuer?: string;
}): string {
  const issuer = params.issuer || ISSUER_NAME;
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(params.accountEmail)}`;
  const query = new URLSearchParams({
    secret: params.base32Secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}

export async function generateTotpQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 240,
    color: {
      dark: '#09090b',
      light: '#ffffff',
    },
  });
}

/**
 * Encrypts TOTP Base32 secrets with AES-256-GCM before storing in PostgreSQL.
 */
export function encryptTotpSecret(plainBase32Secret: string): string {
  const key = getDerivedEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainBase32Secret, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptTotpSecret(storedValue: string): string {
  if (!storedValue.startsWith('v1:')) {
    return storedValue;
  }
  const [, ivHex, tagHex, dataHex] = storedValue.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Malformed encrypted TOTP secret.');
  }
  const key = getDerivedEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const DEFAULT_RECOVERY_CODE_COUNT = 8;

/**
 * Generates unambiguous one-time recovery codes formatted as XXXX-XXXX (e.g. K9P4-M7W2).
 */
export function generateRecoveryCodes(count = DEFAULT_RECOVERY_CODE_COUNT): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    const bytes = crypto.randomBytes(8);
    let chars = '';
    for (let i = 0; i < 8; i++) {
      chars += RECOVERY_CODE_ALPHABET[bytes[i] & 31];
    }
    codes.add(`${chars.slice(0, 4)}-${chars.slice(4, 8)}`);
  }
  return Array.from(codes);
}

export function normalizeRecoveryCode(rawCode: string): string {
  return (rawCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashRecoveryCode(rawCode: string): string {
  const normalized = normalizeRecoveryCode(rawCode);
  return crypto
    .createHmac('sha256', getDerivedEncryptionKey())
    .update(`oververse-recovery-v1:${normalized}`)
    .digest('hex');
}

export function serializeRecoveryCodeHashes(plainCodes: string[]): string {
  return JSON.stringify(plainCodes.map((code) => hashRecoveryCode(code)));
}

export function verifyAndConsumeRecoveryCode(
  storedHashesJson: string | null | undefined,
  rawCandidate: string
): {
  matched: boolean;
  nextStoredHashesJson: string;
  remainingCount: number;
} {
  let hashes: string[] = [];
  if (storedHashesJson) {
    try {
      const parsed = JSON.parse(storedHashesJson);
      if (Array.isArray(parsed)) {
        hashes = parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      hashes = [];
    }
  }

  const normalized = normalizeRecoveryCode(rawCandidate);
  if (normalized.length !== 8 || hashes.length === 0) {
    return {
      matched: false,
      nextStoredHashesJson: JSON.stringify(hashes),
      remainingCount: hashes.length,
    };
  }

  const candidateHash = hashRecoveryCode(normalized);
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  let matchedIndex = -1;

  for (let i = 0; i < hashes.length; i++) {
    const existingBuf = Buffer.from(hashes[i], 'hex');
    if (
      existingBuf.length === candidateBuf.length &&
      crypto.timingSafeEqual(existingBuf, candidateBuf)
    ) {
      matchedIndex = i;
    }
  }

  if (matchedIndex === -1) {
    return {
      matched: false,
      nextStoredHashesJson: JSON.stringify(hashes),
      remainingCount: hashes.length,
    };
  }

  const nextHashes = hashes.filter((_, idx) => idx !== matchedIndex);
  return {
    matched: true,
    nextStoredHashesJson: JSON.stringify(nextHashes),
    remainingCount: nextHashes.length,
  };
}

