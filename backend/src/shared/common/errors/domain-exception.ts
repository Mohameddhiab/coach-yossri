export class DomainException extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainException";
  }
}

export function fail(status: number, code: string, message: string): never {
  throw new DomainException(status, code, message);
}