import { NextRequest, NextResponse } from 'next/server'

// Native HTTP Basic Auth gate. Set DASHBOARD_PASSWORD in env to lock the site.
// ponytail: if the var is unset the site is OPEN — fine for local dev, but the
// env var MUST be set in production (it is, per README).
export function middleware(req: NextRequest) {
  const pass = process.env.DASHBOARD_PASSWORD
  if (!pass) return NextResponse.next()

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    const [, pw] = atob(auth.slice(6)).split(':')
    if (pw === pass) return NextResponse.next()
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="RevenueWatch"' },
  })
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
