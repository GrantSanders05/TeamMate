export const JOIN_CODE_LENGTH = 6
export const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function createJoinCodeCandidate(length = JOIN_CODE_LENGTH) {
  let code = ""

  for (let index = 0; index < length; index += 1) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)]
  }

  return code
}

export async function generateUniqueJoinCode(
  supabase: any,
  excludeOrganizationId?: string
) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = createJoinCodeCandidate()

    let query = supabase.from("organizations").select("id").eq("join_code", candidate)

    if (excludeOrganizationId) {
      query = query.neq("id", excludeOrganizationId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message)
    }

    if (!data) {
      return candidate
    }
  }

  throw new Error("Could not generate a unique join code. Please try again.")
}
