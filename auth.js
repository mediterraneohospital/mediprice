/* MediPrice — login shell / membership gate
   Απαιτεί: config.js (πριν από αυτό) και window.MP_PAGE (π.χ. 'index.html').
   Εκθέτει στο top-level παράθυρο το window.MediAuth, που το προστατευμένο
   περιεχόμενο (μέσα στο iframe srcdoc) καλεί ως parent.MediAuth.
*/
(function(){
  'use strict';

  var sb = window.supabase.createClient(window.MP_CONFIG.url, window.MP_CONFIG.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  var root = document.getElementById('mp-auth-root');
  var recheckTimer = null;
  var currentMember = null; // {role,email}
  var PAGES = ['index.html', 'plafond.html', 'katigoriopoiisi.html'];
  var currentIframe = null;
  var softNavBusy = false;

  function pageNameFromHref(href){
    if (!href) return null;
    href = href.split('#')[0].split('?')[0];
    if (href === '' || href === './' || href === '/' || /\/mediprice\/?$/.test(href)) return 'index.html';
    var seg = href.split('/').pop();
    return PAGES.indexOf(seg) !== -1 ? seg : null;
  }

  function pageNameFromPath(pathname){
    var seg = (pathname || '').split('/').pop();
    return PAGES.indexOf(seg) !== -1 ? seg : 'index.html';
  }

  function el(tag, attrs, children){
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function(c){ if (c) e.appendChild(c); });
    return e;
  }

  function clearRoot(){ root.innerHTML = ''; if (recheckTimer){ clearInterval(recheckTimer); recheckTimer = null; } }

  // ---------- Οθόνη σύνδεσης ----------
  function showLogin(message, isError){
    clearRoot();
    var msgBox = null;
    if (message) msgBox = el('div', { class: isError === false ? 'mp-msg-ok' : 'mp-msg-err', text: message });

    var emailInput = el('input', { type: 'email', autocomplete: 'username', placeholder: 'you@mediterraneohospital.gr' });
    var passInput = el('input', { type: 'password', autocomplete: 'current-password', placeholder: '••••••••' });
    var btn = el('button', { class: 'mp-btn', type: 'submit', text: 'Σύνδεση' });
    var forgotBtn = el('button', { class: 'mp-btn-link', type: 'button', text: 'Ξέχασα τον κωδικό μου' });

    var form = el('form', {}, [
      el('div', { class: 'mp-field' }, [ el('label', { text: 'Email' }), emailInput ]),
      el('div', { class: 'mp-field' }, [ el('label', { text: 'Κωδικός' }), passInput ]),
      btn, forgotBtn
    ]);

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      btn.disabled = true; btn.textContent = 'Σύνδεση...';
      sb.auth.signInWithPassword({ email: emailInput.value.trim(), password: passInput.value })
        .then(function(res){
          if (res.error) { showLogin('Λάθος email ή κωδικός.', true); return; }
          showLoading();
          checkMembershipAndLoad();
        });
    });

    forgotBtn.addEventListener('click', function(){
      var email = emailInput.value.trim();
      if (!email) { showLogin('Γράψτε πρώτα το email σας και μετά πατήστε ξανά «Ξέχασα τον κωδικό μου».', true); return; }
      forgotBtn.disabled = true;
      sb.auth.resetPasswordForEmail(email, { redirectTo: window.MP_CONFIG.siteUrl + '?setup=1' })
        .then(function(){
          showLogin('Αν ο λογαριασμός υπάρχει, θα λάβετε οδηγίες επαναφοράς. (Αν δεν έχει ρυθμιστεί αποστολή email, ζητήστε νέο σύνδεσμο από τον διαχειριστή.)', false);
        });
    });

    var card = el('div', { class: 'mp-login-card' }, [
      el('h1', { text: 'MediPrice' }),
      el('p', { class: 'mp-sub', text: 'Σύνδεση για πρόσβαση στον κατάλογο.' }),
      msgBox, form
    ]);
    root.appendChild(el('div', { class: 'mp-login-wrap' }, [ card ]));
  }

  // ---------- Ρύθμιση κωδικού (πρώτη φορά / ανάκτηση) ----------
  function showSetupPassword(){
    clearRoot();
    var p1 = el('input', { type: 'password', autocomplete: 'new-password', placeholder: '••••••••' });
    var p2 = el('input', { type: 'password', autocomplete: 'new-password', placeholder: '••••••••' });
    var btn = el('button', { class: 'mp-btn', type: 'submit', text: 'Ορισμός κωδικού' });
    var msgBox = el('div');

    var form = el('form', {}, [
      el('div', { class: 'mp-field' }, [ el('label', { text: 'Νέος κωδικός (τουλάχιστον 8 χαρακτήρες)' }), p1 ]),
      el('div', { class: 'mp-field' }, [ el('label', { text: 'Επιβεβαίωση κωδικού' }), p2 ]),
      btn
    ]);

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      msgBox.innerHTML = '';
      if (p1.value.length < 8) { msgBox.appendChild(el('div', { class: 'mp-msg-err', text: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.' })); return; }
      if (p1.value !== p2.value) { msgBox.appendChild(el('div', { class: 'mp-msg-err', text: 'Οι κωδικοί δεν ταιριάζουν.' })); return; }
      btn.disabled = true; btn.textContent = 'Αποθήκευση...';
      sb.auth.updateUser({ password: p1.value }).then(function(res){
        if (res.error) { btn.disabled = false; btn.textContent = 'Ορισμός κωδικού'; msgBox.innerHTML=''; msgBox.appendChild(el('div', { class: 'mp-msg-err', text: 'Δεν ολοκληρώθηκε. Ο σύνδεσμος μπορεί να έχει λήξει — ζητήστε νέο από τον διαχειριστή.' })); return; }
        try { window.history.replaceState({}, '', window.location.pathname); } catch(e){}
        showLoading();
        checkMembershipAndLoad();
      });
    });

    var card = el('div', { class: 'mp-login-card' }, [
      el('h1', { text: 'Ορισμός κωδικού' }),
      el('p', { class: 'mp-sub', text: 'Ο λογαριασμός σας ενεργοποιήθηκε. Ορίστε προσωπικό κωδικό πρόσβασης.' }),
      msgBox, form
    ]);
    root.appendChild(el('div', { class: 'mp-login-wrap' }, [ card ]));
  }

  function showLoading(){
    clearRoot();
    root.appendChild(el('div', { class: 'mp-login-wrap' }, [ el('p', { text: 'Φόρτωση…' }) ]));
  }

  // ---------- Κύρια εφαρμογή ----------
  function showApp(html, member, email){
    clearRoot();
    currentMember = member;

    var bar = el('div', { id: 'mp-account-bar' }, [
      el('span', { class: 'mp-email', text: email }),
      el('span', { class: 'mp-role', text: roleLabel(member.role) }),
      el('span', { class: 'mp-spacer' })
    ]);
    if (member.role === 'admin') {
      var usersBtn = el('button', { type: 'button', text: 'Χρήστες' });
      usersBtn.addEventListener('click', openUsersModal);
      var histBtn = el('button', { type: 'button', text: 'Ιστορικό' });
      histBtn.addEventListener('click', openHistoryModal);
      bar.appendChild(usersBtn);
      bar.appendChild(histBtn);
    }
    var logoutBtn = el('button', { type: 'button', text: 'Αποσύνδεση' });
    logoutBtn.addEventListener('click', function(){ try { sessionStorage.removeItem(MEMBERSHIP_CACHE_KEY); } catch (e) {} sb.auth.signOut().then(function(){ window.location.reload(); }); });
    bar.appendChild(logoutBtn);

    var iframe = el('iframe', { id: 'mp-app-frame' });
    currentIframe = iframe;
    iframe.addEventListener('load', function(){ attachSoftNav(iframe); });
    iframe.srcdoc = html;

    root.appendChild(bar);
    root.appendChild(iframe);

    window.MediAuth = {
      client: sb,
      user: member.userId,
      role: member.role,
      email: email,
      canEdit: function(){ return currentMember && currentMember.active && (currentMember.role === 'admin' || currentMember.role === 'editor'); },
      fail: function(){
        showLogin('Η συνεδρία έληξε ή δεν έχετε πλέον πρόσβαση. Συνδεθείτε ξανά.', true);
        sb.auth.signOut();
      }
    };

    if (recheckTimer) clearInterval(recheckTimer);
    recheckTimer = setInterval(recheckMembership, 60000);
  }

  // Πιάνει τα κλικ σε εσωτερικούς συνδέσμους (Plafond / Κατηγοριοποίηση / Αρχική) ΜΕΣΑ στο
  // προστατευμένο περιεχόμενο και τα κάνει "αθόρυβη" αλλαγή αντί για πλήρη επαναφόρτωση σελίδας.
  // Δεν αγγίζει καθόλου το ίδιο το περιεχόμενο· αν κάτι πάει στραβά, κάνει απλή πλοήγηση όπως πριν.
  function attachSoftNav(iframe){
    var doc;
    try { doc = iframe.contentDocument; } catch (e) { return; }
    if (!doc || doc.body === null) return;
    doc.addEventListener('click', function(ev){
      var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      var page = pageNameFromHref(href);
      if (!page || page === window.MP_PAGE) return;
      ev.preventDefault();
      softNavigate(page);
    }, true);
  }

  function softNavigate(page){
    if (softNavBusy) return;
    if (PAGES.indexOf(page) === -1) return;
    softNavBusy = true;
    sb.from('mp_app_assets').select('html').eq('name', page).single().then(function(a){
      softNavBusy = false;
      if (a.error || !a.data || !currentIframe) {
        // Ασφαλές fallback: κανονική πλοήγηση, όπως λειτουργούσε πριν.
        window.location.href = page;
        return;
      }
      window.MP_PAGE = page;
      try {
        var newPath = window.location.pathname.replace(/[^\/]*$/, page === 'index.html' ? '' : page);
        window.history.pushState({ mpPage: page }, '', newPath);
      } catch (e) {}
      currentIframe.srcdoc = a.data.html;
    });
  }

  window.addEventListener('popstate', function(ev){
    var page = (ev.state && ev.state.mpPage) || pageNameFromPath(window.location.pathname);
    if (page === window.MP_PAGE || !currentIframe) return;
    sb.from('mp_app_assets').select('html').eq('name', page).single().then(function(a){
      if (a.error || !a.data) { window.location.reload(); return; }
      window.MP_PAGE = page;
      currentIframe.srcdoc = a.data.html;
    });
  });

  function roleLabel(r){
    if (r === 'admin') return 'Διαχειριστής';
    if (r === 'editor') return 'Συντάκτης';
    return 'Αναγνώστης';
  }

  function recheckMembership(){
    sb.auth.getUser().then(function(res){
      var user = res.data && res.data.user;
      if (!user) { if (window.MediAuth) window.MediAuth.fail(); return; }
      sb.from('mp_members').select('role,active,email').eq('user_id', user.id).maybeSingle().then(function(r){
        if (r.error || !r.data || !r.data.active) {
          try { sessionStorage.removeItem(MEMBERSHIP_CACHE_KEY); } catch (e) {}
          if (window.MediAuth) window.MediAuth.fail();
          return;
        }
        currentMember = { role: r.data.role, active: r.data.active, userId: user.id };
        writeMembershipCache(user.id, r.data.role, r.data.active, r.data.email);
      });
    });
  }

  // ---------- Έλεγχος membership + φόρτωση προστατευμένου περιεχομένου ----------
  var MEMBERSHIP_CACHE_KEY = 'mp_membership_cache_v1';
  var MEMBERSHIP_CACHE_MS = 45000; // κρατάει τον έλεγχο πρόσβασης "ζεστό" για 45" ανάμεσα σε σελίδες

  function readMembershipCache(userId){
    try {
      var raw = sessionStorage.getItem(MEMBERSHIP_CACHE_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (c.userId !== userId || !c.active) return null;
      if (Date.now() - c.ts > MEMBERSHIP_CACHE_MS) return null;
      return c;
    } catch (e) { return null; }
  }
  function writeMembershipCache(userId, role, active, email){
    try { sessionStorage.setItem(MEMBERSHIP_CACHE_KEY, JSON.stringify({ userId: userId, role: role, active: active, email: email, ts: Date.now() })); } catch (e) {}
  }

  function checkMembershipAndLoad(){
    sb.auth.getUser().then(function(res){
      var user = res.data && res.data.user;
      if (!user) { showLogin(); return; }

      var cached = readMembershipCache(user.id);
      var membershipPromise = cached
        ? Promise.resolve({ data: { role: cached.role, active: cached.active, email: cached.email }, error: null })
        : sb.from('mp_members').select('role,active,email').eq('user_id', user.id).maybeSingle();
      var assetPromise = sb.from('mp_app_assets').select('html').eq('name', window.MP_PAGE).single();

      // Τρέχουν ταυτόχρονα· η RLS αρνείται από μόνη της το asset αν δεν είσαι ενεργό μέλος.
      Promise.all([membershipPromise, assetPromise]).then(function(results){
        var r = results[0], a = results[1];
        if (r.error || !r.data || !r.data.active) {
          try { sessionStorage.removeItem(MEMBERSHIP_CACHE_KEY); } catch (e) {}
          sb.auth.signOut().then(function(){
            showLogin('Δεν έχετε ακόμη ενεργή πρόσβαση σε αυτή την εφαρμογή. Επικοινωνήστε με τον διαχειριστή.', true);
          });
          return;
        }
        var member = { role: r.data.role, active: r.data.active, userId: user.id };
        var email = r.data.email || user.email;
        writeMembershipCache(user.id, member.role, member.active, email);
        if (a.error || !a.data) { showLogin('Δεν ήταν δυνατή η φόρτωση της εφαρμογής αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο.', true); return; }
        showApp(a.data.html, member, email);
      });
    });
  }

  // ---------- Admin: κλήση της mediprice-admin function ----------
  function callAdmin(body){
    return sb.auth.getSession().then(function(s){
      var token = s.data.session && s.data.session.access_token;
      return fetch(window.MP_CONFIG.url + '/functions/v1/mediprice-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, apikey: window.MP_CONFIG.key },
        body: JSON.stringify(body)
      }).then(function(r){ return r.json().then(function(j){ return { status: r.status, body: j }; }); });
    });
  }

  function modal(title, contentEl){
    var backdrop = el('div', { class: 'mp-modal-backdrop' });
    var closeBtn = el('button', { class: 'mp-modal-close', type: 'button', text: '×' });
    var box = el('div', { class: 'mp-modal' }, [ closeBtn, el('h2', { text: title }), contentEl ]);
    backdrop.appendChild(box);
    backdrop.addEventListener('click', function(ev){ if (ev.target === backdrop) document.body.removeChild(backdrop); });
    closeBtn.addEventListener('click', function(){ document.body.removeChild(backdrop); });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function openUsersModal(){
    var body = el('div', {}, [ el('p', { text: 'Φόρτωση…' }) ]);
    var linkBox = el('div'); // μόνιμο — δεν σβήνεται όταν ανανεώνεται η λίστα χρηστών
    var container = el('div', {}, [ body, linkBox ]);
    var backdrop = modal('Χρήστες', container);

    function refresh(){
      body.innerHTML = '';
      body.appendChild(el('p', { text: 'Φόρτωση…' }));
      callAdmin({ action: 'list' }).then(function(res){
        body.innerHTML = '';
        if (res.status !== 200) { body.appendChild(el('div', { class: 'mp-msg-err', text: (res.body && res.body.error) || 'Σφάλμα.' })); return; }
        var table = el('table', { class: 'mp-table' });
        var thead = el('tr', {}, [ el('th', { text: 'Email' }), el('th', { text: 'Ρόλος' }), el('th', { text: 'Ενεργός' }), el('th', {}) ]);
        table.appendChild(thead);
        (res.body.members || []).forEach(function(m){
          var roleSel = el('select', {}, ['admin', 'editor', 'reader'].map(function(r){
            var o = el('option', { value: r, text: roleLabel(r) });
            if (r === m.role) o.setAttribute('selected', 'selected');
            return o;
          }));
          var activeSel = el('select', {}, [
            el('option', { value: '1', text: 'Ναι' }),
            el('option', { value: '0', text: 'Όχι' })
          ]);
          activeSel.value = m.active ? '1' : '0';
          var saveBtn = el('button', { type: 'button', text: 'Αποθήκευση' });
          saveBtn.addEventListener('click', function(){
            saveBtn.disabled = true;
            callAdmin({ action: 'update', user_id: m.user_id, role: roleSel.value, active: activeSel.value === '1' }).then(function(r2){
              if (r2.status !== 200) { alert((r2.body && r2.body.error) || 'Δεν έγινε η αλλαγή.'); saveBtn.disabled = false; return; }
              refresh();
            });
          });
          var deleteBtn = el('button', { type: 'button', text: 'Διαγραφή' });
          deleteBtn.addEventListener('click', function(){
            if (!window.confirm('Οριστική διαγραφή του ' + m.email + '; Δεν αναιρείται — θα χρειαστεί νέα πρόσκληση αν ξαναχρειαστεί πρόσβαση.')) return;
            deleteBtn.disabled = true;
            callAdmin({ action: 'delete', user_id: m.user_id }).then(function(r2){
              if (r2.status !== 200) { alert((r2.body && r2.body.error) || 'Δεν έγινε η διαγραφή.'); deleteBtn.disabled = false; return; }
              refresh();
            });
          });
          var tr = el('tr', {}, [
            el('td', { text: m.email }),
            el('td', {}, [ roleSel ]),
            el('td', {}, [ activeSel ]),
            el('td', {}, [ saveBtn, deleteBtn ])
          ]);
          table.appendChild(tr);
        });
        body.appendChild(table);

        var newEmail = el('input', { type: 'email', placeholder: 'email@mediterraneohospital.gr', autocomplete: 'off', name: 'mp-new-user-' + Date.now() });
        var newRole = el('select', {}, ['reader', 'editor', 'admin'].map(function(r){ return el('option', { value: r, text: roleLabel(r) }); }));
        var inviteBtn = el('button', { class: 'mp-btn', type: 'button', text: 'Δημιουργία πρόσβασης' });
        inviteBtn.addEventListener('click', function(){
          if (!newEmail.value.trim()) return;
          inviteBtn.disabled = true; inviteBtn.textContent = 'Δημιουργία...';
          callAdmin({ action: 'invite', email: newEmail.value.trim(), role: newRole.value }).then(function(r2){
            inviteBtn.disabled = false; inviteBtn.textContent = 'Δημιουργία πρόσβασης';
            linkBox.innerHTML = '';
            if (r2.status !== 200) { linkBox.appendChild(el('div', { class: 'mp-msg-err', text: (r2.body && r2.body.error) || 'Σφάλμα.' })); return; }
            linkBox.appendChild(el('div', { class: 'mp-msg-ok', text: 'Δημιουργήθηκε. Στείλτε αυτόν τον σύνδεσμο στον χρήστη (ισχύει μία φορά):' }));
            var box2 = el('div', { class: 'mp-link-box', text: r2.body.activation_link || '' });
            linkBox.appendChild(box2);
            newEmail.value = '';
            refresh();
          });
        });
        body.appendChild(el('div', { class: 'mp-inline-form' }, [
          el('div', { class: 'mp-field' }, [ el('label', { text: 'Νέος χρήστης — email' }), newEmail ]),
          el('div', { class: 'mp-field' }, [ el('label', { text: 'Ρόλος' }), newRole ]),
          inviteBtn
        ]));
        body.appendChild(linkBox);
      });
    }
    refresh();
  }

  // Ανθρώπινα αναγνώσιμο diff ανάμεσα σε δύο τιμές (πριν/μετά).
  // Υποστηρίζει: array αντικειμένων με πεδίο 'aa' (γραμμές πίνακα), απλά αντικείμενα, ή οτιδήποτε άλλο (σύγκριση ως σύνολο).
  var FIELD_LABELS = { idiot: 'Ιδιώτης', idiot3: 'Ιδιώτης (2ο σχήμα)', eop: 'ΕΟΠΥΥ', eop3: 'ΕΟΠΥΥ (2ο σχήμα)', eop_cheap: 'ΕΟΠΥΥ (φθηνό)', eop_expensive: 'ΕΟΠΥΥ (ακριβό)', dur: 'Διάρκεια', ken: 'ΚΕΝ', date: 'Ημερομηνία', room: 'Αίθουσα/Θέση', extra: 'Σημείωση κάλυψης', notes: 'Παρατηρήσεις', icu: 'ΜΕΘ', desc: 'Περιγραφή' };
  function fieldLabel(k){ return FIELD_LABELS[k] || k; }
  function fmtVal(v){ if (v === null || v === undefined || v === '') return '—'; return String(v); }

  function diffRows(before, after){
    var lines = [];
    if (Array.isArray(before) && Array.isArray(after) && before.every(function(r){ return r && typeof r === 'object' && 'aa' in r; })) {
      var beforeByAa = {}; before.forEach(function(r){ beforeByAa[r.aa] = r; });
      var afterByAa = {}; after.forEach(function(r){ afterByAa[r.aa] = r; });
      Object.keys(afterByAa).forEach(function(aa){
        var b = beforeByAa[aa], a = afterByAa[aa];
        var label = (a && a.desc) || (b && b.desc) || ('γραμμή ' + aa);
        if (!b) { lines.push({ kind: 'add', text: 'Νέα γραμμή: «' + label + '»' }); return; }
        var changed = [];
        Object.keys(a).forEach(function(k){
          if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) changed.push(fieldLabel(k) + ': ' + fmtVal(b[k]) + ' → ' + fmtVal(a[k]));
        });
        if (changed.length) lines.push({ kind: 'change', text: '«' + label + '» — ' + changed.join(', ') });
      });
      Object.keys(beforeByAa).forEach(function(aa){
        if (!afterByAa[aa]) lines.push({ kind: 'remove', text: 'Διαγράφηκε: «' + ((beforeByAa[aa] && beforeByAa[aa].desc) || ('γραμμή ' + aa)) + '»' });
      });
      return lines;
    }
    // Γενική περίπτωση: επίπεδη σύγκριση πεδίων αντικειμένου.
    if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before)) {
      var keys = {}; Object.keys(before).forEach(function(k){ keys[k] = 1; }); Object.keys(after).forEach(function(k){ keys[k] = 1; });
      Object.keys(keys).forEach(function(k){
        if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) lines.push({ kind: 'change', text: fieldLabel(k) + ': ' + fmtVal(before[k]) + ' → ' + fmtVal(after[k]) });
      });
      return lines;
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) lines.push({ kind: 'change', text: 'Η τιμή άλλαξε.' });
    return lines;
  }

  function openHistoryModal(){
    var body = el('div', {}, [ el('p', { text: 'Φόρτωση…' }) ]);
    modal('Ιστορικό αλλαγών', body);
    sb.from('mp_audit').select('id,actor_email,action,target,before_value,after_value,occurred_at').order('occurred_at', { ascending: false }).limit(50).then(function(res){
      body.innerHTML = '';
      if (res.error) { body.appendChild(el('div', { class: 'mp-msg-err', text: 'Δεν ήταν δυνατή η φόρτωση.' })); return; }
      var table = el('table', { class: 'mp-table' });
      table.appendChild(el('tr', {}, [ el('th', { text: 'Πότε' }), el('th', { text: 'Ποιος' }), el('th', { text: 'Ενέργεια' }), el('th', { text: 'Στόχος' }), el('th', {}) ]));
      (res.data || []).forEach(function(a){
        var when = new Date(a.occurred_at).toLocaleString('el-GR');
        var detailsBtn = el('button', { type: 'button', text: 'Λεπτομέρειες' });
        var tr = el('tr', {}, [
          el('td', { text: when }),
          el('td', { text: a.actor_email || '' }),
          el('td', { text: a.action || '' }),
          el('td', { text: a.target || '' }),
          el('td', {}, [ detailsBtn ])
        ]);
        table.appendChild(tr);
        var detailRow = el('tr', {}, [ el('td', { colspan: '5' }) ]);
        detailRow.style.display = 'none';
        table.appendChild(detailRow);
        var opened = false;
        detailsBtn.addEventListener('click', function(){
          opened = !opened;
          detailRow.style.display = opened ? '' : 'none';
          detailsBtn.textContent = opened ? 'Απόκρυψη' : 'Λεπτομέρειες';
          if (opened && !detailRow.firstChild.childNodes.length) {
            var diffs = diffRows(a.before_value, a.after_value);
            var cell = detailRow.firstChild;
            if (!diffs.length) { cell.appendChild(el('p', { text: 'Καμία ορατή διαφορά.' })); return; }
            var list = el('ul');
            diffs.forEach(function(d){ list.appendChild(el('li', { text: d.text })); });
            cell.appendChild(list);
          }
        });
      });
      body.appendChild(table);
    });
  }

  // ---------- Εκκίνηση ----------
  function init(){
    var params = new URLSearchParams(window.location.search);
    var setupMode = params.get('setup') === '1';
    showLoading();
    sb.auth.getSession().then(function(res){
      var session = res.data && res.data.session;
      if (setupMode && session) { showSetupPassword(); return; }
      if (session) { checkMembershipAndLoad(); return; }
      showLogin();
    });
  }

  init();
})();
