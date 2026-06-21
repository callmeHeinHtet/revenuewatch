'use client'

import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n || 0))
const time = (s: string) =>
  new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

type Lang = 'my' | 'en'

// Casual Myanmar + English. Numbers stay Arabic numerals; "Ks" stays.
const STR = {
  en: {
    sub: 'Aung Naing Thu · RestroFlow',
    connecting: 'Connecting…',
    updated: (t: string) => `Updated ${t}`,
    combinedToday: 'Combined revenue · today',
    allTime: 'All-time combined',
    allocation: 'Allocation · today',
    legHotel: 'Hotel', legRestro: 'RestroFlow',
    hotelName: 'Aung Naing Thu Hotel', restroName: 'RestroFlow',
    t_today: 'Today', t_week: 'Week', t_month: 'Month', t_all: 'All time',
    occupied: (r: number) => `Occupied · ${r}%`,
    checkins: 'Check-ins today', checkouts: 'Check-outs today',
    inHouse: 'In-house', arriving: 'Arriving', pending: 'Pending',
    payByMethod: 'Payments today by method',
    folio: 'Outstanding folio charges',
    folioCount: (n: number) => `across ${n} in-house charge${n === 1 ? '' : 's'}`,
    recentPayments: 'Recent payments',
    noPayT: 'No completed payments yet', noPayB: 'Each settled booking payment will appear here, newest first.',
    paidOrders: 'Paid orders today', avgOrder: 'Avg order',
    dineInWk: 'Dine-in · this week (Ks)', ktvWk: 'KTV · this week (Ks)',
    salesByMethod: 'Sales today by payment method',
    unsettled: 'Unsettled room charges · owed by hotel',
    unsettledCount: (n: number) => `across ${n} order${n === 1 ? '' : 's'}`,
    topItems: 'Top items · this week',
    noItemsT: 'No items sold this week', noItemsB: 'Best-selling dishes rank here once orders come in.',
    recentOrders: 'Recent orders',
    noOrdersT: 'No orders yet', noOrdersB: 'Live orders stream in here as the POS records them.',
    table: (n: number) => `Table ${n}`, ktv: (n: string) => `KTV ${n}`.trim(),
    err: (e: string) => `Couldn’t reach a database — ${e}`,
    noPayMethod: 'No payments today', noPayMethodB: 'Payments break down by method here as they land.',
  },
  my: {
    sub: 'အောင်နိုင်သူ · RestroFlow',
    connecting: 'ချိတ်ဆက်နေတယ်…',
    updated: (t: string) => `${t} မှာ အပ်ဒိတ်`,
    combinedToday: 'စုစုပေါင်း ဝင်ငွေ · ဒီနေ့',
    allTime: 'စုစုပေါင်း (အကုန်လုံး)',
    allocation: 'ခွဲဝေမှု · ဒီနေ့',
    legHotel: 'ဟိုတယ်', legRestro: 'စားသောက်ဆိုင်',
    hotelName: 'အောင်နိုင်သူ ဟိုတယ်', restroName: 'RestroFlow',
    t_today: 'ဒီနေ့', t_week: 'ဒီအပတ်', t_month: 'ဒီလ', t_all: 'အကုန်လုံး',
    occupied: (r: number) => `အခန်းပြည့် · ${r}%`,
    checkins: 'ဒီနေ့ ဝင်သူ', checkouts: 'ဒီနေ့ ထွက်သူ',
    inHouse: 'တည်းနေဆဲ', arriving: 'လာတော့မယ့်', pending: 'ဆိုင်းငံ့',
    payByMethod: 'ဒီနေ့ ပေးချေမှု (နည်းလမ်းအလိုက်)',
    folio: 'ပေးစရာ ကျန်နေတဲ့ ဘေလ်',
    folioCount: (n: number) => `တည်းနေသူ ဘေလ် ${n} ခု`,
    recentPayments: 'နောက်ဆုံး ပေးချေမှုတွေ',
    noPayT: 'ပေးချေမှု မရှိသေးဘူး', noPayB: 'ဘွတ်ကင် ပေးချေတိုင်း ဒီမှာ ပေါ်လာပါမယ်။',
    paidOrders: 'ဒီနေ့ အော်ဒါ (ရှင်းပြီး)', avgOrder: 'ပျမ်းမျှ အော်ဒါ',
    dineInWk: 'ဆိုင်တွင်းစား · ဒီအပတ် (Ks)', ktvWk: 'KTV · ဒီအပတ် (Ks)',
    salesByMethod: 'ဒီနေ့ ရောင်းအား (နည်းလမ်းအလိုက်)',
    unsettled: 'မရှင်းရသေးတဲ့ အခန်းဘေလ် · ဟိုတယ်က ပေးရန်',
    unsettledCount: (n: number) => `အော်ဒါ ${n} ခု`,
    topItems: 'ရောင်းအကောင်းဆုံး · ဒီအပတ်',
    noItemsT: 'ဒီအပတ် ဘာမှ မရောင်းရသေးဘူး', noItemsB: 'အော်ဒါဝင်ရင် ရောင်းအကောင်းဆုံးတွေ ဒီမှာ ပေါ်ပါမယ်။',
    recentOrders: 'နောက်ဆုံး အော်ဒါတွေ',
    noOrdersT: 'အော်ဒါ မရှိသေးဘူး', noOrdersB: 'POS မှာ မှတ်တိုင်း ဒီမှာ တန်းပေါ်ပါမယ်။',
    table: (n: number) => `စားပွဲ ${n}`, ktv: (n: string) => `KTV ${n}`.trim(),
    err: (e: string) => `ဒေတာဘေ့စ် ကို မချိတ်နိုင်ဘူး — ${e}`,
    noPayMethod: 'ဒီနေ့ ပေးချေမှု မရှိဘူး', noPayMethodB: 'ပေးချေတိုင်း နည်းလမ်းအလိုက် ဒီမှာ ပေါ်ပါမယ်။',
  },
} as const

type Money = { today: number; week: number; month: number; all: number }
type Row = Record<string, any>
type Data = {
  updatedAt: string
  restro: {
    revenue: Money; todayCount: number; avgOrder: number
    byMethod: Row[]; topItems: Row[]; byCategory: Row[]
    channel: Row; roomCharges: Row; recent: Row[]
  }
  hotel: {
    revenue: Money; todayCount: number
    occupancy: { occupied: number; total: number; rate: number }
    pipeline: Row; byMethod: Row[]; outstanding: Row; recent: Row[]
  }
}

function StatStrip({ rev, accent, s }: { rev: Money; accent: string; s: typeof STR[Lang] }) {
  const cells: [string, number][] = [
    [s.t_today, rev.today], [s.t_week, rev.week], [s.t_month, rev.month], [s.t_all, rev.all],
  ]
  return (
    <div className="stat-strip">
      {cells.map(([k, v], i) => (
        <div className={`stat${i === 0 ? ' lead' : ''}`} key={k} style={i === 0 ? ({ ['--accent' as any]: accent }) : undefined}>
          <div className="k">{k}</div>
          <div className="v num">{fmt(v)} <small>Ks</small></div>
        </div>
      ))}
    </div>
  )
}

function Bars({ rows, color, s }: { rows: Row[]; color: string; s: typeof STR[Lang] }) {
  const max = Math.max(1, ...rows.map((r) => r.amount))
  if (!rows.length)
    return <div className="empty"><b>{s.noPayMethod}</b>{s.noPayMethodB}</div>
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar" key={r.method}>
          <span className="nm">{r.method}</span>
          <span className="track"><span className="fill" style={{ width: `${(r.amount / max) * 100}%`, background: color }} /></span>
          <span className="amt num">{fmt(r.amount)} <em>· {r.count}</em></span>
        </div>
      ))}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="block"><div className="title">{title}</div>{children}</div>
}

function Skeleton() {
  return (
    <>
      <div className="combined">
        <div className="sk" style={{ height: 14, width: 160 }} />
        <div className="sk" style={{ height: 56, width: 340, marginTop: 14 }} />
        <div className="sk" style={{ height: 8, width: '100%', marginTop: 24, borderRadius: 6 }} />
      </div>
      <div className="panels">
        {[0, 1].map((i) => (
          <div className="panel" key={i} style={{ padding: 24 }}>
            <div className="sk" style={{ height: 18, width: 180 }} />
            <div className="sk" style={{ height: 64, width: '100%', marginTop: 18 }} />
            <div className="sk" style={{ height: 120, width: '100%', marginTop: 14 }} />
          </div>
        ))}
      </div>
    </>
  )
}

export default function Page() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [lang, setLang] = useState<Lang>('my')

  useEffect(() => {
    const saved = localStorage.getItem('rw-lang') as Lang | null
    if (saved === 'en' || saved === 'my') setLang(saved)
  }, [])
  const setL = (l: Lang) => { setLang(l); localStorage.setItem('rw-lang', l) }

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/revenue', { cache: 'no-store' })
        const j = await res.json()
        if (!alive) return
        if (j.error) setErr(j.error)
        else { setData(j); setErr(null) }
      } catch (e) { if (alive) setErr(String(e)) }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const s = STR[lang]
  const h = data?.hotel, r = data?.restro
  const cToday = data ? r!.revenue.today + h!.revenue.today : 0
  const cAll = data ? r!.revenue.all + h!.revenue.all : 0
  const hPct = cToday ? (h!.revenue.today / cToday) * 100 : 0
  const rPct = cToday ? (r!.revenue.today / cToday) * 100 : 0

  return (
    <div className="wrap" lang={lang === 'my' ? 'my' : 'en'}>
      <div className="top">
        <div className="brand">
          <h1>Revenue Watch</h1>
          <span className="sub">{s.sub}</span>
        </div>
        <div className="topright">
          <div className="langtog" role="group" aria-label="Language">
            <button className={lang === 'my' ? 'on' : ''} onClick={() => setL('my')}>မြန်မာ</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setL('en')}>EN</button>
          </div>
          <span className="live">
            <span className="pulse" />
            {data ? s.updated(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : s.connecting}
          </span>
        </div>
      </div>

      {err && <div className="err">{s.err(err)}</div>}

      {!data && !err && <Skeleton />}

      {data && h && r && (
        <>
          <div className="combined fade">
            <div className="head">
              <div>
                <div className="cap">{s.combinedToday}</div>
                <div className="hero num">{fmt(cToday)} <small>Ks</small></div>
              </div>
              <div className="alltime">
                <div className="cap">{s.allTime}</div>
                <div className="v num">{fmt(cAll)} <small>Ks</small></div>
              </div>
            </div>
            <div className="share">
              <div className="cap" style={{ marginBottom: 12 }}>{s.allocation}</div>
              <div className="share-track" aria-hidden>
                <span className="share-seg h" style={{ width: `${hPct}%` }} />
                <span className="share-seg r" style={{ width: `${rPct}%` }} />
              </div>
              <div className="share-legend">
                <span className="lg"><span className="dot" style={{ background: 'var(--hotel)' }} /> <b className="num">{fmt(h.revenue.today)} Ks</b> <span>{s.legHotel} · {Math.round(hPct)}%</span></span>
                <span className="lg"><span className="dot" style={{ background: 'var(--restro)' }} /> <b className="num">{fmt(r.revenue.today)} Ks</b> <span>{s.legRestro} · {Math.round(rPct)}%</span></span>
              </div>
            </div>
          </div>

          <div className="panels">
            {/* ---------------- HOTEL ---------------- */}
            <div className="panel fade" style={{ animationDelay: '0.04s' }}>
              <div className="phead"><span className="dot" style={{ background: 'var(--hotel)' }} /> {s.hotelName}</div>
              <StatStrip rev={h.revenue} accent="var(--hotel)" s={s} />

              <div className="kpi-grid">
                <div className="kpi"><div className="b num">{h.occupancy.occupied}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/{h.occupancy.total}</span></div><div className="l">{s.occupied(h.occupancy.rate)}</div></div>
                <div className="kpi"><div className="b num">{h.pipeline.checkins_today}</div><div className="l">{s.checkins}</div></div>
                <div className="kpi"><div className="b num">{h.pipeline.checkouts_today}</div><div className="l">{s.checkouts}</div></div>
                <div className="kpi"><div className="b num">{h.pipeline.in_house}</div><div className="l">{s.inHouse}</div></div>
                <div className="kpi"><div className="b num">{h.pipeline.confirmed}</div><div className="l">{s.arriving}</div></div>
                <div className="kpi"><div className="b num">{h.pipeline.pending}</div><div className="l">{s.pending}</div></div>
              </div>

              <Block title={s.payByMethod}><Bars rows={h.byMethod} color="var(--hotel)" s={s} /></Block>

              <Block title={s.folio}>
                <div className="owe"><span className="v num">{fmt(h.outstanding.amount)} Ks</span><span className="c">{s.folioCount(h.outstanding.count)}</span></div>
              </Block>

              <Block title={s.recentPayments}>
                {h.recent.length ? (
                  <table className="feed in"><tbody>
                    {h.recent.map((p, i) => (
                      <tr key={i}>
                        <td className="nm">{[p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}</td>
                        <td className="dim hide-sm">{p.ref || '—'}</td>
                        <td className="dim">{p.method}</td>
                        <td className="r num">{fmt(p.amount)} Ks</td>
                        <td className="dim hide-sm">{time(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody></table>
                ) : <div className="empty"><b>{s.noPayT}</b>{s.noPayB}</div>}
              </Block>
            </div>

            {/* ---------------- RESTROFLOW ---------------- */}
            <div className="panel fade" style={{ animationDelay: '0.08s' }}>
              <div className="phead"><span className="dot" style={{ background: 'var(--restro)' }} /> {s.restroName}</div>
              <StatStrip rev={r.revenue} accent="var(--restro)" s={s} />

              <div className="kpi-grid two">
                <div className="kpi"><div className="b num">{r.todayCount}</div><div className="l">{s.paidOrders}</div></div>
                <div className="kpi"><div className="b num">{fmt(r.avgOrder)} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>Ks</span></div><div className="l">{s.avgOrder}</div></div>
                <div className="kpi"><div className="b num">{fmt(r.channel.dinein)}</div><div className="l">{s.dineInWk}</div></div>
                <div className="kpi"><div className="b num">{fmt(r.channel.ktv)}</div><div className="l">{s.ktvWk}</div></div>
              </div>

              <Block title={s.salesByMethod}><Bars rows={r.byMethod} color="var(--restro)" s={s} /></Block>

              <Block title={s.unsettled}>
                <div className="owe"><span className="v num" style={{ color: 'var(--restro)' }}>{fmt(r.roomCharges.amount)} Ks</span><span className="c">{s.unsettledCount(r.roomCharges.count)}</span></div>
              </Block>

              <Block title={s.topItems}>
                {r.topItems.length ? (
                  <table className="feed in"><tbody>
                    {r.topItems.map((it, i) => (
                      <tr key={i}>
                        <td className="nm">{it.name}</td>
                        <td className="dim num">×{it.qty}</td>
                        <td className="r num">{fmt(it.revenue)} Ks</td>
                      </tr>
                    ))}
                  </tbody></table>
                ) : <div className="empty"><b>{s.noItemsT}</b>{s.noItemsB}</div>}
              </Block>

              <Block title={s.recentOrders}>
                {r.recent.length ? (
                  <table className="feed in"><tbody>
                    {r.recent.map((o, i) => (
                      <tr key={i}>
                        <td className="nm num">#{o.orderNum}</td>
                        <td className="dim">{o.isKtv ? s.ktv(o.room_no ?? '') : o.table_no != null ? s.table(o.table_no) : '—'}</td>
                        <td className="dim hide-sm">{o.method || '—'}</td>
                        <td><span className={`pill${o.status === 'PAID' ? ' ok' : ''}`}>{o.status}</span></td>
                        <td className="r num">{fmt(o.total)} Ks</td>
                      </tr>
                    ))}
                  </tbody></table>
                ) : <div className="empty"><b>{s.noOrdersT}</b>{s.noOrdersB}</div>}
              </Block>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
