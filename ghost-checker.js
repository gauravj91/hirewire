/* HireWire — standalone ghost-job checker (/ghost-job-checker.html, /de/ghost-jobs-erkennen.html).
   Uses window.HWGhost (assets/ghost.js, generated verbatim from the app's own heuristics).
   Everything runs in this page: the pasted text is never sent anywhere and nothing is stored. */
(function(){
  'use strict';
  var G = window.HWGhost;
  var root = document.getElementById('ghostTool');
  if (!G || !root) return;
  var lang = root.getAttribute('data-lang') === 'de' ? 'de' : 'en';
  var S = {
    en: {
      LOW:'LOW', MEDIUM:'MEDIUM', HIGH:'HIGH', badge:{ low:'LOW RISK', medium:'MEDIUM RISK', high:'HIGH RISK' }, pts:' pts · heuristic, not proof',
      none:'No warning signs found in the text.',
      notChecked:'Not checked from pasted text: reposts under new listing IDs, the same title in many cities, and whether the employer has already closed the posting. The HireWire app checks those for every job in your feeds, using a history kept in your browser.',
      empty:'Paste the job posting text first.', copied:'Result copied.', copyFail:'Your browser blocked the clipboard. Select the text below and copy it.',
      imgSaved:'Share image saved.', imgFail:'This browser cannot draw images. Use Copy result instead.',
      head:'Ghost-job risk', signals:'Signals:', disclaimer:'A heuristic risk signal from the posting text, not proof that the job is fake or closed.',
      footer:'Checked with HireWire · hirewire.fyi', cardTitle:'GHOST-JOB RISK CHECK', cardNote:'A heuristic risk signal, not proof. Checked in the browser.',
      entered:function(d){ return 'Posted ' + d + ' days ago (you entered it)'; },
      bands:['(30+ days)', '(45+ days)', '(60+ days)'], file:'hirewire-ghost-check',
    },
    de: {
      LOW:'NIEDRIG', MEDIUM:'MITTEL', HIGH:'HOCH', badge:{ low:'NIEDRIGES RISIKO', medium:'MITTLERES RISIKO', high:'HOHES RISIKO' }, pts:' Pkt. · Heuristik, kein Beweis',
      none:'Im Text wurden keine Warnzeichen gefunden.',
      notChecked:'Aus eingefügtem Text nicht prüfbar: Reposts unter neuer Anzeigen-ID, derselbe Titel in vielen Städten und ob der Arbeitgeber die Anzeige schon geschlossen hat. Das prüft die HireWire-App für jede Stelle in deinen Feeds, mit einem Verlauf, der nur in deinem Browser liegt.',
      empty:'Füge zuerst den Text der Stellenanzeige ein.', copied:'Ergebnis kopiert.', copyFail:'Dein Browser blockiert die Zwischenablage. Markiere den Text unten und kopiere ihn.',
      imgSaved:'Bild gespeichert.', imgFail:'Dieser Browser kann keine Bilder zeichnen. Nutze „Ergebnis kopieren“.',
      head:'Ghost-Job-Risiko', signals:'Signale:', disclaimer:'Ein heuristisches Risikosignal aus dem Anzeigentext, kein Beweis, dass die Stelle nicht echt oder schon besetzt ist.',
      footer:'Geprüft mit HireWire · hirewire.fyi', cardTitle:'GHOST-JOB-CHECK', cardNote:'Heuristisches Risikosignal, kein Beweis. Im Browser geprüft.',
      entered:function(d){ return 'Vor ' + d + ' Tagen veröffentlicht (deine Angabe)'; },
      bands:['(30+ Tage)', '(45+ Tage)', '(60+ Tage)'], file:'hirewire-ghost-check',
    },
  }[lang];
  var DE_MAP = [
    [/^Very short description \((\d+) words\)$/, 'Sehr kurze Beschreibung ($1 Wörter)'],
    [/^Short description \((\d+) words\)$/, 'Kurze Beschreibung ($1 Wörter)'],
    [/^Buzzword-heavy, little substance \((.*)\)$/, 'Viele Buzzwords, wenig Inhalt ($1)'],
    [/^Evergreen \/ talent-pool wording \((.*)\)$/, 'Formulierung wie bei Talent-Pool oder Dauerausschreibung ($1)'],
    [/^No responsibilities or requirements described$/, 'Weder Aufgaben noch Anforderungen beschrieben'],
    [/^No clear responsibilities section$/, 'Keine klaren Aufgaben beschrieben'],
    [/^No clear requirements section$/, 'Keine klaren Anforderungen beschrieben'],
    [/^No salary found in the text$/, 'Kein Gehalt im Text gefunden'],
    [/^Says it was posted (.+) \((\d+)\+ days\)$/, 'Laut Text veröffentlicht „$1“ ($2+ Tage)'],
    [/^The page says “reposted”$/, 'Die Anzeige sagt „reposted“ (erneut veröffentlicht)'],
  ];
  function tr(t){
    if (lang !== 'de') return t;
    for (var i = 0; i < DE_MAP.length; i++) if (DE_MAP[i][0].test(t)) return t.replace(DE_MAP[i][0], DE_MAP[i][1]);
    return t;
  }
  function label(level){ return S[level.toUpperCase()]; }

  // The app's text check, plus an optional "posted N days ago" the user types (same 30/45/60-day bands as the app).
  function check(text, days){
    var res = G.ghostRiskText(text);
    if (days != null && isFinite(days) && days >= 0){
      var w = days > 60 ? 3 : (days > 45 ? 2 : (days > 30 ? 1 : 0));
      var fromText = res.reasons.filter(function(r){ return /^Says it was posted /.test(r.t); })[0];
      if (w && (!fromText || fromText.w < w)){
        var R = res.reasons.filter(function(r){ return r !== fromText; }).map(function(r){ return { w:r.w, t:r.t }; });
        R.push({ w:w, t:S.entered(Math.floor(days)) + ' ' + S.bands[w - 1], entered:true });
        res = G.ghostLevel(R, res.skipped);
      }
    }
    return res;
  }

  var $ = function(id){ return document.getElementById(id); };
  var txt = $('ghText'), daysIn = $('ghDays'), out = $('ghOut'), status = $('ghStatus');
  var last = null;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function say(msg, bad){ status.textContent = msg || ''; status.className = 'hint' + (bad ? ' err' : ''); }

  function render(res){
    var sig = res.reasons;
    var h = '<div class="gh-head"><span class="badge lvl-' + res.level + '">' + esc(S.badge[res.level]) + '</span>' +
      '<span class="muted">' + res.points + esc(S.pts) + '</span></div>';
    h += sig.length ? '<ul class="siglist">' + sig.map(function(r){ return '<li><b>+' + r.w + '</b><span>' + esc(r.entered ? r.t : tr(r.t)) + '</span></li>'; }).join('') + '</ul>'
      : '<p>' + esc(S.none) + '</p>';
    h += '<p class="muted">' + esc(S.notChecked) + '</p>';
    out.innerHTML = h;
    out.parentNode.hidden = false;
  }
  function resultText(res){
    var L = [S.head + ': ' + label(res.level) + ' (' + res.points + (lang === 'de' ? ' Pkt.)' : ' pts)')];
    var sig = res.reasons.filter(function(r){ return r.w > 0; });
    if (sig.length){ L.push(S.signals); sig.forEach(function(r){ L.push('• ' + (r.entered ? r.t : tr(r.t)) + ' (+' + r.w + ')'); }); }
    else L.push(S.none);
    L.push('', S.disclaimer, S.footer + (lang === 'de' ? '/de/ghost-jobs-erkennen.html' : '/ghost-job-checker.html'));
    return L.join('\n');
  }
  function copy(t){
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function(){ return true; }, function(){ return fallbackCopy(t); });
    return Promise.resolve(fallbackCopy(t));
  }
  function fallbackCopy(t){
    var ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){}
    ta.remove(); return ok;
  }
  function wrapLines(ctx, text, maxW){
    var words = String(text).split(/\s+/), lines = [], cur = '';
    words.forEach(function(w){ var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur){ lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
  function drawCard(res){
    var cv = document.createElement('canvas'); cv.width = 1200; cv.height = 630;
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return null;
    var C = { paper:'#F6F1E6', ink:'#17130C', ink2:'#6A6250', line:'#BCB096', low:'#3D6B35', medium:'#96660F', high:'#C8371D' };
    var mono = '"IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = C.ink; ctx.fillRect(60, 64, 1080, 3); ctx.fillRect(60, 71, 1080, 1);
    ctx.font = '600 22px ' + mono; ctx.fillStyle = C.ink2; ctx.fillText(S.cardTitle, 60, 118);
    ctx.font = '400 104px "Instrument Serif", Georgia, serif'; ctx.fillStyle = C[res.level];
    var lab = label(res.level); ctx.fillText(lab, 60, 228);
    var lw = ctx.measureText(lab).width;
    ctx.font = '500 26px ' + mono; ctx.fillStyle = C.ink2; ctx.fillText(res.points + (lang === 'de' ? ' Pkt.' : ' pts'), 84 + lw, 226);
    // footer first, so the reasons know how much room is left
    ctx.font = '600 22px ' + mono; var fw = ctx.measureText(S.footer).width;
    ctx.font = '400 19px ' + mono; var noteFits = ctx.measureText(S.cardNote).width <= 1080 - fw - 30;
    var yMax = noteFits ? 540 : 505;
    var y = 290; ctx.font = '400 24px ' + mono; ctx.fillStyle = C.ink;
    var sig = res.reasons.filter(function(r){ return r.w > 0; }).slice(0, 5);
    if (!sig.length){ ctx.fillText(S.none, 60, y); y += 40; }
    sig.forEach(function(r){
      wrapLines(ctx, (r.entered ? r.t : tr(r.t)) + '  +' + r.w, 1020).slice(0, 2).forEach(function(ln, i){ if (y < yMax){ ctx.fillText((i ? '   ' : '•  ') + ln, 60, y); y += 34; } });
      y += 6;
    });
    ctx.fillStyle = C.line; ctx.fillRect(60, 560, 1080, 1);
    ctx.font = '400 19px ' + mono; ctx.fillStyle = C.ink2; ctx.fillText(S.cardNote, 60, noteFits ? 597 : 545);
    ctx.font = '600 22px ' + mono; ctx.fillStyle = C.high; ctx.textAlign = 'right';
    ctx.fillText(S.footer, 1140, 597); ctx.textAlign = 'left';
    return cv;
  }
  function shareImage(res){
    var cv = null;
    try { cv = drawCard(res); } catch(e){ cv = null; }
    if (!cv){ say(S.imgFail, true); return; }
    var name = S.file + '-' + new Date().toISOString().slice(0, 10) + '.png';
    var save = function(blob){
      if (!blob){ say(S.imgFail, true); return; }
      var file = null;
      try { file = new File([blob], name, { type:'image/png' }); } catch(e){}
      if (file && navigator.canShare && navigator.share && navigator.canShare({ files:[file] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)){
        navigator.share({ files:[file], text:resultText(res) }).catch(function(){});
        return;
      }
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
      say(S.imgSaved + ' ' + name);
    };
    if (cv.toBlob) cv.toBlob(save, 'image/png'); else say(S.imgFail, true);
  }

  $('ghGo').addEventListener('click', function(){
    var t = txt.value.trim();
    if (!t){ say(S.empty, true); txt.focus(); return; }
    var d = daysIn.value.trim() === '' ? null : Number(daysIn.value);
    last = check(t, d);
    say('');
    render(last);
    $('ghResult').scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  $('ghClear').addEventListener('click', function(){ txt.value = ''; daysIn.value = ''; out.parentNode.hidden = true; last = null; say(''); txt.focus(); });
  var ex = $('ghExample');
  if (ex) ex.addEventListener('click', function(){ txt.value = ex.getAttribute('data-text'); daysIn.value = ex.getAttribute('data-days') || ''; $('ghGo').click(); });
  $('ghCopy').addEventListener('click', function(){ if (!last) return; copy(resultText(last)).then(function(ok){ say(ok ? S.copied : S.copyFail, !ok); }); });
  $('ghImg').addEventListener('click', function(){ if (last) shareImage(last); });
  window.HWGhostPage = { check:check, resultText:resultText, tr:tr };
})();
