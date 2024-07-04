class Response {
  constructor(error, message, data) {
    this.error = error ?? false;
    this.message = message ?? null;
    this.data = data ?? null;
  }
}

module.exports = Response;
