<?php
/**
 * Storefront header / footer / bag drawer shared by all /main PHP pages.
 * (index.html contains the same markup statically.)
 */
function store_header(string $title, string $active = ''): void
{
    $u = current_user();
    $nav = [
        'home' => ['index.html', 'Home'],
        'shop' => ['products.php', 'Shop All'],
        'dresses' => ['products.php?category=Dresses', 'Dresses'],
        'tops' => ['products.php?category=Tops', 'Tops'],
        'accessories' => ['products.php?category=Accessories', 'Accessories'],
        'contact' => ['contact.php', 'Contact'],
    ];
    ?>
<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($title) ?> · Sarah's Boutique</title>
  <meta name="description" content="Sarah's Boutique — family-owned fashion boutique in Cape Town. Shop online in Rand with secure Visa & Mastercard payments.">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="announce"><div class="container">
  <span>✿ Free courier delivery over R1,000 · Family-owned since 1998 · Cape Town</span>
  <span><a href="tel:+27214220198">+27 21 422 0198</a> · <a href="../admin/index.php">Admin</a></span>
</div></div>
<header class="site-header">
  <div class="container bar">
    <button class="icon-btn menu-toggle" data-toggle-menu aria-label="Menu">☰</button>
    <a href="index.html" class="logo">
      <span class="logo-mark">✿</span>
      <span><span class="logo-name">Sarah's Boutique</span><span class="logo-sub">Est. 1998 · Cape Town</span></span>
    </a>
    <nav class="nav">
      <?php foreach ($nav as $key => [$href, $label]): ?>
        <a href="<?= e($href) ?>" class="<?= $key === $active ? 'active' : '' ?>"><?= e($label) ?></a>
      <?php endforeach; ?>
    </nav>
    <div class="header-actions">
      <button class="icon-btn" data-toggle-search aria-label="Search">⌕</button>
      <a class="icon-btn" href="account.php" aria-label="Account">👤 <small><?= $u ? e(explode(' ', $u['name'])[0]) : '' ?></small></a>
      <button class="icon-btn bag-btn" data-open-bag aria-label="Open bag">👜<span class="bag-count hidden" data-bag-count>0</span></button>
    </div>
  </div>
  <div class="search-row hidden" data-search-row>
    <form action="products.php" method="get">
      <input class="input pill" name="q" placeholder="Search dresses, knits, denim…" aria-label="Search">
      <button class="btn btn-rose btn-sm">Search</button>
    </form>
  </div>
  <nav class="mobile-nav" data-mobile-nav>
    <?php foreach ($nav as [$href, $label]): ?><a href="<?= e($href) ?>"><?= e($label) ?></a><?php endforeach; ?>
    <a href="account.php"><?= $u ? 'My Account' : 'Sign in / Register' ?></a>
  </nav>
</header>
<main>
<?php
}

function store_footer(): void
{
    ?>
</main>
<footer class="site-footer">
  <div class="container perks">
    <div><strong>🚚 Free Delivery</strong><span>Courier orders over R1,000</span></div>
    <div><strong>↺ Easy Returns</strong><span>30-day hassle-free returns</span></div>
    <div><strong>🔒 Secure Checkout</strong><span>Payments by Stripe</span></div>
    <div><strong>💳 Visa & Mastercard</strong><span>3D Secure protected</span></div>
  </div>
  <div class="container footer-cols">
    <div>
      <div class="logo"><span class="logo-mark">✿</span><span class="logo-name">Sarah's Boutique</span></div>
      <p class="muted" style="color:rgba(253,248,243,.65)">A small, family-owned clothing store on Kloof Street since 1998. Curated fashion, honest Rand prices, and service that treats you like family.</p>
    </div>
    <div><h4>Shop</h4><ul>
      <li><a href="products.php">Shop All</a></li><li><a href="products.php?category=Dresses">Dresses</a></li>
      <li><a href="products.php?category=Tops">Tops & Knitwear</a></li><li><a href="products.php?category=Bottoms">Bottoms & Denim</a></li>
      <li><a href="products.php?category=Accessories">Accessories</a></li></ul></div>
    <div><h4>Customer Care</h4><ul>
      <li><a href="account.php">My Account & Orders</a></li><li><a href="checkout.php">Checkout</a></li>
      <li><a href="contact.php">Contact Us</a></li><li><a href="contact.php?type=feedback">Leave Feedback</a></li></ul></div>
    <div><h4>Visit Us</h4><ul>
      <li>84 Kloof Street, Gardens, Cape Town, 8001</li><li>+27 21 422 0198</li>
      <li>hello@sarahsboutique.co.za</li><li>Mon–Fri 9:00–18:00 · Sat 9:00–15:00</li></ul></div>
  </div>
  <div class="container footer-bottom">
    <span>© <?= date('Y') ?> Sarah's Boutique (Pty) Ltd · All prices in ZAR incl. 15% VAT</span>
    <span class="cards"><span class="card-visa">VISA</span><span class="card-mc"><i></i><i></i></span><span class="card-stripe">stripe</span></span>
  </div>
</footer>
<?php store_drawer(); ?>
<script src="scripts.js"></script>
</body>
</html>
<?php
}

/** Slide-over shopping bag (contents rendered by scripts.js from localStorage). */
function store_drawer(): void
{
    ?>
<div class="overlay" data-overlay></div>
<aside class="drawer" data-drawer aria-label="Shopping bag">
  <div class="drawer-head" style="display:flex;justify-content:space-between;align-items:center">
    <h2 style="font-size:20px">Your Bag</h2>
    <button class="icon-btn" data-close-bag aria-label="Close">✕</button>
  </div>
  <div class="drawer-head" style="background:#fff">
    <small data-ship-msg></small>
    <div class="progress"><div data-ship-bar style="width:0"></div></div>
  </div>
  <div class="drawer-body" data-bag-lines></div>
  <div class="drawer-foot">
    <div class="summary-row total"><span>Subtotal</span><span data-bag-total>R0.00</span></div>
    <p class="muted" style="font-size:12px;margin:4px 0 12px">Prices include 15% VAT. Delivery calculated at checkout.</p>
    <a href="checkout.php" class="btn btn-rose" style="width:100%">🔒 Checkout</a>
  </div>
</aside>
<div class="toast" data-toast></div>
<?php
}

/** Product card markup (server-rendered pages). */
function product_card(array $p): string
{
    $sale = $p['compare_at_cents'] && $p['compare_at_cents'] > $p['price_cents'];
    $json = e(json_encode([
        'id' => (int)$p['id'], 'name' => $p['name'], 'image' => $p['image_url'],
        'price' => (int)$p['price_cents'], 'stock' => (int)$p['stock'],
    ]));
    ob_start(); ?>
  <article class="card">
    <a href="products.php?id=<?= (int)$p['id'] ?>" class="card-img">
      <img src="<?= e($p['image_url']) ?>" alt="<?= e($p['name']) ?>" loading="lazy">
      <?php if ($sale): ?><span class="tag sale">Sale</span><?php endif; ?>
      <?php if ($p['stock'] > 0 && $p['stock'] <= 6): ?><span class="tag low">Only <?= (int)$p['stock'] ?> left</span><?php endif; ?>
      <span class="tag cat"><?= e($p['category']) ?></span>
    </a>
    <div class="card-body">
      <span class="rating">★ <?= e($p['rating']) ?></span>
      <a href="products.php?id=<?= (int)$p['id'] ?>" class="card-title"><?= e($p['name']) ?></a>
      <div class="card-foot">
        <span><span class="price"><?= zar((int)$p['price_cents']) ?></span><?php if ($sale): ?><span class="was"><?= zar((int)$p['compare_at_cents']) ?></span><?php endif; ?></span>
        <button class="btn btn-dark btn-sm" data-add='<?= $json ?>' <?= $p['stock'] < 1 ? 'disabled' : '' ?>>Add</button>
      </div>
    </div>
  </article>
<?php
    return (string)ob_get_clean();
}
