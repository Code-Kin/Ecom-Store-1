# Sarah's Boutique — E-commerce Prototypes (South Africa · ZAR · Stripe)

Built on the specified stack: **HTML, CSS, JavaScript, PHP 8+ and MySQL 8**. Prices are shown in **Rand (ZAR)** and include 15% VAT. Payments go through **Stripe** and accept **Visa and Mastercard**.

```
/main                      Customer website
  index.html               Homepage (product grids load from products.php)
  styles.css               Storefront design ("Option A")
  scripts.js               Bag (localStorage), drawer, search, product grids, checkout summary
  products.php             Catalogue, search/filters, product detail, JSON API (?action=list)
  checkout.php             Stripe Checkout, success page, webhook (?webhook=1)
  contact.php              Contact + feedback forms
  account.php              Register / login / profile / order history
/admin                     Administrator website (admin role required)
  index.php                Secure login + dashboard
  admin_styles.css
  admin_scripts.js
  manage_products.php      Add / edit / delete products, stock, featured, visibility
  manage_orders.php        View, process, track orders; refund via Stripe
  manage_customers.php     Customer profiles + contact/feedback inbox
  analytics.php            Revenue, VAT, top products, inventory, provinces
/includes                  Shared PHP (config, layouts, Stripe client) — keep outside web root if possible
/database/schema.sql       MySQL schema + demo data
```

## Setup
1. Import the database: `mysql -u root -p < database/schema.sql`
2. Set environment variables (vhost / php-fpm / hosting panel):
   `DB_HOST DB_NAME DB_USER DB_PASS STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET APP_URL`
3. PHP extensions needed: `pdo_mysql`, `curl`, `mbstring`.
4. Open `/main/index.html` (store) and `/admin/index.php` (admin).
   Demo logins: `admin@sarahsboutique.co.za / admin123`, `emma@example.co.za / password123`. **Change these before going live.**

## Stripe (ZAR · Visa & Mastercard)
1. Create a Stripe account for your South African business. In the Dashboard, copy the **Secret key** into `STRIPE_SECRET_KEY`.
2. Add a webhook: `https://YOUR-DOMAIN/main/checkout.php?webhook=1` with the event `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Testing: use `sk_test_…` keys with card `4242 4242 4242 4242` (Visa) or `5555 5555 5555 4444` (Mastercard), any future expiry date and any CVC.
4. Card brands: Stripe Checkout can't hide other brands, so the code checks every charge after payment. Any card that isn't Visa or Mastercard (e.g. Amex) is **refunded automatically** and the order is cancelled. To block those cards before they are charged, also add this Stripe Radar rule:
   `Block if :card_brand: not in ('visa', 'mastercard')`

## Security
- PDO prepared statements; HTML output escaped with `e()`
- `password_hash` / `password_verify`; session ID regenerated on login; HttpOnly + SameSite cookies
- CSRF tokens on every form; login throttling; role check on every admin page
- Card details are entered only on Stripe's hosted page (PCI-DSS SAQ A); prices are recalculated on the server
- Webhook requests are checked with HMAC signature verification
