export class UserError extends Error {
  constructor(message, { exitCode = 1, cause } = {}) {
    super(message, { cause });
    this.name = "UserError";
    this.exitCode = exitCode;
  }
}
