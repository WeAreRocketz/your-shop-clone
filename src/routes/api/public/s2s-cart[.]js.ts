import { createFileRoute } from "@tanstack/react-router";

// Public storefront script. Loaded by Shopify vitrine stores via Script Tag.
// Reads window.S2SConfig = { workspace_id, vitrine_store_id, api_base }.

const SCRIPT = `(function(){
  var cfg = window.S2SConfig || {};
  var API = cfg.api_base || "";
  var STORAGE_KEY = "s2s_cart";
  var ATTR_KEY = "s2s_attr";
  var SETTINGS = { position: "bottom-right", primary_color: "#6366f1", button_text: "Finalizar compra", show_target_store: false };

  function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); }catch(e){ return []; } }
  function save(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); render(); }
  function fmt(c){ return "R$ "+ (Number(c)||0).toFixed(2); }

  // ===== Attribution capture (fbclid/gclid/ttclid/_fbp/_fbc/_ttp) =====
  function getCookie(name){
    var m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\\[\\]\\\\/\\+^])/g,'\\\\$1') + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : undefined;
  }
  function captureAttribution(){
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(ATTR_KEY)||"{}"); } catch(e){}
    var qs = new URLSearchParams(window.location.search);
    var fbclid = qs.get("fbclid"); if (fbclid) stored.fbclid = fbclid;
    var gclid  = qs.get("gclid");  if (gclid)  stored.gclid  = gclid;
    var ttclid = qs.get("ttclid"); if (ttclid) stored.ttclid = ttclid;
    var fbp = getCookie("_fbp"); if (fbp) stored.fbp = fbp;
    var fbc = getCookie("_fbc"); if (fbc) stored.fbc = fbc;
    var ttp = getCookie("_ttp"); if (ttp) stored.ttp = ttp;
    // Build fbc from fbclid if missing
    if (!stored.fbc && stored.fbclid) stored.fbc = "fb.1." + Date.now() + "." + stored.fbclid;
    localStorage.setItem(ATTR_KEY, JSON.stringify(stored));
    return stored;
  }
  function getAttribution(){
    try { return JSON.parse(localStorage.getItem(ATTR_KEY)||"{}"); } catch(e){ return {}; }
  }
  function uuid(){ return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){ return (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16); }); }

  function track(eventName, custom){
    if (!cfg.workspace_id || !cfg.vitrine_store_id) return;
    fetch(API + "/api/public/s2s-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        workspace_id: cfg.workspace_id,
        vitrine_store_id: cfg.vitrine_store_id,
        event_name: eventName,
        event_id: uuid(),
        event_source_url: window.location.href,
        attribution: getAttribution(),
        custom: custom || {}
      })
    }).catch(function(){});
  }

  captureAttribution();
  track("PageView", {});

  // Fetch settings + Shopify variant info
  function fetchVariant(id, cb){
    fetch("/products.json?limit=250").then(function(){}); // warm
    fetch("/variants/"+id+".js").then(function(r){return r.json();}).then(cb).catch(function(){ cb(null); });
  }

  function addItem(variantId, qty){
    fetchVariant(variantId, function(v){
      var items = load();
      var existing = items.find(function(i){ return String(i.variant_id) === String(variantId); });
      if (existing) { existing.quantity += qty; }
      else {
        items.push({
          variant_id: variantId,
          product_id: v && v.product_id,
          title: v ? (v.name || v.title) : ("Variante "+variantId),
          variant_title: v && v.public_title,
          price: v ? (v.price/100) : 0,
          image: v && v.featured_image && v.featured_image.url,
          quantity: qty
        });
      }
      save(items);
      track("AddToCart", {
        currency: "BRL",
        value: (v ? v.price/100 : 0) * qty,
        content_ids: [String(variantId)],
        contents: [{ id: String(variantId), quantity: qty, item_price: v ? v.price/100 : 0 }],
        num_items: qty
      });
      openPanel();
    });
  }

  function removeItem(vid){ save(load().filter(function(i){ return String(i.variant_id) !== String(vid); })); }
  function setQty(vid, q){
    var items = load();
    items.forEach(function(i){ if (String(i.variant_id)===String(vid)) i.quantity = Math.max(1, q); });
    save(items);
  }

  // Intercept Shopify add-to-cart forms
  document.addEventListener("submit", function(e){
    var form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    var action = (form.getAttribute("action")||"").toLowerCase();
    if (action.indexOf("/cart/add") === -1) return;
    e.preventDefault();
    var fd = new FormData(form);
    var variantId = fd.get("id");
    var qty = parseInt(fd.get("quantity")||"1", 10) || 1;
    if (variantId) addItem(variantId, qty);
  }, true);

  // UI
  var styleEl = document.createElement("style");
  styleEl.textContent = ".s2s-btn{position:fixed;z-index:99998;width:56px;height:56px;border-radius:9999px;border:none;color:#fff;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.25);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px}"+
    ".s2s-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:9999px;min-width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 6px}"+
    ".s2s-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99998;display:none}"+
    ".s2s-panel{position:fixed;top:0;right:0;height:100%;width:380px;max-width:100vw;background:#fff;z-index:99999;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .25s ease;box-shadow:-10px 0 30px rgba(0,0,0,.2);font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111}"+
    ".s2s-panel.open{transform:translateX(0)}"+
    ".s2s-head{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #eee;font-weight:600}"+
    ".s2s-x{background:none;border:none;font-size:22px;cursor:pointer}"+
    ".s2s-items{flex:1;overflow:auto;padding:8px 16px}"+
    ".s2s-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f1f1f1}"+
    ".s2s-item img{width:56px;height:56px;object-fit:cover;border-radius:6px;background:#f3f3f3}"+
    ".s2s-qty{display:inline-flex;align-items:center;border:1px solid #ddd;border-radius:6px;margin-top:6px}"+
    ".s2s-qty button{background:none;border:none;width:26px;height:26px;cursor:pointer}"+
    ".s2s-foot{border-top:1px solid #eee;padding:16px}"+
    ".s2s-go{width:100%;border:none;color:#fff;padding:14px;border-radius:8px;font-weight:600;cursor:pointer;font-size:15px}"+
    ".s2s-target{font-size:12px;color:#666;margin-top:8px;text-align:center}";
  document.head.appendChild(styleEl);

  var btn = document.createElement("button");
  btn.className = "s2s-btn";
  btn.innerHTML = 'Carrinho<span class="s2s-badge" id="s2s-badge">0</span>';
  var overlay = document.createElement("div"); overlay.className = "s2s-overlay";
  var panel = document.createElement("div"); panel.className = "s2s-panel";
  panel.innerHTML = '<div class="s2s-head"><span>Seu carrinho</span><button class="s2s-x" id="s2s-x">&times;</button></div>'+
    '<div class="s2s-items" id="s2s-items"></div>'+
    '<div class="s2s-foot"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><span>Subtotal</span><strong id="s2s-sub"></strong></div>'+
    '<button class="s2s-go" id="s2s-go"></button>'+
    '<div class="s2s-target" id="s2s-target"></div></div>';
  document.body.appendChild(btn); document.body.appendChild(overlay); document.body.appendChild(panel);

  btn.addEventListener("click", openPanel);
  overlay.addEventListener("click", closePanel);
  panel.querySelector("#s2s-x").addEventListener("click", closePanel);

  function openPanel(){ panel.classList.add("open"); overlay.style.display="block"; render(); }
  function closePanel(){ panel.classList.remove("open"); overlay.style.display="none"; }

  function applyStyles(){
    var pos = SETTINGS.position === "bottom-left" ? "left:20px" : "right:20px";
    btn.setAttribute("style", pos + ";bottom:20px;background:" + SETTINGS.primary_color);
    var go = panel.querySelector("#s2s-go");
    go.style.background = SETTINGS.primary_color;
    go.textContent = SETTINGS.button_text || "Finalizar compra";
    panel.querySelector("#s2s-target").style.display = SETTINGS.show_target_store ? "block" : "none";
  }

  function render(){
    var items = load();
    var count = items.reduce(function(s,i){ return s + (i.quantity||0); }, 0);
    document.getElementById("s2s-badge").textContent = count;
    var sub = items.reduce(function(s,i){ return s + (i.price||0)*(i.quantity||0); }, 0);
    document.getElementById("s2s-sub").textContent = fmt(sub);
    var box = document.getElementById("s2s-items");
    if (!items.length){ box.innerHTML = '<p style="text-align:center;color:#888;padding:40px 0">Seu carrinho está vazio.</p>'; return; }
    box.innerHTML = items.map(function(i){
      return '<div class="s2s-item">'+
        '<img src="'+(i.image||"")+'" alt="">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:600;font-size:14px">'+escapeHtml(i.title||"")+'</div>'+
          (i.variant_title?'<div style="font-size:12px;color:#666">'+escapeHtml(i.variant_title)+'</div>':'')+
          '<div style="font-size:13px;margin-top:4px">'+fmt(i.price)+'</div>'+
          '<div class="s2s-qty">'+
            '<button data-act="dec" data-id="'+i.variant_id+'">-</button>'+
            '<span style="padding:0 10px">'+i.quantity+'</span>'+
            '<button data-act="inc" data-id="'+i.variant_id+'">+</button>'+
          '</div>'+
        '</div>'+
        '<button data-act="rm" data-id="'+i.variant_id+'" style="background:none;border:none;color:#999;cursor:pointer">&times;</button>'+
      '</div>';
    }).join("");
    box.querySelectorAll("button[data-act]").forEach(function(b){
      b.addEventListener("click", function(){
        var id = b.getAttribute("data-id"); var act = b.getAttribute("data-act");
        var it = load().find(function(x){ return String(x.variant_id)===String(id); });
        if (act==="rm") removeItem(id);
        else if (act==="inc") setQty(id, (it?it.quantity:1)+1);
        else if (act==="dec") setQty(id, (it?it.quantity:2)-1);
      });
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"]/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c];}); }

  document.getElementById("s2s-go").addEventListener("click", function(){
    var items = load();
    if (!items.length) return;
    var go = document.getElementById("s2s-go");
    var orig = go.textContent; go.textContent = "Processando…"; go.disabled = true;
    fetch(API + "/api/public/s2s-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: cfg.workspace_id,
        vitrine_store_id: cfg.vitrine_store_id,
        items: items,
        attribution: getAttribution(),
        event_source_url: window.location.href
      })
    }).then(function(r){ return r.json(); }).then(function(d){
      if (d && d.checkout_url) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = d.checkout_url;
      } else {
        alert((d && d.error) || "Não foi possível iniciar o checkout.");
        go.textContent = orig; go.disabled = false;
      }
    }).catch(function(){ alert("Erro de conexão"); go.textContent = orig; go.disabled = false; });
  });

  // Load settings then render
  fetch(API + "/api/public/s2s-settings?workspace_id=" + encodeURIComponent(cfg.workspace_id||""))
    .then(function(r){ return r.json(); })
    .then(function(s){ if (s && s.cart) Object.assign(SETTINGS, s.cart); applyStyles(); render(); })
    .catch(function(){ applyStyles(); render(); });
})();`;

export const Route = createFileRoute("/api/public/s2s-cart.js")({
  server: {
    handlers: {
      GET: async () =>
        new Response(SCRIPT, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
          },
        }),
    },
  },
});