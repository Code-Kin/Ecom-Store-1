<?php
/**
 * checkout.php — secure checkout via Stripe (ZAR · Visa & Mastercard)
 *
 *   GET                      → delivery details form (bag read from localStorage by scripts.js)
 *   POST                     → validate bag server-side, create pending order + Stripe Checkout Session, redirect to Stripe
 *   GET ?session_id=cs_...   → return from Stripe: verify payment, enforce Visa/Mastercard, confirm order
 *   GET ?cancelled=1         → customer cancelled on Stripe
 *   POST ?webhook=1          → Stripe webhook (checkout.session.completed), signature-verified
 *
 * Card details are entered only on Stripe's hosted page — they never touch this server (PCI-DSS SAQ A).
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/store_layout.php';

const PROVINCES = ['Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];

// ------------------------------------------------------------- Stripe webhook
if (isset($_GET['webhook']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = (string)file_get_contents('php://input');
    $sig = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    if (STRIPE_WEBHOOK_SECRET === '' || !stripe_verify_webhook($payload, $sig, STRIPE_WEBHOOK_SECRET)) {
        json_out(['error' => 'Invalid signature'], 400);
    }
    $event = json_decode($payload, true);
    if (in_array($event['type'] ?? '', ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
        try { finalize_stripe_session($event['data']['object']['id']); } catch (Throwable $t) { error_log('Webhook: ' . $t->getMessage()); }
    }
    json_out(['received' => true]);
}

// --------------------------------------------------------- Return from Stripe
if (isset($_GET['session_id'])) {
    try {
        [$ok, $msg, $orderId] = finalize_stripe_session((string)$_GET['session_id']);
    } catch (Throwable $t) {
        [$ok, $msg, $orderId] = [false, 'Could not verify your payment. Please contact us.', null];
    }
    $order = null;
    if ($orderId) {
        $st = db()->prepare('SELECT * FROM orders WHERE id = ?');
        $st->execute([$orderId]);
        $order = $st->fetch();
    }
    store_header($ok ? 'Order confirmed' : 'Payment issue');
    if ($ok) echo '<script>localStorage.removeItem("sb_cart");</script>'; ?>
    <div class="container" style="max-width:640px;text-align:center;padding:70px 16px">
      <?php if ($ok && $order): ?>
        <div style="font-size:54px">🎉</div>
        <h1 style="font-size:36px">Dankie — order confirmed!</h1>
        <p>Order <strong>#<?= (int)$order['id'] ?></strong> · Tracking <strong><?= e($order['tracking_number']) ?></strong></p>
        <p class="muted">We'll hand-pack your order in Cape Town within 1–2 business days. Courier delivery takes 2–4 working days.</p>
        <div class="panel" style="text-align:left;margin:24px auto;max-width:420px">
          <div class="summary-row"><span>Amount paid</span><strong><?= zar((int)$order['total_cents']) ?></strong></div>
          <div class="summary-row"><span>Card</span><strong><?= e(strtoupper((string)$order['card_brand'])) ?> •••• <?= e($order['card_last4']) ?></strong></div>
          <div class="summary-row"><span>Includes VAT</span><span><?= zar((int)$order['vat_cents']) ?></span></div>
        </div>
        <a class="btn btn-dark" href="account.php">View My Orders</a> <a class="btn btn-outline" href="products.php">Keep Shopping</a>
      <?php else: ?>
        <div style="font-size:54px">⚠️</div>
        <h1 style="font-size:32px">Payment not completed</h1>
        <p class="muted"><?= e($msg) ?></p>
        <a class="btn btn-dark" href="checkout.php">Back to Checkout</a>
      <?php endif; ?>
    </div>
    <?php store_footer();
    exit;
}

// ------------------------------------------------ Create order + Stripe session
$error = isset($_GET['cancelled']) ? 'Payment was cancelled — your bag is saved. Try again whenever you are ready.' : '';
$user = current_user();
$form = [
    'email' => $user['email'] ?? '', 'name' => $user['name'] ?? '', 'address' => $user['address'] ?? '',
    'city' => $user['city'] ?? '', 'province' => 'Western Cape', 'postal' => $user['postal_code'] ?? '',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    foreach ($form as $k => $_) $form[$k] = trim((string)($_POST[$k] ?? ''));
    $lines = json_decode((string)($_POST['cart_json'] ?? '[]'), true) ?: [];

    try {
        if (!filter_var($form['email'], FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Please enter a valid email address.');
        if ($form['name'] === '' || $form['address'] === '' || $form['city'] === '') throw new InvalidArgumentException('Please complete your delivery address.');
        if (!preg_match('/^\d{4}$/', $form['postal'])) throw new InvalidArgumentException('South African postal codes have 4 digits.');
        if (!in_array($form['province'], PROVINCES, true)) throw new InvalidArgumentException('Please choose a province.');
        if (!$lines) throw new InvalidArgumentException('Your bag is empty.');

        // Re-price every line from the database — never trust prices from the browser.
        $pdo = db();
        $get = $pdo->prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
        $subtotal = 0;
        $snap = [];
        foreach ($lines as $l) {
            $get->execute([(int)($l['id'] ?? 0)]);
            $p = $get->fetch();
            $qty = max(1, min(99, (int)($l['qty'] ?? 1)));
            if (!$p) throw new InvalidArgumentException('An item in your bag is no longer available.');
            if ($p['stock'] < $qty) throw new InvalidArgumentException("Only {$p['stock']} left of \"{$p['name']}\".");
            $size = substr(preg_replace('/[^A-Z0-9]/', '', strtoupper((string)($l['size'] ?? 'M'))), 0, 4) ?: 'M';
            $subtotal += $p['price_cents'] * $qty;
            $snap[] = ['p' => $p, 'qty' => $qty, 'size' => $size];
        }
        $delivery = delivery_for($subtotal);
        $total = $subtotal + $delivery;                 // prices already include VAT
        $tracking = 'SB-' . strtoupper(base_convert((string)time(), 10, 36)) . random_int(10, 99);

        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO orders (user_id, subtotal_cents, shipping_cents, vat_cents, total_cents, customer_email, shipping_name, shipping_address, shipping_city, shipping_province, shipping_postal, tracking_number) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
            ->execute([$user['id'] ?? null, $subtotal, $delivery, vat_included($total), $total, $form['email'], $form['name'], $form['address'], $form['city'], $form['province'], $form['postal'], $tracking]);
        $orderId = (int)$pdo->lastInsertId();
        $ins = $pdo->prepare('INSERT INTO order_items (order_id, product_id, product_name, product_image, size, quantity, price_cents) VALUES (?,?,?,?,?,?,?)');
        $lineItems = [];
        foreach ($snap as $s) {
            $ins->execute([$orderId, $s['p']['id'], $s['p']['name'], $s['p']['image_url'], $s['size'], $s['qty'], $s['p']['price_cents']]);
            $lineItems[] = [
                'quantity' => $s['qty'],
                'price_data' => [
                    'currency' => CURRENCY,
                    'unit_amount' => (int)$s['p']['price_cents'],
                    'product_data' => ['name' => $s['p']['name'] . ' (Size ' . $s['size'] . ')', 'images' => [$s['p']['image_url']]],
                ],
            ];
        }
        if ($delivery > 0) {
            $lineItems[] = ['quantity' => 1, 'price_data' => ['currency' => CURRENCY, 'unit_amount' => $delivery, 'product_data' => ['name' => 'Courier delivery']]];
        }
        $pdo->commit();

        // Stripe Checkout Session — card payments only (Visa/Mastercard enforced on confirmation).
        $here = base_url() . strtok($_SERVER['REQUEST_URI'], '?');
        $session = stripe_request('POST', 'checkout/sessions', [
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'customer_email' => $form['email'],
            'line_items' => $lineItems,
            'metadata' => ['order_id' => $orderId],
            'payment_intent_data' => ['metadata' => ['order_id' => $orderId], 'description' => "Sarah's Boutique order #$orderId"],
            'success_url' => $here . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $here . '?cancelled=1',
        ]);
        $pdo->prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?')->execute([$session['id'], $orderId]);
        redirect($session['url']);
    } catch (Throwable $t) {
        if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
        $error = $t instanceof InvalidArgumentException || $t instanceof RuntimeException ? $t->getMessage() : 'Checkout failed. Please try again.';
        if (!($t instanceof InvalidArgumentException)) error_log('Checkout: ' . $t->getMessage());
    }
}

store_header('Secure Checkout'); ?>
<div class="container" style="padding-top:32px">
  <h1 style="font-size:38px">🔒 Secure Checkout</h1>
  <p class="muted">Payments processed by Stripe · Visa & Mastercard · All prices in South African Rand (ZAR)</p>
  <?php if ($error): ?><div class="alert alert-error" style="margin-top:16px"><?= e($error) ?></div><?php endif; ?>
  <?php if (!$user): ?><div class="alert" style="background:var(--blush);margin-top:16px">Have an account? <a class="link-rose" href="account.php?next=checkout.php">Sign in</a> for faster checkout and order tracking — or continue as a guest.</div><?php endif; ?>

  <form method="post" class="checkout" data-checkout-form novalidate>
    <?= csrf_field() ?>
    <input type="hidden" name="cart_json" value="[]">
    <div>
      <section class="panel">
        <h2 style="font-size:22px;margin-bottom:16px">📍 Delivery Details</h2>
        <div class="form-grid two">
          <div class="full"><label class="lbl">Email for confirmation *</label><input class="input" type="email" name="email" required value="<?= e($form['email']) ?>" placeholder="you@example.co.za"></div>
          <div class="full"><label class="lbl">Full name *</label><input class="input" name="name" required value="<?= e($form['name']) ?>" placeholder="Thandi Nkosi"></div>
          <div class="full"><label class="lbl">Street address *</label><input class="input" name="address" required value="<?= e($form['address']) ?>" placeholder="12 Long Street, Unit 4"></div>
          <div><label class="lbl">City / Suburb *</label><input class="input" name="city" required value="<?= e($form['city']) ?>" placeholder="Cape Town"></div>
          <div><label class="lbl">Province *</label><select class="input" name="province">
            <?php foreach (PROVINCES as $p): ?><option <?= $form['province'] === $p ? 'selected' : '' ?>><?= $p ?></option><?php endforeach; ?></select></div>
          <div><label class="lbl">Postal code *</label><input class="input" name="postal" required inputmode="numeric" maxlength="4" pattern="\d{4}" value="<?= e($form['postal']) ?>" placeholder="8001"></div>
        </div>
      </section>
      <section class="panel" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h2 style="font-size:22px">💳 Payment</h2>
          <span class="cards"><span class="card-visa">VISA</span><span class="card-mc"><i></i><i></i></span><span class="card-stripe">stripe</span></span>
        </div>
        <p style="color:var(--cocoa)">You'll be redirected to Stripe's secure page to pay with your <strong>Visa</strong> or <strong>Mastercard</strong>. Your bank may ask for 3D Secure verification.</p>
        <p style="color:var(--sage);font-size:13px">🛡 Card details go directly to Stripe (PCI-DSS Level 1) and are never stored by Sarah's Boutique.</p>
      </section>
    </div>
    <aside>
      <div class="panel">
        <h2 style="font-size:22px;margin-bottom:12px">Order Summary</h2>
        <div data-checkout-lines></div>
        <div class="summary-row"><span>Subtotal</span><strong data-co-subtotal>R0.00</strong></div>
        <div class="summary-row"><span>Courier delivery</span><strong data-co-delivery>—</strong></div>
        <div class="summary-row total"><span>Total (ZAR)</span><span class="price" data-co-total>R0.00</span></div>
        <div class="summary-row muted" style="font-size:12.5px"><span>Includes VAT (15%)</span><span data-co-vat>R0.00</span></div>
        <button class="btn btn-stripe" style="margin-top:14px" data-pay-btn>🔒 Pay with Stripe</button>
      </div>
    </aside>
  </form>
</div>
<?php store_footer();
