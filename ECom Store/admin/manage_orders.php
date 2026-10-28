<?php
/**
 * manage_orders.php — view, process and track orders.
 *   ?status=processing   filter by status
 *   ?id=12               order detail (items, delivery address, Stripe payment, tracking, notes)
 * Refunds are issued through Stripe so the card is credited automatically.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/admin_layout.php';
require_admin();

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (int)$_POST['id'];
    $flash = 'ok:Order #' . $id . ' updated.';
    if (($_POST['action'] ?? '') === 'update') {
        $status = in_array($_POST['status'] ?? '', STATUSES, true) ? $_POST['status'] : null;
        if ($status) $pdo->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$status, $id]);
        if (isset($_POST['tracking_number'])) {
            $pdo->prepare('UPDATE orders SET tracking_number=?, notes=? WHERE id=?')
                ->execute([trim((string)$_POST['tracking_number']) ?: null, trim((string)$_POST['notes']) ?: null, $id]);
        }
    } elseif (($_POST['action'] ?? '') === 'refund') {
        $st = $pdo->prepare('SELECT stripe_payment_id, payment_status FROM orders WHERE id=?');
        $st->execute([$id]);
        $o = $st->fetch();
        try {
            if (!$o || $o['payment_status'] !== 'paid' || !$o['stripe_payment_id']) throw new RuntimeException('Only paid Stripe orders can be refunded.');
            stripe_request('POST', 'refunds', ['payment_intent' => $o['stripe_payment_id']]);
            $pdo->prepare("UPDATE orders SET payment_status='refunded', status='cancelled' WHERE id=?")->execute([$id]);
            $flash = 'ok:Refund issued via Stripe for order #' . $id . '.';
        } catch (Throwable $t) {
            $flash = 'err:' . $t->getMessage();
        }
    }
    $_SESSION['flash'] = $flash;
    redirect('manage_orders.php?' . http_build_query(array_filter(['id' => $_GET['id'] ?? null, 'status' => $_GET['status'] ?? null])));
}

$flash = $_SESSION['flash'] ?? '';
unset($_SESSION['flash']);

// ---------------------------------------------------------------- Detail
if (isset($_GET['id'])) {
    $st = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $st->execute([(int)$_GET['id']]);
    $o = $st->fetch();
    if (!$o) redirect('manage_orders.php');
    $it = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
    $it->execute([$o['id']]);
    $items = $it->fetchAll();

    admin_header('Order #' . $o['id'], 'orders'); ?>
    <p><a href="manage_orders.php" class="muted">← All orders</a></p>
    <div class="head"><h1>Order #<?= (int)$o['id'] ?></h1><span><?= status_badge($o['status']) ?> <?= status_badge($o['payment_status']) ?></span></div>
    <?php if ($flash): [$t, $m] = explode(':', $flash, 2); ?><div class="alert <?= $t === 'ok' ? 'ok' : 'err' ?>"><?= e($m) ?></div><?php endif; ?>
    <div class="cols two">
      <div>
        <div class="table-wrap"><table>
          <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th><th>Line total</th></tr></thead>
          <tbody><?php foreach ($items as $i): ?>
            <tr><td style="display:flex;gap:10px;align-items:center"><img class="thumb" src="<?= e($i['product_image']) ?>" alt=""><?= e($i['product_name']) ?></td>
              <td><?= e($i['size']) ?></td><td><?= (int)$i['quantity'] ?></td><td><?= zar((int)$i['price_cents']) ?></td><td><b><?= zar($i['price_cents'] * $i['quantity']) ?></b></td></tr>
          <?php endforeach; ?></tbody>
        </table></div>
        <div class="card" style="margin-top:16px">
          <h2>Process order</h2>
          <form method="post" class="form-grid two" style="margin-top:12px">
            <?= csrf_field() ?><input type="hidden" name="action" value="update"><input type="hidden" name="id" value="<?= (int)$o['id'] ?>">
            <div><label>Status</label><select name="status"><?php foreach (STATUSES as $s): ?><option <?= $o['status'] === $s ? 'selected' : '' ?>><?= $s ?></option><?php endforeach; ?></select></div>
            <div><label>Courier tracking number</label><input class="input" name="tracking_number" value="<?= e($o['tracking_number']) ?>"></div>
            <div class="full"><label>Internal notes</label><textarea name="notes" rows="2"><?= e($o['notes']) ?></textarea></div>
            <div class="full"><button class="btn">Save changes</button></div>
          </form>
          <?php if ($o['payment_status'] === 'paid'): ?>
            <form method="post" data-confirm="Refund <?= zar((int)$o['total_cents']) ?> to the customer's card via Stripe?" style="margin-top:12px">
              <?= csrf_field() ?><input type="hidden" name="action" value="refund"><input type="hidden" name="id" value="<?= (int)$o['id'] ?>">
              <button class="btn danger">↺ Refund via Stripe</button>
            </form>
          <?php endif; ?>
        </div>
      </div>
      <div>
        <div class="card"><h2>Delivery</h2>
          <p><b><?= e($o['shipping_name']) ?></b><br><?= e($o['shipping_address']) ?><br><?= e($o['shipping_city']) ?>, <?= e($o['shipping_province']) ?> <?= e($o['shipping_postal']) ?><br><span class="muted"><?= e($o['customer_email']) ?></span></p></div>
        <div class="card" style="margin-top:16px"><h2>Payment</h2>
          <p class="muted">Subtotal <?= zar((int)$o['subtotal_cents']) ?><br>Delivery <?= $o['shipping_cents'] ? zar((int)$o['shipping_cents']) : 'FREE' ?><br>VAT included <?= zar((int)$o['vat_cents']) ?></p>
          <p style="font-size:20px"><b><?= zar((int)$o['total_cents']) ?></b></p>
          <p class="muted">Stripe · <?= e(strtoupper((string)$o['card_brand'])) ?> <?= $o['card_last4'] ? '•••• ' . e($o['card_last4']) : '' ?><br><small><?= e($o['stripe_payment_id'] ?: 'Awaiting payment') ?></small></p>
          <p class="muted">Placed <?= e(date('j M Y, H:i', strtotime($o['created_at']))) ?></p></div>
      </div>
    </div>
    <?php admin_footer();
    exit;
}

// ------------------------------------------------------------------ List
$filter = in_array($_GET['status'] ?? '', STATUSES, true) ? $_GET['status'] : '';
$counts = $pdo->query('SELECT status, COUNT(*) c FROM orders GROUP BY status')->fetchAll(PDO::FETCH_KEY_PAIR);
$st = $pdo->prepare('SELECT o.*, (SELECT SUM(quantity) FROM order_items WHERE order_id=o.id) AS pcs FROM orders o' . ($filter ? ' WHERE status = ?' : '') . ' ORDER BY created_at DESC LIMIT 300');
$st->execute($filter ? [$filter] : []);
$orders = $st->fetchAll();

admin_header('Orders', 'orders'); ?>
<div class="head"><div><h1>Orders</h1><p class="muted"><?= array_sum($counts) ?> total</p></div></div>
<?php if ($flash): [$t, $m] = explode(':', $flash, 2); ?><div class="alert <?= $t === 'ok' ? 'ok' : 'err' ?>"><?= e($m) ?></div><?php endif; ?>
<div class="filters">
  <a class="btn sm <?= $filter === '' ? '' : 'light' ?>" href="manage_orders.php">All (<?= array_sum($counts) ?>)</a>
  <?php foreach (STATUSES as $s): ?><a class="btn sm <?= $filter === $s ? '' : 'light' ?>" href="?status=<?= $s ?>"><?= ucfirst($s) ?> (<?= (int)($counts[$s] ?? 0) ?>)</a><?php endforeach; ?>
  <input class="input" placeholder="Search order #, name, email, tracking…" data-filter-table="#orders-table">
</div>
<div class="table-wrap">
  <table id="orders-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($orders as $o): ?>
      <tr>
        <td><b>#<?= (int)$o['id'] ?></b><br><small class="muted"><?= e(date('j M, H:i', strtotime($o['created_at']))) ?></small></td>
        <td><?= e($o['shipping_name']) ?><br><small class="muted"><?= e($o['customer_email']) ?> · <?= e($o['shipping_city']) ?></small></td>
        <td><?= (int)$o['pcs'] ?> pcs</td>
        <td><b><?= zar((int)$o['total_cents']) ?></b></td>
        <td><?= status_badge($o['payment_status']) ?></td>
        <td><form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="update"><input type="hidden" name="id" value="<?= (int)$o['id'] ?>">
          <select name="status" data-autosubmit style="width:auto"><?php foreach (STATUSES as $s): ?><option <?= $o['status'] === $s ? 'selected' : '' ?>><?= $s ?></option><?php endforeach; ?></select></form></td>
        <td><a class="btn light sm" href="?id=<?= (int)$o['id'] ?>">Details</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$orders): ?><tr><td colspan="7" class="muted">No orders.</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>
<?php admin_footer();
