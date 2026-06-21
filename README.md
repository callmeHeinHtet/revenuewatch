# Revenue Watch

One dashboard showing live revenue for **Aung Naing Thu Hotel** and **RestroFlow**
side by side, plus a combined total. Read-only — it never writes to either database.

- **Hotel** revenue = `Payment` rows with `status='COMPLETED'` (sum `amount`).
- **RestroFlow** revenue = `orders` with `status='PAID'` (sum `total`).
- Buckets: today / this week / this month / all time, in **Asia/Yangon** time.
- Auto-refreshes every 30s.

Both definitions match each app's own daily report, so the numbers agree with what
you already see inside each system.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # http://localhost:3000
```

Env vars (see `.env.example`):
- `ANT_DATABASE_URL` — hotel production Neon DB
- `RESTROFLOW_DATABASE_URL` — **production** RestroFlow Neon branch (`ep-lively-unit`),
  not the dev branch
- `DASHBOARD_PASSWORD` — HTTP Basic Auth password (any username). Unset = open site.

## Deploy (Vercel)

```bash
vercel
```
Set the same three env vars in the Vercel project (Production scope), then redeploy.

## Caveat

A restaurant order charged to a hotel room appears in **both** totals — once as a
RestroFlow paid order, and again when the guest settles the hotel folio. The combined
figure is therefore gross across both systems, not de-duplicated. Room-charge volume
is small, so for at-a-glance watching this is fine.
