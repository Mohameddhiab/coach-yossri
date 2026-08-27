import { randomBytes } from "node:crypto";

export const PASSWORD_HASHER = Symbol("PasswordHasher");

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export const PASSWORD_GENERATOR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 12): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_GENERATOR_ALPHABET.charAt(bytes[i]! % PASSWORD_GENERATOR_ALPHABET.length);
  }
  return out;
}
