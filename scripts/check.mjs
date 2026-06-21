// Smallest runnable check for the two non-trivial bits: the Asia/Yangon day
// boundary used by every bucket, and the money sums. Fails loudly if either breaks.
// Run: node scripts/check.mjs   (needs .env.local)
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const env = {}
for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)="?(.*?)"?$/); if (m) env[m[1]] = m[2]
}

const TZ = 'Asia/Yangon'
const bound = (u) => `(date_trunc('${u}', (now() AT TIME ZONE '${TZ}')) AT TIME ZONE '${TZ}')`
const near = (a, b) => Math.abs(a - b) < 0.01

// 1) Day boundary: SQL's Yangon midnight must equal an independently computed one.
//    Yangon is a fixed UTC+6:30 (no DST), so we can derive it directly.
function expectedYangonMidnightMs() {
  const OFF = 390 * 60_000 // +6:30 in ms
  const shifted = new Date(Date.now() + OFF) // UTC fields now read as Yangon wall clock
  const midUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  return midUtc - OFF
}

async function checkDb(label, url, table, amountCol, statusCol, statusVal, methodCol) {
  const sql = neon(url)

  // boundary
  const [{ d }] = await sql(`SELECT ${bound('day')} AS d`)
  const got = new Date(d).getTime()
  const want = expectedYangonMidnightMs()
  assert.equal(got, want, `${label}: SQL day boundary ${new Date(got).toISOString()} != expected ${new Date(want).toISOString()}`)

  // sums: per-method total today must equal the single today total
  const [{ total }] = await sql(
    `SELECT COALESCE(SUM("${amountCol}"),0)::float AS total
     FROM "${table}" WHERE "${statusCol}"='${statusVal}' AND "createdAt" >= ${bound('day')}`)
  const methods = await sql(
    `SELECT COALESCE(SUM("${amountCol}"),0)::float AS amount
     FROM "${table}" WHERE "${statusCol}"='${statusVal}' AND "createdAt" >= ${bound('day')}
     GROUP BY "${methodCol}"`)
  const sumByMethod = methods.reduce((s, r) => s + r.amount, 0)
  assert.ok(near(total, sumByMethod), `${label}: byMethod sum ${sumByMethod} != today total ${total}`)

  // monotonic buckets: today <= week <= month <= all
  const [b] = await sql(`SELECT
    COALESCE(SUM("${amountCol}") FILTER (WHERE "createdAt" >= ${bound('day')}),0)::float   AS today,
    COALESCE(SUM("${amountCol}") FILTER (WHERE "createdAt" >= ${bound('week')}),0)::float  AS week,
    COALESCE(SUM("${amountCol}") FILTER (WHERE "createdAt" >= ${bound('month')}),0)::float AS month,
    COALESCE(SUM("${amountCol}"),0)::float AS all
    FROM "${table}" WHERE "${statusCol}"='${statusVal}'`)
  assert.ok(b.today <= b.week + 0.01 && b.week <= b.month + 0.01 && b.month <= b.all + 0.01,
    `${label}: buckets not monotonic ${JSON.stringify(b)}`)

  console.log(`  ok  ${label}: boundary, sums, buckets (today=${b.today} all=${b.all})`)
}

await checkDb('hotel', env.ANT_DATABASE_URL, 'Payment', 'amount', 'status', 'COMPLETED', 'method')
await checkDb('restro', env.RESTROFLOW_DATABASE_URL, 'orders', 'total', 'status', 'PAID', 'paymentMethod')
console.log('All checks passed.')
