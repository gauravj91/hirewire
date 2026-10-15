/* HireWire online withdrawal function (§ 356a BGB) for /withdrawal.html and /de/widerruf.html.
   Progressive enhancement: the <form data-withdraw> posts to POST /api/withdraw by itself (no JS → the API answers with a
   receipt page). With JS we send the same fields as JSON with fetch and show the receipt (or the error) in place.
   Nothing is stored in the browser. */
(function () {
  'use strict';
  var T = {
    en: { sending: 'Sending your withdrawal…', okTitle: 'Withdrawal received', at: 'Received on', ref: 'Reference',
      mailed: 'We emailed a confirmation of receipt with this content to', notMailed: 'We could not email your confirmation. Please save or print this page as your receipt; we have been notified.',
      net: 'Your withdrawal could not be sent (no connection to our server). Please try again, or email it to hey@hirewire.fyi; that is just as valid.',
      fields: { name: 'Name', email: 'Email', contract: 'Purchase', message: 'Message', statement: 'Statement' } },
    de: { sending: 'Dein Widerruf wird gesendet…', okTitle: 'Widerruf eingegangen', at: 'Eingegangen am', ref: 'Widerrufsnummer',
      mailed: 'Wir haben eine Eingangsbestätigung mit diesem Inhalt gesendet an', notMailed: 'Wir konnten dir keine Bestätigung per E-Mail senden. Bitte speichere oder drucke diese Seite als Bestätigung; wir wurden benachrichtigt.',
      net: 'Dein Widerruf konnte nicht gesendet werden (keine Verbindung zu unserem Server). Bitte versuch es noch einmal oder schick ihn per E-Mail an hey@hirewire.fyi; das ist genauso wirksam.',
      fields: { name: 'Name', email: 'E-Mail', contract: 'Kauf', message: 'Anmerkung', statement: 'Erklärung' } }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function wire(form) {
    if (!window.fetch || !window.JSON || form.getAttribute('data-wired')) return;
    form.setAttribute('data-wired', '1');
    var lang = form.getAttribute('data-withdraw') === 'de' ? 'de' : 'en', t = T[lang];
    var status = form.querySelector('.wd-status');
    var btn = form.querySelector('button[type="submit"]');
    function show(html, cls) { if (!status) return; status.className = 'wd-status ' + (cls || ''); status.innerHTML = html; status.hidden = false; }

    form.addEventListener('submit', function (ev) {
      if (!form.checkValidity || form.checkValidity()) ev.preventDefault(); else return;
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value; });
      data.timestamp = new Date().toISOString();
      data.lang = lang;
      if (btn) btn.disabled = true;
      show(esc(t.sending), 'busy');
      fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'omit' })
        .then(function (r) { return r.json().catch(function () { return { error: 'http_' + r.status }; }).then(function (b) { return { status: r.status, body: b }; }); })
        .then(function (res) {
          var b = res.body || {};
          if (res.status === 200 && b.ok) {
            var s = b.submitted || {}, rows = ['name', 'email', 'contract', 'message', 'statement'].filter(function (k) { return s[k]; })
              .map(function (k) { return '<tr><th>' + esc(t.fields[k]) + '</th><td>' + esc(s[k]) + '</td></tr>'; }).join('');
            Array.prototype.forEach.call(form.querySelectorAll('p, input, textarea, button'), function (el) { if (!status.contains(el)) el.hidden = true; });
            show('<p><b>' + esc(t.okTitle) + '</b></p><p>' + esc(t.at) + ' <b>' + esc(b.received_at_local) + '</b> (' + esc(b.received_at_iso) + ')<br>' +
              esc(t.ref) + ': <b>' + esc(b.reference) + '</b></p><table class="wd-receipt">' + rows + '</table><p>' +
              (b.receipt_sent ? esc(t.mailed) + ' <b>' + esc(s.email) + '</b>.' : esc(t.notMailed)) + '</p>', 'ok');
            if (status.scrollIntoView) status.scrollIntoView({ block: 'nearest' });
            return;
          }
          if (btn) btn.disabled = false;
          show(esc(b.message || t.net), 'err');
        })
        .catch(function () { if (btn) btn.disabled = false; show(esc(t.net), 'err'); });
    });
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll('form[data-withdraw]'), wire); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
