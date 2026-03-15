// SiPhox Health API Error Class
// Follows AsherMedApiError pattern from lib/asher-med-api.ts

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
