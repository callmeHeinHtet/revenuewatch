import { getHotel, getRestro } from '@/lib/db'

export const dynamic = 'force-dynamic' // never cache — always live

export async function GET() {
  const restroUrl = process.env.RESTROFLOW_DATABASE_URL
  const hotelUrl = process.env.ANT_DATABASE_URL
  if (!restroUrl || !hotelUrl) {
    return Response.json(
      { error: 'Missing RESTROFLOW_DATABASE_URL or ANT_DATABASE_URL' },
      { status: 500 }
    )
  }
  try {
    const [restro, hotel] = await Promise.all([getRestro(restroUrl), getHotel(hotelUrl)])
    return Response.json({ restro, hotel, updatedAt: new Date().toISOString() })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 })
  }
}
