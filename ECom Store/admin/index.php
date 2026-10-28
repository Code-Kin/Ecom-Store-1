<?php
/**
 * admin/index.php — secure admin login + dashboard
 * Shows: sales KPIs (ZAR), inventory status, low-stock alerts, recent orders, unread messages.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/admin_layout.php';

if (isset($_GET['logout'])) { logout_user(); redirect('index.php'); }

// ------------------------------------------------------------------- Login
$user = current_user();
if (!$user || $user['role'] !== 'admin') {
    $error = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        csrf_check();
        $_SESSION['admin_attempts'] = ($_SESSION['admin_attempts'] ?? 0) + 1;
        if ($_SESSION['admin_attempts'] > 5) {
            $error = 'Too many failed attempts. Please try again later.';
        } else {
            $st = db()->prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'");
            $st->execute([strtolower(trim((string)$_POST['email']))]);
            $u = $st->fetch();
            if ($u && password_verify((string)$_POST['password'], $u['password_hash'])) {
                $_SESSION['admin_attempts'] = 0;
                login_user($u);
                redirect('index.php');
            }
            $error = 'Invalid admin credentials.';
        }
    } ?>
<!DOCTYPE html>
<html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Admin Login · Sarah's Boutique</title><link rel="stylesheet" href="admin_styles.css"></head>
<body><div class="login-wrap"><div class="login-card">
  <div class="brand" style="color:var(--ink)"><span class="mark">✿</span><span><b>Sarah's Boutique</b><small style="color:var(--rose)">🛡 Staff only</small></span></div>
  <h1 style="margin-top:22px">Admin sign in</h1>
  <p class="muted">Restricted area — authorised boutique staff only.</p>
  <?php if ($error): ?><div class="alert err"><?= e($error) ?></div><?php endif; ?>
  <?php if ($user && $user['role'] !== 'admin'): ?><div class="alert err">Your account does not have admin permissions.</div><?php endif; ?>
  <form method="post" class="form-grid">
    <?= csrf_field() ?>
    <div><label>Email</label><input class="input" type="email" name="email" required autocomplete="username"></div>
    <div><label>Password</label><input class="input" type="password" name="password" required autocomplete="current-password"></div>
    <button class="btn" style="justify-content:center">Sign in →</button>
  </form>
  <p class="muted" style="margin-top:16px"><a href="../main/index.html">← Back to the store</a></p>
</div></div></body></html>
<?php
    exit;
}

// --------------------------------------------------------------- Dashboard
$pdo = db();
$k = $pdo->query("SELECT
    COALESCE(SUM(CASE WHEN payment_status='paid' THEN total_cents END),0) AS revenue,
    COUNT(*) AS orders,
    COALESCE(AVG(CASE WHEN payment_status='paid' THEN total_cents END),0) AS aov,
    SUM(status IN ('pending','processing')) AS to_fulfil
  FROM orders")->fetch();
$customers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='customer'")->fetchColumn();
$inv = $pdo->query("SELECT COALESCE(SUM(stock),0) AS units, COUNT(*) AS skus, COALESCE(SUM(stock*price_cents),0) AS value FROM products WHERE is_active=1")->fetch();
$unread = (int)$pdo->query("SELECT COUNT(*) FROM messages WHERE status='new'")->fetchColumn();
$low = $pdo->query("SELECT id, name, image_url, stock, price_cents FROM products WHERE is_active=1 AND stock <= 6 ORDER BY stock LIMIT 6")->fetchAll();
$recent = $pdo->query("SELECT id, shipping_name, customer_email, status, payment_status, total_cents, created_at FROM orders ORDER BY created_at DESC LIMIT 8")->fetchAll();
$hour = (int)date('G');

admin_header('Dashboard', 'dashboard'); ?>
<div class="head">
  <div><h1><?= $hour < 12 ? 'Good morning' : ($hour < 18 ? 'Good afternoon' : 'Good evening') ?>, <?= e(explode(' ', $user['name'])[0]) ?> ♡</h1>
    <p class="muted"><?= date('l, j F Y') ?> · Here's what's happening at the boutique.</p></div>
  <div style="display:flex;gap:8px"><a class="btn" href="manage_products.php">＋ Add Product</a><a class="btn light" href="manage_orders.php?status=processing">Fulfil Orders →</a></div>
</div>

<div class="kpis">
  <div class="card kpi"><div class="icon">💰</div><div class="val"><?= zar((int)$k['revenue']) ?></div><div class="lbl">Revenue (paid)</div></div>
  <div class="card kpi"><div class="icon">🛒</div><div class="val"><?= (int)$k['orders'] ?></div><div class="lbl">Orders · <?= (int)$k['to_fulfil'] ?> to fulfil</div></div>
  <div class="card kpi"><div class="icon">🧾</div><div class="val"><?= zar((int)$k['aov']) ?></div><div class="lbl">Avg. order value</div></div>
  <div class="card kpi"><div class="icon">👥</div><div class="val"><?= $customers ?></div><div class="lbl">Customers</div></div>
  <div class="card kpi"><div class="icon">📦</div><div class="val"><?= (int)$inv['units'] ?></div><div class="lbl"><?= (int)$inv['skus'] ?> SKUs · <?= zar((int)$inv['value']) ?> stock value</div></div>
  <div class="card kpi"><div class="icon">✉</div><div class="val"><?= $unread ?></div><div class="lbl">Unread messages</div></div>
</div>

<div class="cols two">
  <div class="table-wrap">
    <div class="head" style="padding:16px 16px 8px"><h2>Recent Orders</h2><a href="manage_orders.php" style="color:var(--rose);font-weight:600">View all →</a></div>
    <table>
      <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>Placed</th></tr></thead>
      <tbody>
      <?php foreach ($recent as $o): ?>
        <tr><td><b>#<?= (int)$o['id'] ?></b></td><td><?= e($o['shipping_name']) ?><br><small class="muted"><?= e($o['customer_email']) ?></small></td>
          <td><?= status_badge($o['status']) ?></td><td><?= status_badge($o['payment_status']) ?></td>
          <td><b><?= zar((int)$o['total_cents']) ?></b></td><td class="muted"><?= e(date('j M, H:i', strtotime($o['created_at']))) ?></td></tr>
      <?php endforeach; ?>
      <?php if (!$recent): ?><tr><td colspan="6" class="muted">No orders yet.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <div class="card">
    <h2>⚠ Low Stock Alerts</h2>
    <?php if (!$low): ?><p class="alert ok">All stocked up!</p><?php endif; ?>
    <?php foreach ($low as $p): ?>
      <a href="manage_products.php" style="display:flex;gap:10px;align-items:center;margin-top:12px">
        <img class="thumb" src="<?= e($p['image_url']) ?>" alt="">
        <span style="flex:1"><b style="font-size:14px"><?= e($p['name']) ?></b><br><small class="muted"><?= zar((int)$p['price_cents']) ?></small></span>
        <span class="<?= $p['stock'] < 1 ? 'stock-out' : 'stock-low' ?>"><?= $p['stock'] < 1 ? 'Out' : (int)$p['stock'] . ' left' ?></span>
      </a>
    <?php endforeach; ?>
  </div>
</div>
<?php admin_footer();
