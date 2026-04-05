// SiPhox Health API Error Class
// Standard API error class for external service calls

export class SiphoxApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'SiphoxApiError'
  }
}
