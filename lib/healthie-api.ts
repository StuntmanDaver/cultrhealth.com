type HealthieResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

const HEALTHIE_API_URL =
  process.env.HEALTHIE_API_URL || 'https://staging-api.gethealthie.com/graphql'

const HEALTHIE_API_KEY = process.env.HEALTHIE_API_KEY

async function healthieRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!HEALTHIE_API_KEY) {
    throw new Error('HEALTHIE_API_KEY is not configured')
  }

  const response = await fetch(HEALTHIE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Basic ${HEALTHIE_API_KEY}`,
      AuthorizationSource: 'API',
    },
    body: JSON.stringify({ query, variables }),
  })

  const result = (await response.json()) as HealthieResponse<T>

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(', '))
  }

  if (!result.data) {
    throw new Error('Healthie API returned no data')
  }

  return result.data
}

export async function getPatientById(patientId: string): Promise<{ id: string } | null> {
  const query = `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        is_patient
      }
    }
  `

  const data = await healthieRequest<{ user: { id: string; is_patient: boolean | null } | null }>(
    query,
    { id: patientId }
  )

  if (!data.user || data.user.is_patient === false) {
    return null
  }

  return { id: data.user.id }
}

export async function createCarePlan(input: {
  name: string
  patientId?: string
  isTemplate?: boolean
  isHidden?: boolean
}): Promise<{ id: string; name: string }> {
  const mutation = `
    mutation CreateCarePlan($input: createCarePlanInput!) {
      createCarePlan(input: $input) {
        carePlan {
          id
          name
          is_template
        }
        messages {
          field
          message
        }
      }
    }
  `

  if (!input.patientId && !input.isTemplate) {
    throw new Error('patientId is required when creating a care plan for a patient')
  }

  const variables = {
    input: {
      name: input.name,
      patient_id: input.patientId,
      is_hidden: input.isHidden ?? false,
      is_managing_templates: input.isTemplate ?? false,
    },
  }

  const data = await healthieRequest<{
    createCarePlan: { carePlan: { id: string; name: string } | null }
  }>(mutation, variables)

  if (!data.createCarePlan?.carePlan) {
    throw new Error('Failed to create care plan')
  }

  return data.createCarePlan.carePlan
}

export async function createDocument(input: {
  title: string
  content: string
  patientId: string
  carePlanId?: string
  description?: string
}): Promise<{ id: string; displayName: string }> {
  const mutation = `
    mutation CreateDocument($input: createDocumentInput!) {
      createDocument(input: $input) {
        document {
          id
          display_name
        }
        messages {
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      display_name: input.title,
      description: input.description ?? '',
      file_string: Buffer.from(input.content, 'utf-8').toString('base64'),
      rel_user_id: input.patientId,
      share_with_rel: true,
      care_plan_id: input.carePlanId,
    },
  }

  const data = await healthieRequest<{
    createDocument: { document: { id: string; display_name: string } | null }
  }>(mutation, variables)

  if (!data.createDocument?.document) {
    throw new Error('Failed to create document')
  }

  return {
    id: data.createDocument.document.id,
    displayName: data.createDocument.document.display_name,
  }
}

export async function enrollInProgram(input: {
  courseMembershipId: string
  startAt?: string
}): Promise<{ id: string }> {
  const mutation = `
    mutation UpdateCourseMembership($input: updateCourseMembershipInput!) {
      updateCourseMembership(input: $input) {
        courseMembership {
          id
        }
        messages {
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      id: input.courseMembershipId,
      start_at: input.startAt,
    },
  }

  const data = await healthieRequest<{
    updateCourseMembership: { courseMembership: { id: string } | null }
  }>(mutation, variables)

  if (!data.updateCourseMembership?.courseMembership) {
    throw new Error('Failed to update program enrollment')
  }

  return { id: data.updateCourseMembership.courseMembership.id }
}
