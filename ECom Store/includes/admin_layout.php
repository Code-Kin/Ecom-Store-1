<?php
/** Admin chrome: sidebar navigation + page wrapper. Every admin page calls require_admin() first. */
function admin_header(string $title, string $active): void
{
    $u = current_user();
    $nav = [
        'dashboard' => ['index.php', '◧ Dashboard'],
        'products'  => ['manage_products.php', '▣ Products'],
        'orders'    => ['manage_orders.php', '🛒 Orders'],
        'customers' => ['manage_customers.php', '👥 Customers & Feedback'],
        'analytics' => ['analytics.php', '📈 Analytics'],
    ];
    ?>
<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title><?= e($title) ?> · Admin · Sarah's Boutique</title>
  <link rel="stylesheet" href="admin_styles.css">
</head>
<body>
<div class="admin">
  <aside class="sidebar" data-sidebar>
    <a href="index.php" class="brand"><span class="mark">✿</span><span><b>Sarah's Boutique</b><small>🛡 Admin Portal</small></span></a>
    <nav>
      <?php foreach ($nav as $k => [$href, $label]): ?>
        <a href="<?= $href ?>" class="<?= $k === $active ? 'active' : '' ?>"><?= $label ?></a>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <a href="../main/index.html">🏬 View Storefront</a>
      <a href="index.php?logout=1">⎋ Sign out (<?= e(explode(' ', $u['name'])[0]) ?>)</a>
    </div>
  </aside>
  <div class="content">
    <div class="topbar"><button class="btn-icon" data-toggle-sidebar aria-label="Menu">☰</button><b>Admin Portal</b><a href="../main/index.html">🏬</a></div>
    <div class="page">
<?php
}

function admin_footer(): void
{
    ?>
    </div>
  </div>
</div>
<script src="admin_scripts.js"></script>
</body>
</html>
<?php
}

function status_badge(string $s): string
{
    return '<span class="status status-' . e($s) . '">' . e($s) . '</span>';
}
