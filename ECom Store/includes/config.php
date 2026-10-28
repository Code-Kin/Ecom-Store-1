<?php
/**
 * Sarah's Boutique — shared configuration & helpers (used by /main and /admin).
 *
 * Secrets are read from environment variables (set them in your Apache/Nginx vhost,
 * php-fpm pool, or hosting control panel). NEVER commit real keys to the codebase.
 *
 *   DB_HOST, DB_NAME, DB_USER, DB_PASS
 *   STRIPE_SECRET_KEY        sk_live_... / sk_test_...
 *   STRIPE_WEBHOOK_SECRET    whsec_...
 *   APP_URL                  https://www.sarahsboutique.co.za
 */

declare(strict_types=1);

// ---------------------------------------------------------------- Settings
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'sarahs_boutique');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

define('STRIPE_SECRET_KEY', getenv('STRIPE_SECRET_KEY') ?: '');
define('STRIPE_WEBHOOK_SECRET', getenv('STRIPE_WEBHOOK_SECRET') ?: '');
define('APP_URL', rtrim(getenv('APP_URL') ?: '', '/'));

define('CURRENCY', 'zar');
define('FREE_DELIVERY_CENTS', 100000);   // free courier delivery over R1,000
define('DELIVERY_CENTS', 9900);          // otherwise R99
define('VAT_RATE', 0.15);                // SA VAT — prices are VAT-inclusive
define('ACCEPTED_CARD_BRANDS', ['visa', 'mastercard']);

// --------------------------------------------------- Secure session cookies
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,                                   // not readable by JS
        'samesite' => 'Lax',                                  // CSRF mitigation
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}

// Basic security headers
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// ---------------------------------------------------------------- Database
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,   // real prepared statements (SQL-injection safe)
        ]);
    }
    return $pdo;
}

// ----------------------------------------------------------------- Helpers
/** Escape output for HTML (XSS protection). */
function e($value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

/** Format cents as South African Rand, e.g. R1,349.00 */
function zar(int $cents): string
{
    return 'R' . number_format($cents / 100, 2, '.', ',');
}

/** VAT portion contained in a VAT-inclusive amount. */
function vat_included(int $cents): int
{
    return (int)round($cents * VAT_RATE / (1 + VAT_RATE));
}

function delivery_for(int $subtotalCents): int
{
    return $subtotalCents >= FREE_DELIVERY_CENTS ? 0 : DELIVERY_CENTS;
}

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function redirect(string $url): void
{
    header('Location: ' . $url);
    exit;
}

function base_url(): string
{
    if (APP_URL !== '') return APP_URL;
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    return $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

// -------------------------------------------------------------------- CSRF
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">';
}

function csrf_check(): void
{
    $sent = $_POST['csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($sent) || !hash_equals(csrf_token(), $sent)) {
        http_response_code(419);
        exit('Security token expired. Please go back and try again.');
    }
}

// -------------------------------------------------------------------- Auth
function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) return null;
    static $user = false;
    if ($user === false) {
        $st = db()->prepare('SELECT id, name, email, role, phone, address, city, postal_code FROM users WHERE id = ?');
        $st->execute([$_SESSION['user_id']]);
        $user = $st->fetch() ?: null;
    }
    return $user;
}

function login_user(array $user): void
{
    session_regenerate_id(true);           // prevent session fixation
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['role'] = $user['role'];
}

function logout_user(): void
{
    $_SESSION = [];
    session_destroy();
}

/** Guard for every admin page — only role=admin may continue. */
function require_admin(): array
{
    $u = current_user();
    if (!$u || $u['role'] !== 'admin') redirect('index.php?login=1');
    return $u;
}

// ------------------------------------------------------------------ Stripe
/**
 * Minimal Stripe REST client using cURL (no Composer dependency needed).
 * Docs: https://docs.stripe.com/api
 */
function stripe_request(string $method, string $path, array $params = []): array
{
    if (STRIPE_SECRET_KEY === '') {
        throw new RuntimeException('Stripe is not configured. Set the STRIPE_SECRET_KEY environment variable.');
    }
    $url = 'https://api.stripe.com/v1/' . ltrim($path, '/');
    $ch = curl_init();
    if ($method === 'GET' && $params) $url .= '?' . http_build_query($params);
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => STRIPE_SECRET_KEY . ':',
        CURLOPT_TIMEOUT        => 30,
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    }
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode((string)$body, true) ?: [];
    if ($code >= 400) {
        throw new RuntimeException($data['error']['message'] ?? 'Stripe request failed.');
    }
    return $data;
}

/** Verify a Stripe webhook signature (Stripe-Signature header). */
function stripe_verify_webhook(string $payload, string $header, string $secret, int $tolerance = 300): bool
{
    $parts = [];
    foreach (explode(',', $header) as $kv) {
        [$k, $v] = array_pad(explode('=', trim($kv), 2), 2, '');
        $parts[$k][] = $v;
    }
    $ts = (int)($parts['t'][0] ?? 0);
    if (!$ts || abs(time() - $ts) > $tolerance) return false;
    $expected = hash_hmac('sha256', $ts . '.' . $payload, $secret);
    foreach ($parts['v1'] ?? [] as $sig) {
        if (hash_equals($expected, $sig)) return true;
    }
    return false;
}

/**
 * Finalise an order after Stripe Checkout (idempotent — safe to call from the
 * success redirect AND the webhook). Enforces Visa/Mastercard only: any other
 * card brand is refunded automatically.
 * Returns [bool ok, string message, ?int orderId].
 */
function finalize_stripe_session(string $sessionId): array
{
    $session = stripe_request('GET', 'checkout/sessions/' . urlencode($sessionId), [
        'expand' => ['payment_intent.latest_charge'],
    ]);
    $orderId = (int)($session['metadata']['order_id'] ?? 0);
    if (!$orderId) return [false, 'Order reference missing.', null];

    $pdo = db();
    $st = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $st->execute([$orderId]);
    $order = $st->fetch();
    if (!$order) return [false, 'Order not found.', null];
    if ($order['payment_status'] === 'paid') return [true, 'Already confirmed.', $orderId];
    if (($session['payment_status'] ?? '') !== 'paid') return [false, 'Payment has not been completed.', $orderId];

    $pi     = $session['payment_intent'] ?? [];
    $charge = is_array($pi['latest_charge'] ?? null) ? $pi['latest_charge'] : [];
    $card   = $charge['payment_method_details']['card'] ?? [];
    $brand  = strtolower($card['brand'] ?? '');

    if (!in_array($brand, ACCEPTED_CARD_BRANDS, true)) {
        // Not Visa/Mastercard → refund in full and cancel the order.
        try { stripe_request('POST', 'refunds', ['payment_intent' => $pi['id'] ?? '']); } catch (Throwable $t) { /* logged by Stripe */ }
        $pdo->prepare("UPDATE orders SET status='cancelled', payment_status='refunded', notes=? WHERE id=?")
            ->execute(["Refunded: {$brand} not accepted (Visa/Mastercard only)", $orderId]);
        return [false, 'Sorry, we only accept Visa and Mastercard. Your payment has been refunded in full.', $orderId];
    }

    $pdo->beginTransaction();
    $pdo->prepare("UPDATE orders SET payment_status='paid', status='processing', stripe_payment_id=?, card_brand=?, card_last4=? WHERE id=?")
        ->execute([$pi['id'] ?? null, $brand, $card['last4'] ?? null, $orderId]);
    // Decrement stock now that payment is confirmed.
    $items = $pdo->prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?');
    $items->execute([$orderId]);
    $dec = $pdo->prepare('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?');
    foreach ($items->fetchAll() as $it) {
        if ($it['product_id']) $dec->execute([$it['quantity'], $it['product_id']]);
    }
    $pdo->commit();
    return [true, 'Payment confirmed.', $orderId];
}
