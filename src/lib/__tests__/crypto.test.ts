import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { decrypt, encrypt } from '../crypto';

/** 64 caracteres hex = 32 bytes (AES-256) */
const VALID_HEX_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('crypto (AES-256-GCM)', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', VALID_HEX_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('encrypt produz output diferente pra mesmo input', () => {
    const plain = 'same input';
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(plain);
    expect(decrypt(b)).toBe(plain);
  });

  it('decrypt(encrypt(x)) === x para strings simples', () => {
    const plain = 'hello world';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('decrypt(encrypt(x)) === x para string vazia', () => {
    const plain = '';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('decrypt(encrypt(x)) === x para string longa (1000+ chars)', () => {
    const plain = 'x'.repeat(1001);
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('decrypt(encrypt(x)) === x para string com caracteres especiais', () => {
    const plain = JSON.stringify({
      acento: 'São Paulo',
      emoji: '🚗',
      unicode: '日本語',
    });
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('decrypt com payload corrompido lança erro', () => {
    const enc = encrypt('secret');
    const raw = Buffer.from(enc, 'base64');
    raw[20] ^= 0xff;
    const corrupted = raw.toString('base64');
    expect(() => decrypt(corrupted)).toThrow();
  });

  it('decrypt com payload truncado lança erro', () => {
    const enc = encrypt('data');
    const truncated = Buffer.from(enc, 'base64').subarray(0, 10).toString('base64');
    expect(() => decrypt(truncated)).toThrow();
  });

  it('encrypt sem ENCRYPTION_KEY no env lança erro útil', () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY is missing or invalid/i);
    expect(() => encrypt('x')).toThrow(
      /openssl rand -hex 32/i,
    );
  });

  it('encrypt com ENCRYPTION_KEY de tamanho errado lança erro útil', () => {
    vi.stubEnv('ENCRYPTION_KEY', 'deadbeef');
    expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY is missing or invalid/i);
  });
});
