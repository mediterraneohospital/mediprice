/* Install controls belong to the top-level shell, not its protected iframe. */
(function () {
  'use strict';
  var promptEvent = null, control = null, installed = false;
  var display = matchMedia('(display-mode:standalone)');
  var manifest = document.querySelector('link[rel="manifest"]');
  if (!manifest) return;
  var manifestUrl = new URL(manifest.href);
  var storageKey = 'mp-installed:' + manifestUrl.pathname;
  function readInstalled() {
    try { return localStorage.getItem(storageKey) === 'yes'; } catch (error) { return false; }
  }
  function standalone() { return display.matches || navigator.standalone === true; }
  function appleDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function markInstalled() {
    installed = true;
    try { localStorage.setItem(storageKey, 'yes'); } catch (error) {}
    if (control) control.remove();
    control = null;
    var dialog = document.getElementById('mp-install-help');
    if (dialog) dialog.remove();
  }
  function help() {
    if (document.getElementById('mp-install-help')) return;
    var dialog = document.createElement('dialog');
    dialog.id = 'mp-install-help';
    var title = document.createElement('h2');
    title.textContent = 'Εγκατάσταση MediPrice';
    var text = document.createElement('p');
    text.textContent = 'Στο Safari πάτησε Κοινοποίηση και μετά «Προσθήκη στην οθόνη Αφετηρίας».';
    var close = document.createElement('button');
    close.type = 'button'; close.textContent = 'Κλείσιμο';
    close.onclick = function () { dialog.close(); dialog.remove(); };
    dialog.append(title, text, close);
    dialog.addEventListener('cancel', function () { dialog.remove(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) { dialog.close(); dialog.remove(); } });
    document.body.appendChild(dialog); dialog.showModal();
  }
  async function install() {
    var pending = promptEvent;
    if (!pending) { if (appleDevice()) help(); return; }
    promptEvent = null;
    mount();
    try {
      await pending.prompt();
      var result = await pending.userChoice;
      if (result.outcome === 'accepted') markInstalled();
    } catch (error) { console.warn('MediPrice installation was not started:', error); }
  }
  function mount() {
    if (installed || standalone() || (!promptEvent && (readInstalled() || !appleDevice()))) {
      if (control) { control.remove(); control = null; }
      return;
    }
    var host = document.getElementById('mp-account-bar') || document.querySelector('.mp-login-card');
    if (!host) return;
    if (!control) {
      control = document.createElement('span'); control.className = 'mp-pwa-install';
      var button = document.createElement('button');
      button.type = 'button';
      button.onclick = install; control.appendChild(button);
    }
    var button = control.querySelector('button');
    var label = promptEvent ? 'Εγκατάσταση εφαρμογής' : 'Προσθήκη στην Αφετηρία — οδηγίες';
    if (button.textContent !== label) button.textContent = label;
    if (control.parentElement !== host) host.appendChild(control);
  }
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault(); promptEvent = event; installed = false;
    try { localStorage.removeItem(storageKey); } catch (error) {}
    mount();
  });
  window.addEventListener('appinstalled', markInstalled);
  if (display.addEventListener) display.addEventListener('change', function () { if (standalone()) markInstalled(); });
  function init() {
    var style = document.createElement('style');
    style.textContent = '.mp-pwa-install{display:inline-flex;flex-shrink:0}.mp-pwa-install button{font:inherit;font-size:12px;padding:7px 10px;border:1px solid var(--brd,#dce3ed);border-radius:7px;background:var(--acc-bg,#edf3ff);color:var(--acc-txt,#2856b2);cursor:pointer}.mp-login-card .mp-pwa-install{margin-top:16px}#mp-install-help{max-width:360px;width:calc(100% - 32px);padding:22px;border:1px solid var(--brd,#dce3ed);border-radius:12px;background:var(--sur,#fff);color:var(--txt,#202d40);font:14px/1.7 system-ui}#mp-install-help::backdrop{background:#13243a80}#mp-install-help h2{font-size:18px;margin:0 0 12px}#mp-install-help button{font:inherit;cursor:pointer;padding:7px 16px}';
    document.head.appendChild(style);
    if (standalone()) markInstalled();
    var root = document.getElementById('mp-auth-root');
    if (root) new MutationObserver(mount).observe(root, {childList:true,subtree:true});
    mount();
    if ('serviceWorker' in navigator) {
      var worker = new URL('sw.js', manifestUrl);
      navigator.serviceWorker.register(worker.href, {scope:new URL('./', manifestUrl).pathname})
        .catch(function (error) { console.warn('MediPrice service worker:', error); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
