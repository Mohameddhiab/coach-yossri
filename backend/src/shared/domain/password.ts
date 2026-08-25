export const PASSWORD_HASHER = Symbol("PasswordHasher");

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export const PASSWORD_GENERATOR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_GENERATOR_ALPHABET.charAt(
      Math.floor(Math.random() * PASSWORD_GENERATOR_ALPHABET.length),
    );
  }
  return out;
}