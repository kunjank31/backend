class ApiError extends Error {
  constructor(statueCode, message, errors = [], stack = "") {
    super(message);
    this.message = message;
    this.statueCode = statueCode;
    this.errors = errors;
    this.data = null;
    this.success = false;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
