/* =====================================================================
   Sarah's Boutique — Admin portal JavaScript
   - Mobile sidebar toggle
   - Confirm dialogs for destructive actions (data-confirm)
   - Product edit modal (<dialog>) populated from data-product JSON
   - Live table filtering (data-filter-table)
   - Auto-submit selects (data-autosubmit)
   ===================================================================== */
(function () {
  "use strict";

  // Mobile sidebar
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-toggle-sidebar]")) {
      document.querySelector("[data-sidebar]").classList.toggle("open");
    }
  });

  // Confirm before delete / destructive submits
  document.addEventListener("submit", function (e) {
    var msg = e.target.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  // Auto-submit (e.g. order status dropdowns)
  document.querySelectorAll("[data-autosubmit]").forEach(function (el) {
    el.addEventListener("change", function () { el.form.submit(); });
  });

  // Instant client-side table search
  document.querySelectorAll("[data-filter-table]").forEach(function (input) {
    var table = document.querySelector(input.getAttribute("data-filter-table"));
    if (!table) return;
    input.addEventListener("input", function () {
      var q = input.value.toLowerCase();
      table.querySelectorAll("tbody tr").forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none";
      });
    });
  });

  // Product add/edit modal
  var dialog = document.getElementById("product-dialog");
  if (dialog) {
    var form = dialog.querySelector("form");
    var title = dialog.querySelector("[data-dialog-title]");
    var preview = dialog.querySelector("[data-preview]");

    function fill(p) {
      form.reset();
      form.elements.id.value = p ? p.id : "";
      title.textContent = p ? "Edit product #" + p.id : "Add product";
      if (p) {
        form.elements.name.value = p.name;
        form.elements.description.value = p.description;
        form.elements.price.value = (p.price_cents / 100).toFixed(2);
        form.elements.compare_at.value = p.compare_at_cents ? (p.compare_at_cents / 100).toFixed(2) : "";
        form.elements.category.value = p.category;
        form.elements.stock.value = p.stock;
        form.elements.sizes.value = p.sizes;
        form.elements.image_url.value = p.image_url;
        form.elements.featured.checked = p.featured == 1;
        form.elements.is_active.checked = p.is_active == 1;
      } else {
        form.elements.is_active.checked = true;
      }
      if (preview) preview.src = form.elements.image_url.value || "";
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-edit-product]");
      if (btn) { fill(JSON.parse(btn.getAttribute("data-edit-product"))); dialog.showModal(); }
      if (e.target.closest("[data-add-product]")) { fill(null); dialog.showModal(); }
      if (e.target.closest("[data-close-dialog]")) dialog.close();
    });
    form.elements.image_url.addEventListener("input", function () { if (preview) preview.src = this.value; });
  }
})();
