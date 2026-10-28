<?php
/**
 * products.php — product catalogue
 *   ?action=list&featured=1&sort=newest&limit=4   → JSON (used by index.html / scripts.js)
 *   ?id=12                                        → product detail page
 *   ?q=&category=&max=&sort=                      → catalogue page with search + filters
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/store_layout.php';

const CATEGORIES = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'];
const SORTS = [
    'featured'   => 'featured DESC, rating DESC',
    'newest'     => 'created_at DESC',
    'price-asc'  => 'price_cents ASC',
    'price-desc' => 'price_cents DESC',
    'rating'     => 'rating DESC',
];

/** Build a filtered product query with prepared-statement parameters. */
function fetch_products(array $f): array
{
    $where = ['is_active = 1'];
    $args = [];
    if (!empty($f['q'])) {
        $where[] = '(name LIKE ? OR description LIKE ? OR category LIKE ?)';
        $like = '%' . $f['q'] . '%';
        array_push($args, $like, $like, $like);
    }
    if (!empty($f['category']) && in_array($f['category'], CATEGORIES, true)) {
        $where[] = 'category = ?';
        $args[] = $f['category'];
    }
    if (!empty($f['max'])) {
        $where[] = 'price_cents <= ?';
        $args[] = (int)$f['max'] * 100;
    }
    if (!empty($f['featured'])) $where[] = 'featured = 1';
    $order = SORTS[$f['sort'] ?? 'featured'] ?? SORTS['featured'];  // whitelisted — never user SQL
    $limit = max(1, min(100, (int)($f['limit'] ?? 60)));
    $sql = 'SELECT * FROM products WHERE ' . implode(' AND ', $where) . " ORDER BY $order LIMIT $limit";
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st->fetchAll();
}

// ------------------------------------------------------------------ JSON API
if (($_GET['action'] ?? '') === 'list') {
    $rows = fetch_products($_GET);
    foreach ($rows as &$r) {
        foreach (['id', 'price_cents', 'compare_at_cents', 'stock'] as $k) $r[$k] = $r[$k] === null ? null : (int)$r[$k];
    }
    json_out(['products' => $rows]);
}

// ------------------------------------------------------------ Product detail
if (isset($_GET['id'])) {
    $st = db()->prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
    $st->execute([(int)$_GET['id']]);
    $p = $st->fetch();
    if (!$p) {
        http_response_code(404);
        store_header('Not found', 'shop');
        echo '<div class="container" style="text-align:center;padding:90px 0"><h1>That piece has found a new home</h1><p class="muted">It is no longer available.</p><a class="btn btn-dark" href="products.php">Back to Shop</a></div>';
        store_footer();
        exit;
    }
    $sale = $p['compare_at_cents'] && $p['compare_at_cents'] > $p['price_cents'];
    $rel = db()->prepare('SELECT * FROM products WHERE category = ? AND id <> ? AND is_active = 1 LIMIT 4');
    $rel->execute([$p['category'], $p['id']]);
    $related = $rel->fetchAll();
    $json = e(json_encode(['id' => (int)$p['id'], 'name' => $p['name'], 'image' => $p['image_url'], 'price' => (int)$p['price_cents'], 'stock' => (int)$p['stock']]));

    store_header($p['name'], 'shop'); ?>
    <div class="container">
      <p class="muted" style="margin-top:24px;font-size:13.5px"><a href="index.html">Home</a> › <a href="products.php">Shop</a> › <a href="products.php?category=<?= e($p['category']) ?>"><?= e($p['category']) ?></a> › <?= e($p['name']) ?></p>
      <div class="pdp">
        <div class="pdp-img"><img src="<?= e($p['image_url']) ?>" alt="<?= e($p['name']) ?>"></div>
        <div>
          <span class="eyebrow"><?= e($p['category']) ?></span>
          <h1 style="font-size:36px;margin-top:6px"><?= e($p['name']) ?></h1>
          <p class="rating" style="font-size:14px">★ <?= e($p['rating']) ?> customer rating</p>
          <p><span class="price display" style="font-size:32px"><?= zar((int)$p['price_cents']) ?></span>
            <?php if ($sale): ?><span class="was" style="font-size:18px"><?= zar((int)$p['compare_at_cents']) ?></span><?php endif; ?></p>
          <p class="muted" style="font-size:13px;margin-top:-8px">Incl. 15% VAT</p>
          <p style="color:var(--cocoa)"><?= nl2br(e($p['description'])) ?></p>
          <strong style="font-size:14px">Select size</strong>
          <div class="sizes">
            <?php foreach (explode(',', $p['sizes']) as $i => $s): $s = trim($s); ?>
              <label class="size-opt"><input type="radio" name="size" value="<?= e($s) ?>" <?= $s === 'M' || ($i === 0 && strpos($p['sizes'], 'M') === false) ? 'checked' : '' ?>><span><?= e($s) ?></span></label>
            <?php endforeach; ?>
          </div>
          <p style="color:<?= $p['stock'] <= 6 ? 'var(--rose)' : 'var(--sage)' ?>;font-weight:500;font-size:14px">
            <?= $p['stock'] < 1 ? 'Out of stock' : ($p['stock'] <= 6 ? 'Only ' . (int)$p['stock'] . ' left — order soon' : 'In stock, ready to ship from Cape Town') ?></p>
          <div style="display:flex;gap:10px;align-items:center;margin:16px 0">
            <input type="number" class="input" data-qty-input value="1" min="1" max="<?= (int)$p['stock'] ?>" style="width:90px" aria-label="Quantity">
            <button class="btn btn-dark" style="flex:1" data-add='<?= $json ?>' <?= $p['stock'] < 1 ? 'disabled' : '' ?>>👜 Add to Bag</button>
          </div>
          <div class="panel" style="font-size:14px;color:var(--cocoa)">
            🚚 Courier delivery in 2–4 working days · Free over R1,000, otherwise R99<br>
            ↺ 30-day returns & exchanges<br>
            🔒 Secure payment with Visa or Mastercard via Stripe
          </div>
        </div>
      </div>
      <?php if ($related): ?>
        <section class="section"><div class="section-head"><h2>You May Also Love</h2></div>
          <div class="grid cols-4"><?php foreach ($related as $r) echo product_card($r); ?></div></section>
      <?php endif; ?>
    </div>
    <?php store_footer();
    exit;
}

// ------------------------------------------------------------ Catalogue page
$filters = [
    'q' => trim((string)($_GET['q'] ?? '')),
    'category' => (string)($_GET['category'] ?? ''),
    'max' => (string)($_GET['max'] ?? ''),
    'sort' => (string)($_GET['sort'] ?? 'featured'),
];
$items = fetch_products($filters);

/** Build a URL keeping current filters but overriding one. */
function filter_url(array $current, string $key, string $value): string
{
    $q = array_filter(array_merge($current, [$key => $value]), fn($v) => $v !== '' && $v !== 'featured');
    return 'products.php' . ($q ? '?' . http_build_query($q) : '');
}

$activeKey = strtolower($filters['category']) ?: 'shop';
store_header($filters['category'] ?: 'Shop All', in_array($activeKey, ['dresses', 'tops', 'accessories'], true) ? $activeKey : 'shop'); ?>
<div class="container" style="padding-top:32px">
  <span class="eyebrow">The collection</span>
  <h1 style="font-size:38px;margin-top:4px"><?= $filters['q'] !== '' ? 'Results for “' . e($filters['q']) . '”' : e($filters['category'] ?: 'Shop All') ?></h1>
  <p class="muted"><?= count($items) ?> piece<?= count($items) === 1 ? '' : 's' ?> · hand-picked by the Mitchell family</p>

  <div class="toolbar">
    <form method="get" action="products.php" style="display:flex;gap:8px">
      <?php if ($filters['category']): ?><input type="hidden" name="category" value="<?= e($filters['category']) ?>"><?php endif; ?>
      <input class="input pill" name="q" value="<?= e($filters['q']) ?>" placeholder="Search dresses, knits, denim…" aria-label="Search">
      <button class="btn btn-dark btn-sm">Search</button>
    </form>
    <form method="get" action="products.php">
      <?php foreach (['q', 'category', 'max'] as $k) if ($filters[$k] !== '') echo '<input type="hidden" name="' . $k . '" value="' . e($filters[$k]) . '">'; ?>
      <select class="input pill" name="sort" onchange="this.form.submit()" aria-label="Sort">
        <?php foreach (['featured' => 'Featured', 'newest' => 'Newest', 'price-asc' => 'Price: Low to High', 'price-desc' => 'Price: High to Low', 'rating' => 'Top Rated'] as $v => $l): ?>
          <option value="<?= $v ?>" <?= $filters['sort'] === $v ? 'selected' : '' ?>><?= $l ?></option>
        <?php endforeach; ?>
      </select>
    </form>
  </div>

  <div class="catalog">
    <aside class="filters">
      <p class="eyebrow" style="color:var(--mocha)">Category</p>
      <a class="chip <?= $filters['category'] === '' ? 'on' : '' ?>" href="<?= e(filter_url($filters, 'category', '')) ?>">All</a>
      <?php foreach (CATEGORIES as $c): ?>
        <a class="chip <?= $filters['category'] === $c ? 'on' : '' ?>" href="<?= e(filter_url($filters, 'category', $c)) ?>"><?= $c ?></a>
      <?php endforeach; ?>
      <p class="eyebrow" style="color:var(--mocha);margin-top:18px">Max price</p>
      <?php foreach (['' => 'Any price', '800' => 'Under R800', '1000' => 'Under R1,000', '1500' => 'Under R1,500', '2000' => 'Under R2,000'] as $v => $l): ?>
        <a class="chip <?= $filters['max'] === (string)$v ? 'on' : '' ?>" href="<?= e(filter_url($filters, 'max', (string)$v)) ?>"><?= $l ?></a>
      <?php endforeach; ?>
    </aside>
    <div>
      <?php if (!$items): ?>
        <div class="panel" style="text-align:center;padding:60px 20px"><h2>Nothing matches — yet</h2><p class="muted">Try another search. New pieces arrive weekly.</p><a class="btn btn-dark" href="products.php">Browse Everything</a></div>
      <?php else: ?>
        <div class="grid cols-3"><?php foreach ($items as $p) echo product_card($p); ?></div>
      <?php endif; ?>
    </div>
  </div>
</div>
<?php store_footer();
