<?php
/**
 * manage_customers.php — customer profiles (with order rollups) + contact messages & feedback inbox.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/admin_layout.php';
require_admin();

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (int)$_POST['id'];
    if (($_POST['action'] ?? '') === 'msg_status' && in_array($_POST['status'], ['new', 'read', 'replied', 'archived'], true)) {
        $pdo->prepare('UPDATE messages SET status=? WHERE id=?')->execute([$_POST['status'], $id]);
    } elseif (($_POST['action'] ?? '') === 'msg_delete') {
        $pdo->prepare('DELETE FROM messages WHERE id=?')->execute([$id]);
    }
    redirect('manage_customers.php?tab=feedback');
}

$tab = ($_GET['tab'] ?? 'customers') === 'feedback' ? 'feedback' : 'customers';

admin_header('Customers & Feedback', 'customers'); ?>
<div class="head"><h1>Customers & Feedback</h1>
  <div style="display:flex;gap:8px"><a class="btn sm <?= $tab === 'customers' ? '' : 'light' ?>" href="?tab=customers">👥 Customers</a><a class="btn sm <?= $tab === 'feedback' ? '' : 'light' ?>" href="?tab=feedback">✉ Inbox & Feedback</a></div>
</div>

<?php if ($tab === 'customers'):
    $customers = $pdo->query("SELECT u.*, COUNT(o.id) AS orders,
        COALESCE(SUM(CASE WHEN o.payment_status='paid' THEN o.total_cents END),0) AS spent, MAX(o.created_at) AS last_order
        FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.role='customer' GROUP BY u.id ORDER BY spent DESC")->fetchAll();
    $view = null;
    if (isset($_GET['id'])) {
        foreach ($customers as $c) if ((int)$c['id'] === (int)$_GET['id']) $view = $c;
    } ?>
  <?php if ($view):
      $ho = $pdo->prepare('SELECT id, status, payment_status, total_cents, created_at FROM orders WHERE user_id=? ORDER BY created_at DESC');
      $ho->execute([$view['id']]); ?>
    <div class="card" style="margin-top:16px">
      <div class="head"><h2><?= e($view['name']) ?></h2><a class="btn light sm" href="?tab=customers">✕ Close</a></div>
      <p class="muted">✉ <?= e($view['email']) ?> · 📞 <?= e($view['phone'] ?: '—') ?> · 📍 <?= e(trim(($view['address'] ?? '') . ', ' . ($view['city'] ?? '') . ' ' . ($view['postal_code'] ?? ''), ' ,') ?: 'No address') ?> · Joined <?= e(date('j M Y', strtotime($view['created_at']))) ?></p>
      <p><b><?= (int)$view['orders'] ?></b> orders · <b><?= zar((int)$view['spent']) ?></b> lifetime spend</p>
      <?php foreach ($ho->fetchAll() as $o): ?>
        <p style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px"><a href="manage_orders.php?id=<?= (int)$o['id'] ?>"><b>#<?= (int)$o['id'] ?></b> · <?= e(date('j M Y', strtotime($o['created_at']))) ?></a><span><?= status_badge($o['status']) ?> <b><?= zar((int)$o['total_cents']) ?></b></span></p>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
  <div class="filters"><input class="input" placeholder="Search customers…" data-filter-table="#customers-table"></div>
  <div class="table-wrap"><table id="customers-table">
    <thead><tr><th>Customer</th><th>Phone</th><th>City</th><th>Orders</th><th>Lifetime spend</th><th>Last order</th><th></th></tr></thead>
    <tbody><?php foreach ($customers as $c): ?>
      <tr><td><b><?= e($c['name']) ?></b><br><small class="muted"><?= e($c['email']) ?></small></td><td><?= e($c['phone'] ?: '—') ?></td><td><?= e($c['city'] ?: '—') ?></td>
        <td><?= (int)$c['orders'] ?></td><td><b><?= zar((int)$c['spent']) ?></b></td><td class="muted"><?= $c['last_order'] ? e(date('j M Y', strtotime($c['last_order']))) : '—' ?></td>
        <td><a class="btn light sm" href="?tab=customers&id=<?= (int)$c['id'] ?>">Profile</a></td></tr>
    <?php endforeach; ?>
    <?php if (!$customers): ?><tr><td colspan="7" class="muted">No customers yet.</td></tr><?php endif; ?></tbody>
  </table></div>

<?php else:
    $messages = $pdo->query("SELECT * FROM messages ORDER BY status='new' DESC, created_at DESC LIMIT 200")->fetchAll();
    $avg = $pdo->query("SELECT ROUND(AVG(rating),1) FROM messages WHERE type='feedback' AND rating IS NOT NULL")->fetchColumn(); ?>
  <p class="muted" style="margin-top:12px">Average feedback rating: <b><?= $avg ? e($avg) . ' ★' : '—' ?></b></p>
  <?php foreach ($messages as $m): ?>
    <div class="card" style="margin-top:12px;<?= $m['status'] === 'new' ? 'border-left:4px solid var(--rose)' : '' ?>">
      <div class="head"><div><b><?= e($m['name']) ?></b> <span class="muted">· <?= e($m['email']) ?> · <?= e(date('j M Y H:i', strtotime($m['created_at']))) ?></span><br>
        <small><?= e($m['subject']) ?></small></div>
        <span><span class="status status-<?= $m['type'] === 'feedback' ? 'shipped' : 'read' ?>"><?= e($m['type']) ?></span> <?= status_badge($m['status']) ?></span></div>
      <?php if ($m['rating']): ?><p style="color:var(--gold);margin:6px 0"><?= str_repeat('★', (int)$m['rating']) . str_repeat('☆', 5 - (int)$m['rating']) ?></p><?php endif; ?>
      <p style="background:#fdfaf6;padding:12px;border-radius:10px"><?= nl2br(e($m['message'])) ?></p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <?php foreach (['read' => 'Mark read', 'replied' => 'Mark replied', 'archived' => 'Archive'] as $s => $l): if ($m['status'] === $s) continue; ?>
          <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="msg_status"><input type="hidden" name="id" value="<?= (int)$m['id'] ?>"><button class="btn light sm" name="status" value="<?= $s ?>"><?= $l ?></button></form>
        <?php endforeach; ?>
        <a class="btn light sm" href="mailto:<?= e($m['email']) ?>?subject=<?= rawurlencode('Re: ' . $m['subject']) ?>">↩ Reply by email</a>
        <form method="post" data-confirm="Delete this message?"><?= csrf_field() ?><input type="hidden" name="action" value="msg_delete"><input type="hidden" name="id" value="<?= (int)$m['id'] ?>"><button class="btn danger sm">Delete</button></form>
      </div>
    </div>
  <?php endforeach; ?>
  <?php if (!$messages): ?><p class="card muted">Inbox zero 🎉</p><?php endif; ?>
<?php endif; ?>
<?php admin_footer();
