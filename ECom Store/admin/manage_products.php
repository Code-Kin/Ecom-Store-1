<?php
/**
 * manage_products.php — add / edit / delete products, adjust stock, toggle featured & visibility.
 * All writes are POST + CSRF-protected; admin role required.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/admin_layout.php';
require_admin();

const CATS = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'];
$pdo = db();
$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);

    if ($action === 'save') {
        $name = trim((string)$_POST['name']);
        $price = (int)round((float)$_POST['price'] * 100);         // Rand → cents
        $compare = $_POST['compare_at'] !== '' ? (int)round((float)$_POST['compare_at'] * 100) : null;
        $cat = in_array($_POST['category'], CATS, true) ? $_POST['category'] : 'Dresses';
        $img = filter_var($_POST['image_url'], FILTER_VALIDATE_URL) ?: '';
        $data = [$name, trim((string)$_POST['description']), $price, $compare, $cat, $img, max(0, (int)$_POST['stock']),
                 preg_replace('/[^A-Z0-9,]/', '', strtoupper((string)$_POST['sizes'])) ?: 'XS,S,M,L,XL',
                 isset($_POST['featured']) ? 1 : 0, isset($_POST['is_active']) ? 1 : 0];
        if ($name === '' || $price <= 0) {
            $msg = 'err:Name and a price greater than R0 are required.';
        } elseif ($id) {
            $data[] = $id;
            $pdo->prepare('UPDATE products SET name=?, description=?, price_cents=?, compare_at_cents=?, category=?, image_url=?, stock=?, sizes=?, featured=?, is_active=? WHERE id=?')->execute($data);
            $msg = 'ok:Product updated.';
        } else {
            $pdo->prepare('INSERT INTO products (name, description, price_cents, compare_at_cents, category, image_url, stock, sizes, featured, is_active) VALUES (?,?,?,?,?,?,?,?,?,?)')->execute($data);
            $msg = 'ok:Product added.';
        }
    } elseif ($action === 'stock') {
        $pdo->prepare('UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id = ?')->execute([(int)$_POST['delta'], $id]);
    } elseif ($action === 'toggle' && in_array($_POST['field'], ['featured', 'is_active'], true)) {
        $f = $_POST['field'];                                         // whitelisted column name
        $pdo->prepare("UPDATE products SET $f = 1 - $f WHERE id = ?")->execute([$id]);
    } elseif ($action === 'delete') {
        // order_items.product_id is ON DELETE SET NULL, so order history is preserved.
        $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
        $msg = 'ok:Product deleted.';
    }
    // Post/Redirect/Get to avoid duplicate submissions on refresh.
    $_SESSION['flash'] = $msg;
    redirect('manage_products.php' . (!empty($_GET) ? '?' . http_build_query($_GET) : ''));
}

$flash = $_SESSION['flash'] ?? '';
unset($_SESSION['flash']);

$where = [];
$args = [];
if (!empty($_GET['category']) && in_array($_GET['category'], CATS, true)) { $where[] = 'category = ?'; $args[] = $_GET['category']; }
if (($_GET['stock'] ?? '') === 'low') $where[] = 'stock BETWEEN 1 AND 6';
if (($_GET['stock'] ?? '') === 'out') $where[] = 'stock = 0';
if (($_GET['stock'] ?? '') === 'hidden') $where[] = 'is_active = 0';
$st = $pdo->prepare('SELECT * FROM products' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY created_at DESC');
$st->execute($args);
$products = $st->fetchAll();

admin_header('Products', 'products'); ?>
<div class="head">
  <div><h1>Products</h1><p class="muted"><?= count($products) ?> shown · prices in ZAR incl. VAT</p></div>
  <button class="btn" data-add-product>＋ Add Product</button>
</div>
<?php if ($flash): [$type, $text] = explode(':', $flash, 2); ?><div class="alert <?= $type === 'ok' ? 'ok' : 'err' ?>"><?= e($text) ?></div><?php endif; ?>

<form class="filters" method="get">
  <input class="input" placeholder="Search products…" data-filter-table="#products-table">
  <select name="category" data-autosubmit><option value="">All categories</option><?php foreach (CATS as $c): ?><option <?= ($_GET['category'] ?? '') === $c ? 'selected' : '' ?>><?= $c ?></option><?php endforeach; ?></select>
  <select name="stock" data-autosubmit>
    <?php foreach (['' => 'All stock', 'low' => 'Low stock (≤6)', 'out' => 'Out of stock', 'hidden' => 'Hidden'] as $v => $l): ?><option value="<?= $v ?>" <?= ($_GET['stock'] ?? '') === $v ? 'selected' : '' ?>><?= $l ?></option><?php endforeach; ?>
  </select>
</form>

<div class="table-wrap">
  <table id="products-table">
    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Visible</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($products as $p): ?>
      <tr style="<?= $p['is_active'] ? '' : 'opacity:.55' ?>">
        <td style="display:flex;gap:10px;align-items:center"><img class="thumb" src="<?= e($p['image_url']) ?>" alt=""><span><b><?= e($p['name']) ?></b><br><small class="muted">#<?= (int)$p['id'] ?> · ★ <?= e($p['rating']) ?></small></span></td>
        <td><?= e($p['category']) ?></td>
        <td><b><?= zar((int)$p['price_cents']) ?></b><?php if ($p['compare_at_cents']): ?><br><small class="muted" style="text-decoration:line-through"><?= zar((int)$p['compare_at_cents']) ?></small><?php endif; ?></td>
        <td>
          <form method="post" style="display:inline-flex;gap:4px;align-items:center"><?= csrf_field() ?><input type="hidden" name="action" value="stock"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>">
            <button class="btn light sm" name="delta" value="-1" aria-label="Decrease">−</button>
            <span class="<?= $p['stock'] < 1 ? 'stock-out' : ($p['stock'] <= 6 ? 'stock-low' : '') ?>" style="min-width:28px;text-align:center;font-weight:700"><?= (int)$p['stock'] ?></span>
            <button class="btn light sm" name="delta" value="1" aria-label="Increase">＋</button></form>
        </td>
        <?php foreach (['featured' => ['★', '☆'], 'is_active' => ['On', 'Off']] as $field => [$on, $off]): ?>
          <td><form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="field" value="<?= $field ?>"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>">
            <button class="btn sm <?= $p[$field] ? '' : 'light' ?>"><?= $p[$field] ? $on : $off ?></button></form></td>
        <?php endforeach; ?>
        <td style="white-space:nowrap">
          <button class="btn light sm" data-edit-product='<?= e(json_encode($p)) ?>'>Edit</button>
          <form method="post" style="display:inline" data-confirm="Delete “<?= e($p['name']) ?>”? Order history is kept."><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$p['id'] ?>"><button class="btn danger sm">Delete</button></form>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$products): ?><tr><td colspan="7" class="muted">No products match.</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>

<!-- Add / edit modal (populated by admin_scripts.js) -->
<dialog id="product-dialog">
  <form method="post" class="form-grid two">
    <?= csrf_field() ?><input type="hidden" name="action" value="save"><input type="hidden" name="id">
    <div class="full head"><h2 data-dialog-title>Add product</h2><button type="button" class="btn light sm" data-close-dialog>✕</button></div>
    <div class="full"><label>Name *</label><input class="input" name="name" required></div>
    <div class="full"><label>Description</label><textarea name="description" rows="3"></textarea></div>
    <div><label>Price (R) *</label><input class="input" type="number" step="0.01" min="0" name="price" required placeholder="1349.00"></div>
    <div><label>Compare-at price (R)</label><input class="input" type="number" step="0.01" min="0" name="compare_at" placeholder="Optional — shows sale"></div>
    <div><label>Category</label><select name="category"><?php foreach (CATS as $c): ?><option><?= $c ?></option><?php endforeach; ?></select></div>
    <div><label>Stock</label><input class="input" type="number" min="0" name="stock" value="10"></div>
    <div class="full"><label>Sizes (comma-separated)</label><input class="input" name="sizes" value="XS,S,M,L,XL"></div>
    <div class="full"><label>Image URL</label><input class="input" type="url" name="image_url" placeholder="https://…"></div>
    <div class="full"><img data-preview alt="" style="height:90px;border-radius:10px"></div>
    <label style="text-transform:none;letter-spacing:0;font-size:14px"><input type="checkbox" name="featured"> Featured on homepage</label>
    <label style="text-transform:none;letter-spacing:0;font-size:14px"><input type="checkbox" name="is_active" checked> Visible in store</label>
    <div class="full"><button class="btn" style="width:100%;justify-content:center">Save Product</button></div>
  </form>
</dialog>
<?php admin_footer();
