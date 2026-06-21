'use client'

import { useState } from 'react'

export default function Login() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(false)
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (r.ok) window.location.href = '/'
    else { setErr(true); setBusy(false) }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">RW</div>
        <h1 className="login-title">Revenue Watch</h1>
        <p className="login-sub">စကားဝှက် ထည့်ပါ · Enter password</p>
        <input
          className={`login-input${err ? ' bad' : ''}`}
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false) }}
          placeholder="••••••••"
          autoFocus
          aria-label="Password"
        />
        {err && <div className="login-err">မှားနေတယ် · Wrong password</div>}
        <button className="login-btn" type="submit" disabled={busy || !pw}>
          {busy ? '…' : 'ဝင်မယ် · Sign in'}
        </button>
      </form>
    </div>
  )
}
