import { generatePassword, PASSWORD_GENERATOR_ALPHABET } from './password';

describe('generatePassword', () => {
  it('génère un mot de passe de 12 caractères', () => {
    expect(generatePassword()).toHaveLength(12);
  });

  it('génère des mots de passe différents', () => {
    const a = generatePassword();
    const b = generatePassword();
    expect(a).not.toBe(b);
  });

  it("n'utilise que des caractères du jeu autorisé", () => {
    const alphabet = PASSWORD_GENERATOR_ALPHABET;
    for (let i = 0; i < 200; i++) {
      for (const c of generatePassword()) {
        expect(alphabet).toContain(c);
      }
    }
  });
});
