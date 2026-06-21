import { token, COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const pass = process.env.DASHBOARD_PASSWORD
  if (!pass) return Response.json({ ok: true })

  const body = await req.json().catch(() => ({}))
  if (body?.password !== pass) {
    return Response.json({ error: 'wrong' }, { status: 401 })
  }

  const res = Response.json({ ok: true })
  res.headers.append(
    'Set-Cookie',
    `${COOKIE}=${await token(pass)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`
  )
  return res
}
