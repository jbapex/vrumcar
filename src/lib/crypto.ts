import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_HEX_LENGTH = 64;

/**
 * Lê e valida `process.env.ENCRYPTION_KEY` (32 bytes em hex = 64 caracteres).
 * Nunca inclui o valor da chave em erros ou logs.
 *
 * @internal
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY is missing or invalid. Set a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32',
    );
  }
  if (raw.length !== KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error(
      'ENCRYPTION_KEY is missing or invalid. Set a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32',
    );
  }
  return Buffer.from(raw, 'hex');
}

/**
 * Cifra texto UTF-8 com **AES-256-GCM** (autenticado). O IV é aleatório por
 * chamada, pelo que o mesmo texto produz ciphertexts distintos.
 *
 * Formato do resultado: Base64 de `IV (12 bytes) || auth tag (16 bytes) || ciphertext`.
 * Adequado para guardar credenciais (tokens, chaves de API, certificados) em repouso.
 *
 * **Segurança:** a chave vem só de `ENCRYPTION_KEY` no ambiente; rodeção e gestão
 * de segredos são responsabilidade da infra (nunca commitar `.env`).
 */
export function encrypt(plain: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plain, 'utf8')),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, ciphertext]);
  return combined.toString('base64');
}

/**
 * Reverte {@link encrypt}. Falha se o payload estiver truncado, adulterado ou
 * a chave estiver incorreta (integridade/autenticidade garantidas pelo GCM).
 */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(encoded, 'base64');
  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted payload: truncated or malformed');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}
