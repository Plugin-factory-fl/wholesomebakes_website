# Wholesome Bakes Website

A simple static website for Wholesome Bakes — gluten friendly baking in St. Augustine, Florida.

## Pages

- **Home** (`index.html`) — landing page with contact info, featured products, and baker spotlight
- **Menu** (`menu.html`) — shop-style product list with cart
- **Checkout** (`checkout.html`) — review cart and call/text to order
- **About** (`about.html`) — Mama Miller bio and event photos

## GitHub Pages

1. Push this repository to GitHub.
2. Open the repo on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/ (root)**.
5. Click **Save**. Your site will be live at `https://<username>.github.io/wholesomebakes_website/` within a few minutes.

## Local preview

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Customize

- Update phone and social links in `index.html`
- Edit product names and prices in `js/products.js`
- Replace Mama Miller's placeholder bio in `about.html`
