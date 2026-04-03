// Feature flags for vendor migration
// Toggle between Asher Med (legacy) and Healthie (new) clinical paths

export const USE_HEALTHIE = process.env.USE_HEALTHIE === 'true'
