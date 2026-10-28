<?php
/**
 * analytics.php — sales analytics & inventory status (ZAR).
 *   ?days=7|30|90   reporting window (default 30)
 * Revenue counts paid orders only.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/admin_layout.php';
require_admin();

$days = in_array((int)($_GET['days'] ?? 30), [7, 30, 90], true) ? (int)$_GET['days'] : 30;
$pdo = db();

$daily = $pdo->prepare("SELECT DATE(created_at) d, SUM(total_cents) t, COUNT(*) c FROM orders
    WHERE payment_status='paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY d");
$daily->execute([$days]);
$rows = $daily->fetchAll(PDO::FETCH_UNIQUE);

// Fill gaps so the chart shows every day in the window.
$series = [];
for ($i = $days - 1; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-$i day"));
    $series[$d] = (int)($rows[$d]['t'] ?? 0);
}
$max = max(1, max($series));
$periodRevenue = array_sum($series);
$periodOrders = array_sum(array_map(fn($r) => (int)$r['c'], $rows));

$summary = $pdo->prepare("SELECT COALESCE(SUM(vat_cents),0) vat, COALESCE(SUM(shipping_cents),0) ship FROM orders WHERE payment_status='paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)");
$summary->execute([$days]);
$sum = $summary->fetch();

$top = $pdo->prepare("SELECT oi.product_name, oi.product_image, SUM(oi.quantity) units, SUM(oi.quantity*oi.price_cents) rev
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.payment_status='paid' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY oi.product_name, oi.product_image ORDER BY units DESC LIMIT 8");
$top->execute([$days]);
$topProducts = $top->fetchAll();

$byCat = $pdo->query("SELECT category, COUNT(*) skus, SUM(stock) units, SUM(stock*price_cents) value FROM products WHERE is_active=1 GROUP BY category ORDER BY value DESC")->fetchAll();
$catMax = max(1, ...array_map(fn($c) => (int)$c['value'], $byCat ?: [['value' => 1]]));
$byStatus = $pdo->query("SELECT status, COUNT(*) c FROM orders GROUP BY status")->fetchAll(PDO::FETCH_KEY_PAIR);
$statusTotal = max(1, array_sum($byStatus));
$byProvince = $pdo->query("SELECT shipping_province p, COUNT(*) c, SUM(total_cents) t FROM orders WHERE payment_status='paid' GROUP BY shipping_province ORDER BY t DESC")->fetchAll();

admin_header('Analytics', 'analytics'); ?>
<div class="head">
  <div><h1>Sales Analytics</h1><p class="muted">Paid orders · last <?= $days ?> days · ZAR</p></div>
  <div style="display:flex;gap:6px"><?php foreach ([7, 30, 90] as $d): ?><a class="btn sm <?= $days === $d ? '' : 'light' ?>" href="?days=<?= $d ?>"><?= $d ?> days</a><?php endforeach; ?></div>
</div>

<div class="kpis">
  <div class="card kpi"><div class="icon">💰</div><div class="val"><?= zar($periodRevenue) ?></div><div class="lbl">Revenue</div></div>
  <div class="card kpi"><div class="icon">🛒</div><div class="val"><?= $periodOrders ?></div><div class="lbl">Paid orders</div></div>
  <div class="card kpi"><div class="icon">🧾</div><div class="val"><?= zar($periodOrders ? intdiv($periodRevenue, $periodOrders) : 0) ?></div><div class="lbl">Avg. order value</div></div>
  <div class="card kpi"><div class="icon">🏛</div><div class="val"><?= zar((int)$sum['vat']) ?></div><div class="lbl">VAT collected (15%)</div></div>
  <div class="card kpi"><div class="icon">🚚</div><div class="val"><?= zar((int)$sum['ship']) ?></div><div class="lbl">Delivery fees</div></div>
  <div class="card kpi"><div class="icon">📅</div><div class="val"><?= zar(intdiv($periodRevenue, $days)) ?></div><div class="lbl">Avg. per day</div></div>
</div>

<div class="card">
  <h2>Daily revenue</h2>
  <div class="chart">
    <?php foreach ($series as $d => $t): ?>
      <div class="bar" title="<?= e(date('j M', strtotime($d))) ?>: <?= zar($t) ?>">
        <div style="height:<?= max(1, round($t / $max * 100)) ?>%;<?= $t ? '' : 'opacity:.25' ?>"></div>
        <?php if ($days <= 30): ?><small><?= date($days <= 7 ? 'D' : 'j', strtotime($d)) ?></small><?php endif; ?>
      </div>
    <?php endforeach; ?>
  </div>
</div>

<div class="cols three">
  <div class="card"><h2>Top products</h2>
    <?php foreach ($topProducts as $i => $p): ?>
      <div style="display:flex;gap:10px;align-items:center;margin-top:12px"><b style="color:var(--rose)">#<?= $i + 1 ?></b><img class="thumb" src="<?= e($p['product_image']) ?>" alt="">
        <span style="flex:1;font-size:14px"><b><?= e($p['product_name']) ?></b><br><small class="muted"><?= (int)$p['units'] ?> sold</small></span><b style="color:var(--sage)"><?= zar((int)$p['rev']) ?></b></div>
    <?php endforeach; ?>
    <?php if (!$topProducts): ?><p class="muted">No sales in this period.</p><?php endif; ?>
  </div>
  <div class="card"><h2>Inventory by category</h2>
    <?php foreach ($byCat as $c): ?>
      <div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:14px"><b><?= e($c['category']) ?></b><span><?= (int)$c['units'] ?> units · <?= zar((int)$c['value']) ?></span></div>
        <div class="meter"><div style="width:<?= round($c['value'] / $catMax * 100) ?>%"></div></div></div>
    <?php endforeach; ?>
  </div>
  <div class="card"><h2>Orders by status</h2>
    <?php foreach (['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as $s): $c = (int)($byStatus[$s] ?? 0); ?>
      <div style="margin-top:12px"><div style="display:flex;justify-content:space-between"><?= status_badge($s) ?><b><?= $c ?></b></div><div class="meter"><div style="width:<?= round($c / $statusTotal * 100) ?>%"></div></div></div>
    <?php endforeach; ?>
    <h2 style="margin-top:22px">Sales by province</h2>
    <?php foreach ($byProvince as $p): ?><p style="display:flex;justify-content:space-between;font-size:14px;margin:8px 0"><span><?= e($p['p']) ?> (<?= (int)$p['c'] ?>)</span><b><?= zar((int)$p['t']) ?></b></p><?php endforeach; ?>
    <?php if (!$byProvince): ?><p class="muted">No paid orders yet.</p><?php endif; ?>
  </div>
</div>
<?php admin_footer();
