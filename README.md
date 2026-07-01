# Spotflow Integrations

Backend service that automates wallet funding (Pay-In) and prize withdrawals (Payout)
for a gaming/tournament app by integrating the Spotflow API.

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

## Spotflow API

Built against the official Spotflow documentation: https://docs.spotflow.one

Endpoints used:
- Create virtual account (Pay-In) — `POST /virtual-accounts/temporary`
- Single disbursement (Payout) — `POST /transfers`
- Transaction status (reconciliation) — `GET /payments/verify`, `GET /transfers/reference/{reference}`

All Spotflow API logic is isolated in `src/spotflow/`, separate from the business logic.

## Postman

Import `postman/spotflow-integrations.postman_collection.json` to test the endpoints
(health, fund, withdraw).
