// Removes everything seed-demo.mjs inserted (all id LIKE 'demo_%' / notes='__DEMO__')
// and resets RestroFlow's order number sequence back to 1.
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const env = {}
for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)="?(.*?)"?$/); if (m) env[m[1]] = m[2]
}
const restro = neon(env.RESTROFLOW_DATABASE_URL)
const hotel = neon(env.ANT_DATABASE_URL)

// Hotel first — delete in FK order: payments + charges, then bookings, then guests
await hotel(`DELETE FROM "Payment"    WHERE id LIKE 'demo_%' OR "bookingId" IN (SELECT id FROM "Booking" WHERE id LIKE 'demo_%')`)
await hotel(`DELETE FROM "RoomCharge" WHERE id LIKE 'demo_%' OR "bookingId" IN (SELECT id FROM "Booking" WHERE id LIKE 'demo_%')`)
await hotel(`DELETE FROM "Booking"    WHERE id LIKE 'demo_%'`)
await hotel(`DELETE FROM "Guest"      WHERE id LIKE 'demo_%' OR notes='__DEMO__'`)
console.log('  Hotel: demo guests / bookings / payments / charges removed')

// RestroFlow — order_items cascade-delete with their order
await restro(`DELETE FROM orders WHERE id LIKE 'demo_%' OR notes='__DEMO__'`)
const cnt = (await restro(`SELECT COUNT(*)::int n FROM orders`))[0].n
if (cnt === 0) {
  // resolve the real (case-sensitive, schema-qualified) sequence name, then reset
  const seq = (await restro(`SELECT pg_get_serial_sequence('orders','orderNum') AS s`))[0].s
  if (seq) {
    await restro(`ALTER SEQUENCE ${seq} RESTART WITH 1`)
    console.log('  RestroFlow: demo orders removed, orderNum sequence reset to 1')
  }
} else {
  console.log('  RestroFlow: demo orders removed (real orders exist, sequence left as-is)')
}

console.log('Clean. Both DBs back to their pre-demo state.')
