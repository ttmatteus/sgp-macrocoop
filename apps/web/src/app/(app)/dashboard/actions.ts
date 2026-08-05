'use server'

import { cookies } from 'next/headers'

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
