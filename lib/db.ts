import { neon } from '@neondatabase/serverless'

const TZ = 'Asia/Yangon' // both businesses operate in Myanmar (UTC+6:30)

// Start of the Myanmar-local day/week/month, as a UTC instant for timestamptz compares.
const bound = (unit: string) =>
  `(date_trunc('${unit}', (now() AT TIME ZONE '${TZ}')) AT TIME ZONE '${TZ}')`
const DAY = bound('day')
const WEEK = bound('week')
const MONTH = bound('month')

export type Money = { today: number; week: number; month: number; all: number }
type Row = Record<string, any>

// ---------- RestroFlow (restaurant POS) ----------
export async function getRestro(url: string) {
  const sql = neon(url)
  const [totals, byMethod, topItems, byCategory, channel, roomCharges, recent] =
    await Promise.all([
      sql(`SELECT
        COALESCE(SUM("total") FILTER (WHERE "createdAt" >= ${DAY}),0)::float   AS today,
        COALESCE(SUM("total") FILTER (WHERE "createdAt" >= ${WEEK}),0)::float  AS week,
        COALESCE(SUM("total") FILTER (WHERE "createdAt" >= ${MONTH}),0)::float AS month,
        COALESCE(SUM("total"),0)::float AS all,
        COUNT(*) FILTER (WHERE "createdAt" >= ${DAY})::int AS today_count
        FROM orders WHERE status='PAID'`),
      sql(`SELECT COALESCE("paymentMethod",'—') AS method, COUNT(*)::int AS count,
        COALESCE(SUM("total"),0)::float AS amount
        FROM orders WHERE status='PAID' AND "createdAt" >= ${DAY}
        GROUP BY 1 ORDER BY amount DESC`),
      sql(`SELECT mi.name, SUM(oi.quantity)::int AS qty,
        COALESCE(SUM(oi.price*oi.quantity),0)::float AS revenue
        FROM order_items oi
        JOIN orders o ON o.id=oi."orderId" AND o.status='PAID' AND o."createdAt" >= ${WEEK}
        JOIN menu_items mi ON mi.id=oi."menuItemId"
        GROUP BY mi.id, mi.name ORDER BY qty DESC LIMIT 8`),
      sql(`SELECT c.name, COALESCE(SUM(oi.price*oi.quantity),0)::float AS revenue
        FROM order_items oi
        JOIN orders o ON o.id=oi."orderId" AND o.status='PAID' AND o."createdAt" >= ${WEEK}
        JOIN menu_items mi ON mi.id=oi."menuItemId"
        JOIN categories c ON c.id=mi."categoryId"
        GROUP BY c.id, c.name ORDER BY revenue DESC LIMIT 8`),
      sql(`SELECT
        COALESCE(SUM("total") FILTER (WHERE "isKtv"=true),0)::float  AS ktv,
        COALESCE(SUM("total") FILTER (WHERE "isKtv"=false),0)::float AS dinein
        FROM orders WHERE status='PAID' AND "createdAt" >= ${WEEK}`),
      sql(`SELECT COUNT(*)::int AS count, COALESCE(SUM("total"),0)::float AS amount
        FROM orders WHERE "paymentMethod"='ROOM_CHARGE' AND "roomChargeSettled"=false`),
      sql(`SELECT o."orderNum", o."total"::float AS total, o."paymentMethod" AS method,
        o."status", o."isKtv", o."createdAt", t."number" AS table_no, r."number" AS room_no
        FROM orders o
        LEFT JOIN tables t ON t.id=o."tableId"
        LEFT JOIN rooms  r ON r.id=o."roomId"
        ORDER BY o."createdAt" DESC LIMIT 12`),
    ])
  const t = totals[0] as Row
  return {
    revenue: { today: t.today, week: t.week, month: t.month, all: t.all } as Money,
    todayCount: t.today_count as number,
    avgOrder: t.today_count ? t.today / t.today_count : 0,
    byMethod: byMethod as Row[],
    topItems: topItems as Row[],
    byCategory: byCategory as Row[],
    channel: channel[0] as Row,
    roomCharges: roomCharges[0] as Row, // unsettled, owed to restaurant
    recent: recent as Row[],
  }
}

// ---------- Aung Naing Thu (hotel) ----------
export async function getHotel(url: string) {
  const sql = neon(url)
  const [totals, occ, pipeline, byMethod, charges, recent] = await Promise.all([
    sql(`SELECT
      COALESCE(SUM("amount") FILTER (WHERE "createdAt" >= ${DAY}),0)::float   AS today,
      COALESCE(SUM("amount") FILTER (WHERE "createdAt" >= ${WEEK}),0)::float  AS week,
      COALESCE(SUM("amount") FILTER (WHERE "createdAt" >= ${MONTH}),0)::float AS month,
      COALESCE(SUM("amount"),0)::float AS all,
      COUNT(*) FILTER (WHERE "createdAt" >= ${DAY})::int AS today_count
      FROM "Payment" WHERE status='COMPLETED'`),
    sql(`SELECT
      (SELECT COUNT(*)::int FROM "Room") AS total,
      (SELECT COUNT(*)::int FROM "Booking" WHERE status='CHECKED_IN' AND "deletedAt" IS NULL) AS occupied`),
    sql(`SELECT
      COUNT(*) FILTER (WHERE status='CHECKED_IN')::int AS in_house,
      COUNT(*) FILTER (WHERE status='CONFIRMED')::int  AS confirmed,
      COUNT(*) FILTER (WHERE status='PENDING')::int    AS pending,
      COUNT(*) FILTER (WHERE "actualCheckIn"  >= ${DAY})::int AS checkins_today,
      COUNT(*) FILTER (WHERE "actualCheckOut" >= ${DAY})::int AS checkouts_today
      FROM "Booking" WHERE "deletedAt" IS NULL`),
    sql(`SELECT "method", COUNT(*)::int AS count, COALESCE(SUM("amount"),0)::float AS amount
      FROM "Payment" WHERE status='COMPLETED' AND "createdAt" >= ${DAY}
      GROUP BY 1 ORDER BY amount DESC`),
    sql(`SELECT COUNT(*)::int AS count, COALESCE(SUM(rc."amount"),0)::float AS amount
      FROM "RoomCharge" rc JOIN "Booking" b ON b.id=rc."bookingId"
      WHERE b.status IN ('CHECKED_IN','CONFIRMED') AND b."deletedAt" IS NULL`),
    sql(`SELECT p."amount"::float AS amount, p."method", p."status", p."createdAt",
      b."reference" AS ref, g."firstName", g."lastName"
      FROM "Payment" p
      LEFT JOIN "Booking" b ON b.id=p."bookingId"
      LEFT JOIN "Guest"   g ON g.id=b."guestId"
      WHERE p.status='COMPLETED'
      ORDER BY p."createdAt" DESC LIMIT 12`),
  ])
  const t = totals[0] as Row
  const o = occ[0] as Row
  return {
    revenue: { today: t.today, week: t.week, month: t.month, all: t.all } as Money,
    todayCount: t.today_count as number,
    occupancy: {
      occupied: o.occupied as number,
      total: o.total as number,
      rate: o.total ? Math.round((o.occupied / o.total) * 100) : 0,
    },
    pipeline: pipeline[0] as Row,
    byMethod: byMethod as Row[],
    outstanding: charges[0] as Row, // unpaid folio charges in-house
    recent: recent as Row[],
  }
}
