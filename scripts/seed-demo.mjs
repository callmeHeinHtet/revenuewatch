// Seeds clearly-marked DEMO data into BOTH production DBs so the dashboard lights up.
// Everything is tagged so clean-demo.mjs can remove exactly this and nothing else.
// Run:  node scripts/seed-demo.mjs        Clean: node scripts/clean-demo.mjs
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

const env = {}
for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)="?(.*?)"?$/); if (m) env[m[1]] = m[2]
}
const id = () => 'demo_' + randomUUID().replace(/-/g, '')
const now = new Date()
const iso = (d) => d.toISOString()
const hoursAgo = (h) => iso(new Date(now.getTime() - h * 3600_000))
const pick = (a) => a[Math.floor(Math.random() * a.length)]

const restro = neon(env.RESTROFLOW_DATABASE_URL)
const hotel = neon(env.ANT_DATABASE_URL)

// ---------------- RestroFlow ----------------
async function seedRestro() {
  const menu = await restro(`SELECT id, price::float AS price FROM menu_items WHERE available=true LIMIT 40`)
  const tables = await restro(`SELECT id, number FROM tables`)
  const rooms = await restro(`SELECT id, number FROM rooms`)
  if (!menu.length || !tables.length) { console.log('  ! RestroFlow has no menu/tables — skipping'); return }

  const orders = [
    { method: 'CASH', ktv: false }, { method: 'KBZPAY', ktv: false }, { method: 'CASH', ktv: false },
    { method: 'WAVEPAY', ktv: false }, { method: 'KBZPAY', ktv: true }, { method: 'CBPAY', ktv: false },
    { method: 'ROOM_CHARGE', ktv: false, unsettled: true }, { method: 'ROOM_CHARGE', ktv: true, unsettled: true },
  ]
  let n = 0
  for (const o of orders) {
    const lines = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
      const mi = pick(menu); return { ...mi, qty: 1 + Math.floor(Math.random() * 3) }
    })
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const total = Math.round(subtotal * 1.05) // +5% tax-ish
    const oid = id()
    const created = hoursAgo(Math.floor(Math.random() * 8))
    await restro(
      `INSERT INTO orders (id,"tableId","roomId",status,subtotal,tax,total,"isKtv","paymentMethod","roomChargeSettled","hotelRoomNumber","guestName","paidAt","createdAt","updatedAt","notes")
       VALUES ($1,$2,$3,'PAID',$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$12,'__DEMO__')`,
      [oid, o.ktv ? null : pick(tables).id, o.ktv ? pick(rooms).id : null,
       subtotal, total - subtotal, total, o.ktv, o.method, o.unsettled ? false : true,
       o.method === 'ROOM_CHARGE' ? pick([101, 203, 305]) : null,
       o.method === 'ROOM_CHARGE' ? 'DEMO Guest' : null, created]
    )
    for (const l of lines) {
      await restro(
        `INSERT INTO order_items (id,"orderId","menuItemId",quantity,price,status,"createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,'SERVED',$6,$6)`,
        [id(), oid, l.id, l.qty, l.price, created]
      )
    }
    n++
  }
  console.log(`  + RestroFlow: ${n} demo orders (2 unsettled room charges)`)
}

// ---------------- Hotel ----------------
async function seedHotel() {
  const rooms = await hotel(`SELECT id, number, price FROM "Room" LIMIT 12`)
  if (!rooms.length) { console.log('  ! Hotel has no rooms — skipping'); return }

  const guests = [
    ['Aung', 'Kyaw'], ['Su', 'Hlaing'], ['Min', 'Thant'], ['Nilar', 'Win'], ['Zaw', 'Moe'], ['Ei', 'Phyu'],
  ]
  const gids = []
  for (const [f, l] of guests) {
    const g = id()
    await hotel(
      `INSERT INTO "Guest" (id,"firstName","lastName",phone,nationality,notes,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,'Myanmar','__DEMO__',$5,$5)`,
      [g, f, l, '09' + Math.floor(100000000 + Math.random() * 800000000), iso(now)]
    )
    gids.push(g)
  }

  // status mix: 3 checked-in (occupancy), 2 confirmed, 1 checked-out today
  const plan = [
    { status: 'CHECKED_IN', room: 0, pay: 'KBZ_PAY' },
    { status: 'CHECKED_IN', room: 1, pay: 'CASH' },
    { status: 'CHECKED_IN', room: 2, pay: 'WAVE_MONEY' },
    { status: 'CONFIRMED', room: null, pay: 'BANK_TRANSFER' },
    { status: 'CONFIRMED', room: null, pay: null },
    { status: 'CHECKED_OUT', room: 3, pay: 'CASH', out: true },
  ]
  let nb = 0, np = 0, nc = 0
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i]
    const room = p.room != null ? rooms[p.room] : null
    const nights = 1 + Math.floor(Math.random() * 3)
    const amount = (room ? room.price : 60000) * nights
    const bid = id()
    await hotel(
      `INSERT INTO "Booking" (id,reference,"guestId","roomId","roomType","checkInDate","checkOutDate","actualCheckIn","actualCheckOut",adults,status,source,"totalAmount",discounts,"taxAmount","finalAmount","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,'DOUBLE',$5,$6,$7,$8,2,$9,'WALK_IN',$10,0,0,$10,$11,$11)`,
      [bid, 'DEMO-' + (1000 + i), gids[i], room?.id ?? null,
       hoursAgo(24 * nights), hoursAgo(p.out ? 2 : -24 * nights),
       p.status === 'CONFIRMED' ? null : hoursAgo(p.out ? 24 : 6),
       p.out ? hoursAgo(2) : null, p.status, amount, iso(now)]
    )
    nb++
    if (p.pay) {
      await hotel(
        `INSERT INTO "Payment" (id,"bookingId",amount,currency,method,status,"paidAt","createdAt","updatedAt")
         VALUES ($1,$2,$3,'MMK',$4,'COMPLETED',$5,$5,$5)`,
        [id(), bid, amount, p.pay, hoursAgo(Math.floor(Math.random() * 6))]
      )
      np++
    }
    // folio charges for in-house guests (outstanding)
    if (p.status === 'CHECKED_IN') {
      for (const [desc, amt, cat] of [['Restaurant (room charge)', 18000, 'FOOD'], ['Minibar', 6000, 'MINIBAR']]) {
        await hotel(
          `INSERT INTO "RoomCharge" (id,"bookingId",description,amount,category,date,source,"createdAt","updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,'MANUAL',$6,$6)`,
          [id(), bid, desc, amt, cat, hoursAgo(3)]
        )
        nc++
      }
    }
  }
  console.log(`  + Hotel: ${nb} bookings, ${np} payments, ${nc} folio charges`)
}

console.log('Seeding DEMO data into PRODUCTION DBs...')
await seedRestro()
await seedHotel()
console.log('Done. Refresh the dashboard. Remove with: node scripts/clean-demo.mjs')
