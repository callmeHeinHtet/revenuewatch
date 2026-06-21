import { NextRequest, NextResponse } from 'next/server'
import { token, COOKIE } from './lib/auth'

// Cookie-based gate. One password, no username, persists ~30 days — far better
// than Basic Auth, which re-prompts constantly inside an installed PWA.
// If DASHBOARD_PASSWORD is unset the site is open (fine for local dev).
export async function middleware(req: NextRequest) {
  const pass = process.env.DASHBOARD_PASSWORD
  if (!pass) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (pathname === '/login' || pathname === '/api/login') return NextResponse.next()

  const cookie = req.cookies.get(COOKIE)?.value
  if (cookie && cookie === (await token(pass))) return NextResponse.next()

  // API → 401 JSON; pages → send to the login screen
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

// Leave PWA assets public so the app can install/cache before login.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192|icon-512|apple-touch-icon|manifest.webmanifest|sw.js).*)'],
}
