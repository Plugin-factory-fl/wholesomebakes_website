# Wholesome Bakes Checkout API

Tiny Express service that creates Stripe Checkout sessions for the static GitHub Pages storefront.

## Endpoints

- `GET /health`
- `POST /create-checkout-session` with body `{ "items": [{ "productId": 101, "quantity": 1 }] }`

Prices are resolved only from the server catalog in `src/catalog.js`.

## Local

```bash
cd server
npm install
npm test
STRIPE_SECRET_KEY=sk_test_xxx ALLOWED_ORIGIN=https://shopwholesomebakes.com npm start
```

## Env

- `STRIPE_SECRET_KEY` (required for checkout)
- `ALLOWED_ORIGIN` (defaults to `https://shopwholesomebakes.com`)
- `PORT` (Render sets this)
