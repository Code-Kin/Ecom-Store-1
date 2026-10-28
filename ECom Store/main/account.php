<?php
/**
 * account.php — customer account management
 *   ?mode=register | login (default) | logout
 *   When signed in: profile editing + order history.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/store_layout.php';

$mode = $_GET['mode'] ?? 'login';
$next = preg_match('/^[a-z_]+\.php$/', $_GET['next'] ?? '') ? $_GET['next'] : 'account.php'; // local redirects only
$error = '';
$notice = '';

if ($mode === 'logout') { logout_user(); redirect('index.html'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';
    $pdo = db();

    if ($action === 'register') {
        $name = trim((string)$_POST['name']);
        $email = strtolower(trim((string)$_POST['email']));
        $pass = (string)$_POST['password'];
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'Please enter your name and a valid email.';
        elseif (strlen($pass) < 8) $error = 'Password must be at least 8 characters.';
        elseif ($pass !== (string)$_POST['confirm']) $error = 'Passwords do not match.';
        else {
            $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $st->execute([$email]);
            if ($st->fetch()) $error = 'An account with this email already exists.';
            else {
                $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)')
                    ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);
                login_user(['id' => $pdo->lastInsertId(), 'role' => 'customer']);
                redirect($next);
            }
        }
        $mode = 'register';
    } elseif ($action === 'login') {
        // Basic brute-force throttle per session.
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
        if ($_SESSION['login_attempts'] > 8) $error = 'Too many attempts. Please wait a few minutes.';
        else {
            $st = $pdo->prepare('SELECT * FROM users WHERE email = ?');
            $st->execute([strtolower(trim((string)$_POST['email']))]);
            $u = $st->fetch();
            if ($u && password_verify((string)$_POST['password'], $u['password_hash'])) {
                $_SESSION['login_attempts'] = 0;
                login_user($u);
                redirect($u['role'] === 'admin' && $next === 'account.php' ? '../admin/index.php' : $next);
            }
            $error = 'Invalid email or password.';
        }
    } elseif ($action === 'profile' && current_user()) {
        $pdo->prepare('UPDATE users SET name=?, phone=?, address=?, city=?, postal_code=? WHERE id=?')->execute([
            trim((string)$_POST['name']), trim((string)$_POST['phone']), trim((string)$_POST['address']),
            trim((string)$_POST['city']), substr(preg_replace('/\D/', '', (string)$_POST['postal']), 0, 4), current_user()['id'],
        ]);
        redirect('account.php?saved=1');
    }
}

$user = current_user();

// ---------------------------------------------------------- Signed-out views
if (!$user) {
    store_header($mode === 'register' ? 'Create Account' : 'Sign In'); ?>
    <div class="container" style="max-width:480px;padding:48px 16px">
      <div class="panel">
        <h1 style="font-size:30px"><?= $mode === 'register' ? 'Create Account' : 'Sign In' ?></h1>
        <p class="muted"><?= $mode === 'register' ? 'Join the boutique family — track orders and check out faster.' : 'Welcome back — good to see you again.' ?></p>
        <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>
        <form method="post" class="form-grid">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="<?= $mode === 'register' ? 'register' : 'login' ?>">
          <?php if ($mode === 'register'): ?><div><label class="lbl">Full name</label><input class="input" name="name" required></div><?php endif; ?>
          <div><label class="lbl">Email</label><input class="input" type="email" name="email" required autocomplete="email"></div>
          <div><label class="lbl">Password</label><input class="input" type="password" name="password" required autocomplete="<?= $mode === 'register' ? 'new-password' : 'current-password' ?>"></div>
          <?php if ($mode === 'register'): ?><div><label class="lbl">Confirm password</label><input class="input" type="password" name="confirm" required></div><?php endif; ?>
          <button class="btn btn-dark"><?= $mode === 'register' ? 'Create Account' : 'Sign In' ?> →</button>
        </form>
        <p style="text-align:center;font-size:14px" class="muted">
          <?= $mode === 'register'
            ? 'Already have an account? <a class="link-rose" href="account.php?next=' . e($next) . '">Sign in</a>'
            : 'New here? <a class="link-rose" href="account.php?mode=register&next=' . e($next) . '">Create an account</a>' ?>
        </p>
      </div>
    </div>
    <?php store_footer();
    exit;
}

// ----------------------------------------------------------- Signed-in view
$st = db()->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
$st->execute([$user['id']]);
$orders = $st->fetchAll();
$itemsStmt = db()->prepare('SELECT * FROM order_items WHERE order_id = ?');

store_header('My Account'); ?>
<div class="container" style="padding-top:32px">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div><span class="eyebrow">My account</span><h1 style="font-size:34px">Hello, <?= e(explode(' ', $user['name'])[0]) ?> ♡</h1><p class="muted"><?= e($user['email']) ?></p></div>
    <a class="btn btn-outline btn-sm" href="account.php?mode=logout">Sign Out</a>
  </div>
  <?php if (isset($_GET['saved'])): ?><div class="alert alert-ok">Profile saved.</div><?php endif; ?>

  <div class="checkout">
    <section class="panel" style="overflow-x:auto">
      <h2 style="font-size:22px;margin-bottom:12px">Order History</h2>
      <?php if (!$orders): ?>
        <p class="muted">No orders yet. <a class="link-rose" href="products.php">Start shopping →</a></p>
      <?php else: ?>
        <table class="table">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
          <?php foreach ($orders as $o): $itemsStmt->execute([$o['id']]); $items = $itemsStmt->fetchAll(); ?>
            <tr>
              <td><strong>#<?= (int)$o['id'] ?></strong><br><small class="muted"><?= e($o['tracking_number']) ?></small></td>
              <td><?= e(date('j M Y', strtotime($o['created_at']))) ?></td>
              <td><?php foreach ($items as $it): ?><small><?= (int)$it['quantity'] ?>× <?= e($it['product_name']) ?> (<?= e($it['size']) ?>)</small><br><?php endforeach; ?></td>
              <td><span class="status status-<?= e($o['status']) ?>"><?= e($o['status']) ?></span><br><span class="status status-<?= e($o['payment_status']) ?>" style="margin-top:4px"><?= e($o['payment_status']) ?></span></td>
              <td><strong><?= zar((int)$o['total_cents']) ?></strong></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
    <aside class="panel">
      <h2 style="font-size:22px;margin-bottom:12px">Profile & Address</h2>
      <form method="post" class="form-grid">
        <?= csrf_field() ?><input type="hidden" name="action" value="profile">
        <div><label class="lbl">Full name</label><input class="input" name="name" value="<?= e($user['name']) ?>"></div>
        <div><label class="lbl">Phone</label><input class="input" name="phone" value="<?= e($user['phone']) ?>" placeholder="+27 82 000 0000"></div>
        <div><label class="lbl">Street address</label><input class="input" name="address" value="<?= e($user['address']) ?>"></div>
        <div><label class="lbl">City</label><input class="input" name="city" value="<?= e($user['city']) ?>"></div>
        <div><label class="lbl">Postal code</label><input class="input" name="postal" maxlength="4" value="<?= e($user['postal_code']) ?>"></div>
        <button class="btn btn-dark">Save Changes</button>
      </form>
    </aside>
  </div>
</div>
<?php store_footer();
