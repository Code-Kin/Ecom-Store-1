/* =====================================================================
   Sarah's Boutique — storefront JavaScript (vanilla, no dependencies)
   - Shopping bag stored in localStorage (prices are re-validated server-side)
   - Bag drawer, header search, mobile menu, toast notifications
   - Renders product grids on index.html from products.php?action=list
   ===================================================================== */
(function () {
  "use strict";

  var CART_KEY = "sb_cart";
  var FREE_DELIVERY = 100000; // R1,000 in cents
  var DELIVERY = 9900;        // R99 in cents

  /** Format cents as South African Rand: R1,349.00 */
  function zar(cents) {
    return "R" + (Number(cents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ------------------------------------------------------------- Cart store
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveCart(lines) {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
    renderCart();
  }
  function addToCart(item, size, qty) {
    size = size || "M";
    qty = Math.max(1, parseInt(qty || 1, 10));
    var lines = getCart();
    var key = item.id + ":" + size;
    var found = lines.find(function (l) { return l.key === key; });
    if (found) found.qty = Math.min(item.stock || 99, found.qty + qty);
    else lines.push({ key: key, id: item.id, name: item.name, image: item.image, price: item.price, stock: item.stock, size: size, qty: qty });
    saveCart(lines);
    toast("Added to bag — " + item.name);
    openBag();
  }
  function updateQty(key, delta) {
    var lines = getCart().map(function (l) {
      if (l.key === key) l.qty = Math.min(l.stock || 99, l.qty + delta);
      return l;
    }).filter(function (l) { return l.qty > 0; });
    saveCart(lines);
  }
  function cartTotal(lines) {
    return lines.reduce(function (s, l) { return s + l.price * l.qty; }, 0);
  }

  // ------------------------------------------------------------ Bag drawer
  function renderCart() {
    var lines = getCart();
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);
    var total = cartTotal(lines);

    $all("[data-bag-count]").forEach(function (el) {
      el.textContent = count;
      el.classList.toggle("hidden", count === 0);
    });
    var totalEl = $("[data-bag-total]");
    if (totalEl) totalEl.textContent = zar(total);

    var msg = $("[data-ship-msg]");
    var bar = $("[data-ship-bar]");
    if (msg) msg.textContent = total >= FREE_DELIVERY ? "🎉 You've unlocked FREE courier delivery!" : "You're " + zar(FREE_DELIVERY - total) + " away from free delivery";
    if (bar) bar.style.width = Math.min(100, (total / FREE_DELIVERY) * 100) + "%";

    var box = $("[data-bag-lines]");
    if (!box) return;
    if (!lines.length) {
      box.innerHTML = '<div style="text-align:center;padding:60px 0"><p class="display" style="font-size:22px">Your bag is empty</p><p class="muted">Beautiful things await.</p><a class="btn btn-dark" href="products.php">Start Shopping</a></div>';
      return;
    }
    box.innerHTML = lines.map(function (l) {
      return '<div class="line"><img src="' + esc(l.image) + '" alt="">' +
        '<div style="flex:1;display:flex;flex-direction:column"><strong style="font-size:14.5px">' + esc(l.name) + '</strong>' +
        '<small class="muted">Size ' + esc(l.size) + '</small>' +
        '<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">' +
        '<span class="qty"><button data-qty="' + esc(l.key) + '" data-d="-1" aria-label="Decrease">−</button><b>' + l.qty + '</b><button data-qty="' + esc(l.key) + '" data-d="1" aria-label="Increase">+</button></span>' +
        '<strong class="price" style="font-size:15px">' + zar(l.price * l.qty) + '</strong></div></div></div>';
    }).join("");
  }
  function openBag() {
    var d = $("[data-drawer]"), o = $("[data-overlay]");
    if (d) d.classList.add("open");
    if (o) o.classList.add("open");
  }
  function closeBag() {
    var d = $("[data-drawer]"), o = $("[data-overlay]");
    if (d) d.classList.remove("open");
    if (o) o.classList.remove("open");
  }

  // ----------------------------------------------------------------- Toast
  var toastTimer;
  function toast(text) {
    var t = $("[data-toast]");
    if (!t) return;
    t.textContent = "✓ " + text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  // ------------------------------------------------- Product grid (JSON API)
  function cardHtml(p) {
    var sale = p.compare_at_cents && p.compare_at_cents > p.price_cents;
    var data = esc(JSON.stringify({ id: p.id, name: p.name, image: p.image_url, price: p.price_cents, stock: p.stock }));
    return '<article class="card"><a href="products.php?id=' + p.id + '" class="card-img"><img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      (sale ? '<span class="tag sale">Sale</span>' : "") + '<span class="tag cat">' + esc(p.category) + '</span></a>' +
      '<div class="card-body"><span class="rating">★ ' + esc(p.rating) + '</span><a class="card-title" href="products.php?id=' + p.id + '">' + esc(p.name) + '</a>' +
      '<div class="card-foot"><span><span class="price">' + zar(p.price_cents) + '</span>' + (sale ? '<span class="was">' + zar(p.compare_at_cents) + "</span>" : "") + '</span>' +
      '<button class="btn btn-dark btn-sm" data-add="' + data + '"' + (p.stock < 1 ? " disabled" : "") + '>Add</button></div></div></article>';
  }
  function loadGrids() {
    $all("[data-products]").forEach(function (grid) {
      var qs = grid.getAttribute("data-products") || "";
      fetch("products.php?action=list&" + qs)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          grid.innerHTML = (d.products || []).map(cardHtml).join("") || '<p class="muted">No products yet.</p>';
        })
        .catch(function () { grid.innerHTML = '<p class="muted">Could not load products.</p>'; });
    });
  }

  // -------------------------------------------------------- Checkout page
  function initCheckout() {
    var form = $("[data-checkout-form]");
    if (!form) return;
    var lines = getCart();
    var input = $("[name=cart_json]", form);
    if (input) input.value = JSON.stringify(lines.map(function (l) { return { id: l.id, size: l.size, qty: l.qty }; }));

    var list = $("[data-checkout-lines]");
    var subtotal = cartTotal(lines);
    var delivery = subtotal >= FREE_DELIVERY || subtotal === 0 ? 0 : DELIVERY;
    if (list) {
      list.innerHTML = lines.length ? lines.map(function (l) {
        return '<div class="line" style="align-items:center"><img src="' + esc(l.image) + '" alt="" style="width:48px;height:60px">' +
          '<div style="flex:1"><strong style="font-size:13.5px">' + esc(l.name) + '</strong><br><small class="muted">Size ' + esc(l.size) + " × " + l.qty + "</small></div>" +
          "<strong>" + zar(l.price * l.qty) + "</strong></div>";
      }).join("") : '<p class="muted">Your bag is empty. <a class="link-rose" href="products.php">Shop now</a></p>';
    }
    var set = function (sel, val) { var el = $(sel); if (el) el.textContent = val; };
    set("[data-co-subtotal]", zar(subtotal));
    set("[data-co-delivery]", delivery ? zar(delivery) : "FREE");
    set("[data-co-total]", zar(subtotal + delivery));
    set("[data-co-vat]", zar(Math.round((subtotal * 15) / 115)));
    var payBtn = $("[data-pay-btn]");
    if (payBtn) {
      payBtn.textContent = "🔒 Pay " + zar(subtotal + delivery) + " with Stripe";
      payBtn.disabled = !lines.length;
    }
    form.addEventListener("submit", function () {
      if (payBtn) { payBtn.disabled = true; payBtn.textContent = "Redirecting to Stripe…"; }
    });
  }

  // ---------------------------------------------------------------- Events
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    var add = t.closest("[data-add]");
    if (add) {
      e.preventDefault();
      var item = JSON.parse(add.getAttribute("data-add"));
      var sizeInput = document.querySelector("input[name=size]:checked");
      var qtyInput = document.querySelector("[data-qty-input]");
      addToCart(item, sizeInput ? sizeInput.value : "M", qtyInput ? qtyInput.value : 1);
      return;
    }
    var q = t.closest("[data-qty]");
    if (q) { updateQty(q.getAttribute("data-qty"), parseInt(q.getAttribute("data-d"), 10)); return; }
    if (t.closest("[data-open-bag]")) { openBag(); return; }
    if (t.closest("[data-close-bag]") || t.closest("[data-overlay]")) { closeBag(); return; }
    if (t.closest("[data-toggle-search]")) { var s = $("[data-search-row]"); if (s) s.classList.toggle("hidden"); return; }
    if (t.closest("[data-toggle-menu]")) { var m = $("[data-mobile-nav]"); if (m) m.classList.toggle("open"); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBag(); });

  // Clear the bag after a confirmed Stripe payment (success page sets this flag).
  if (document.body.hasAttribute("data-clear-cart")) localStorage.removeItem(CART_KEY);

  renderCart();
  loadGrids();
  initCheckout();

  window.SB = { addToCart: addToCart, getCart: getCart, zar: zar };
})();
