<?php
/**
 * contact.php — contact form + customer feedback (stored in `messages`, managed in /admin).
 * ?type=feedback opens the feedback tab.
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/store_layout.php';

$type = ($_GET['type'] ?? $_POST['type'] ?? 'contact') === 'feedback' ? 'feedback' : 'contact';
$u = current_user();
$form = ['name' => $u['name'] ?? '', 'email' => $u['email'] ?? '', 'subject' => '', 'message' => '', 'rating' => '5'];
$error = '';
$sent = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    foreach ($form as $k => $_) $form[$k] = trim((string)($_POST[$k] ?? ''));
    // Simple honeypot field to stop spam bots.
    if (!empty($_POST['website'])) { $sent = true; }
    elseif ($form['name'] === '' || $form['message'] === '') $error = 'Please fill in your name and message.';
    elseif (!filter_var($form['email'], FILTER_VALIDATE_EMAIL)) $error = 'Please enter a valid email address.';
    else {
        db()->prepare('INSERT INTO messages (name, email, subject, message, type, rating) VALUES (?,?,?,?,?,?)')->execute([
            mb_substr($form['name'], 0, 120), $form['email'], mb_substr($form['subject'], 0, 200), mb_substr($form['message'], 0, 5000),
            $type, $type === 'feedback' ? max(1, min(5, (int)$form['rating'])) : null,
        ]);
        $sent = true;
        $form['subject'] = $form['message'] = '';
    }
}

store_header('Contact & Feedback', 'contact'); ?>
<div class="container" style="padding-top:32px">
  <span class="eyebrow">We'd love to hear from you</span>
  <h1 style="font-size:40px;margin-top:4px">Contact & Feedback</h1>
  <p style="color:var(--cocoa);max-width:640px">Questions about sizing, orders or returns — or just want to tell us how much you love your new dress? A real family member replies within one business day.</p>

  <div class="checkout">
    <div class="panel">
      <div style="display:flex;gap:8px;margin-bottom:18px">
        <a class="btn btn-sm <?= $type === 'contact' ? 'btn-dark' : 'btn-outline' ?>" href="contact.php">✉ Contact Us</a>
        <a class="btn btn-sm <?= $type === 'feedback' ? 'btn-dark' : 'btn-outline' ?>" href="contact.php?type=feedback">♡ Leave Feedback</a>
      </div>
      <?php if ($sent): ?><div class="alert alert-ok">✓ Thank you! We've received your <?= $type === 'feedback' ? 'feedback' : 'message' ?> and will be in touch soon.</div><?php endif; ?>
      <?php if ($error): ?><div class="alert alert-error"><?= e($error) ?></div><?php endif; ?>
      <form method="post" class="form-grid two">
        <?= csrf_field() ?>
        <input type="hidden" name="type" value="<?= $type ?>">
        <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
        <div><label class="lbl">Your name *</label><input class="input" name="name" required value="<?= e($form['name']) ?>"></div>
        <div><label class="lbl">Email *</label><input class="input" type="email" name="email" required value="<?= e($form['email']) ?>"></div>
        <div class="full"><label class="lbl">Subject</label><input class="input" name="subject" value="<?= e($form['subject']) ?>" placeholder="<?= $type === 'feedback' ? 'e.g. Love my new jersey!' : 'e.g. Question about order #1024' ?>"></div>
        <?php if ($type === 'feedback'): ?>
          <div class="full"><label class="lbl">Your rating</label>
            <select class="input" name="rating"><?php for ($i = 5; $i >= 1; $i--): ?><option value="<?= $i ?>" <?= (int)$form['rating'] === $i ? 'selected' : '' ?>><?= str_repeat('★', $i) . str_repeat('☆', 5 - $i) ?></option><?php endfor; ?></select></div>
        <?php endif; ?>
        <div class="full"><label class="lbl">Message *</label><textarea class="input" name="message" rows="5" required><?= e($form['message']) ?></textarea></div>
        <div class="full"><button class="btn btn-rose">➤ <?= $type === 'feedback' ? 'Submit Feedback' : 'Send Message' ?></button></div>
      </form>
    </div>
    <aside>
      <div class="panel" style="background:var(--ink);color:var(--cream)">
        <h2 style="font-size:22px">Visit the Store</h2>
        <p>📍 84 Kloof Street, Gardens<br>Cape Town, 8001</p>
        <p>📞 <a href="tel:+27214220198">+27 21 422 0198</a><br>✉ hello@sarahsboutique.co.za</p>
        <p>🕘 Mon–Fri 9:00–18:00<br>Sat 9:00–15:00 · Sun & public holidays closed</p>
      </div>
      <div class="panel" style="margin-top:16px">
        <h2 style="font-size:20px">Quick Answers</h2>
        <p><strong>Delivery?</strong><br><span class="muted">Courier nationwide in 2–4 working days. Free over R1,000, otherwise R99.</span></p>
        <p><strong>Returns?</strong><br><span class="muted">30 days, no questions asked — in store or by courier.</span></p>
        <p><strong>Payment?</strong><br><span class="muted">Visa and Mastercard, securely processed by Stripe with 3D Secure.</span></p>
      </div>
    </aside>
  </div>
</div>
<?php store_footer();
