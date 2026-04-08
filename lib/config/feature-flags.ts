// Feature flags for vendor migration.
// Keep Healthie disabled unless the intake, scheduling, and portal flows
// are all configured end-to-end in the active environment.

export const USE_HEALTHIE =
  process.env.USE_HEALTHIE === 'true' &&
  Boolean(process.env.HEALTHIE_API_KEY)
