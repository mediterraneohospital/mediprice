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
    logoutBtn.addEventListener('click', function(){ sb.auth.signOut().then(function(){ window.location.reload(); }); });
    bar.appendChild(logoutBtn);

    var iframe = el('iframe', { id: 'mp-app-frame' });
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
        if (r.error || !r.data || !r.data.active) { if (window.MediAuth) window.MediAuth.fail(); return; }
        currentMember = { role: r.data.role, active: r.data.active, userId: user.id };
      });
    });
  }

  // ---------- Έλεγχος membership + φόρτωση προστατευμένου περιεχομένου ----------
  function checkMembershipAndLoad(){
    sb.auth.getUser().then(function(res){
      var user = res.data && res.data.user;
      if (!user) { showLogin(); return; }
      sb.from('mp_members').select('role,active,email').eq('user_id', user.id).maybeSingle().then(function(r){
        if (r.error || !r.data || !r.data.active) {
          sb.auth.signOut().then(function(){
            showLogin('Δεν έχετε ακόμη ενεργή πρόσβαση σε αυτή την εφαρμογή. Επικοινωνήστε με τον διαχειριστή.', true);
          });
          return;
        }
        var member = { role: r.data.role, active: r.data.active, userId: user.id };
        var email = r.data.email || user.email;
        sb.from('mp_app_assets').select('html').eq('name', window.MP_PAGE).single().then(function(a){
          if (a.error || !a.data) { showLogin('Δεν ήταν δυνατή η φόρτωση της εφαρμογής αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο.', true); return; }
          showApp(a.data.html, member, email);
        });
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
    var backdrop = modal('Χρήστες', body);

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
          var tr = el('tr', {}, [
            el('td', { text: m.email }),
            el('td', {}, [ roleSel ]),
            el('td', {}, [ activeSel ]),
            el('td', {}, [ saveBtn ])
          ]);
          table.appendChild(tr);
        });
        body.appendChild(table);

        var newEmail = el('input', { type: 'email', placeholder: 'email@mediterraneohospital.gr' });
        var newRole = el('select', {}, ['reader', 'editor', 'admin'].map(function(r){ return el('option', { value: r, text: roleLabel(r) }); }));
        var inviteBtn = el('button', { class: 'mp-btn', type: 'button', text: 'Δημιουργία πρόσβασης' });
        var linkBox = el('div');
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

  function openHistoryModal(){
    var body = el('div', {}, [ el('p', { text: 'Φόρτωση…' }) ]);
    modal('Ιστορικό αλλαγών', body);
    sb.from('mp_audit').select('actor_email,action,target,occurred_at').order('occurred_at', { ascending: false }).limit(50).then(function(res){
      body.innerHTML = '';
      if (res.error) { body.appendChild(el('div', { class: 'mp-msg-err', text: 'Δεν ήταν δυνατή η φόρτωση.' })); return; }
      var table = el('table', { class: 'mp-table' });
      table.appendChild(el('tr', {}, [ el('th', { text: 'Πότε' }), el('th', { text: 'Ποιος' }), el('th', { text: 'Ενέργεια' }), el('th', { text: 'Στόχος' }) ]));
      (res.data || []).forEach(function(a){
        var when = new Date(a.occurred_at).toLocaleString('el-GR');
        table.appendChild(el('tr', {}, [
          el('td', { text: when }),
          el('td', { text: a.actor_email || '' }),
          el('td', { text: a.action || '' }),
          el('td', { text: a.target || '' })
        ]));
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
