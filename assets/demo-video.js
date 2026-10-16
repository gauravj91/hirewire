/* HireWire demo video (2026-10-16): "▶ Watch the 90-sec demo" modal + responsive inline players.
   Source of truth: work/growth-src/demo-video.js. apply_demo.py inlines it into index.html and copies it to
   repo/assets/demo-video.js for the static pages (de/index.html, guide.html).
   • Links with [data-demo-open] open a native <dialog> via showModal(): labelled, close button, Esc (the browser's
     close request, which also works while the video's own controls hold focus), backdrop click; the page behind is
     inert, focus stays inside (sentinels + focusin guard as a backstop) and returns to the link afterwards; the
     video pauses on close. Browsers without showModal get the same behaviour from a fixed overlay fallback.
   • Nothing video-related exists in the DOM until the first click: zero video (and poster) bytes before it.
   • The <video> uses controls, playsinline, preload="none" and a poster; no autoplay.
     max-width 600px → 9:16 file, otherwise 16:9 (re-checked on every open). Reopening resumes where it was paused,
     except after the video ended: then it restarts from 0:00.
   • Inline players ([data-demo-inline], guide) pick their file with <source media>; this only swaps the poster
     on narrow screens. */
(function(){
  'use strict';
  if (window.__hwDemo) return;
  var BASE = '/assets/video/hirewire-demo-';
  var NARROW = '(max-width: 600px)';
  function isNarrow(){ try { return !!(window.matchMedia && window.matchMedia(NARROW).matches); } catch(e){ return false; } }
  function pick(narrow){ var k = narrow ? '9x16' : '16x9'; return { src:BASE + k + '.mp4', poster:BASE + k + '-poster.jpg', k:k }; }
  function de(){ return /^de\b/i.test(document.documentElement.getAttribute('lang') || ''); }
  var L = de()
    ? { title:'HireWire in 90 Sekunden', close:'Video schließen', note:'Ohne Ton, mit englischen Untertiteln.' }
    : { title:'HireWire in 90 seconds', close:'Close video', note:'No sound needed: captions are burned in.' };
  var INK = 'var(--ink,#17130C)', PAPER = 'var(--paper,#F6F1E6)';
  var CSS = 'dialog.hwdemo{padding:0;margin:auto;border:1px solid ' + INK + ';background:' + PAPER + ';color:' + INK + ';width:min(960px,calc(100vw - 32px));max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.35)}' +
    'dialog.hwdemo::backdrop{background:rgba(23,19,12,.78)}' +
    'dialog.hwdemo.hwdemo-fb[open]{position:fixed;inset:0;z-index:2147483000;box-shadow:0 0 0 100vmax rgba(23,19,12,.78)}' +
    '.hwdemo-trap{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}' +
    '.hwdemo-box{display:flex;flex-direction:column}' +
    '.hwdemo-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 14px;border-bottom:1px solid ' + INK + '}' +
    '.hwdemo-t{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;font-family:inherit}' +
    '.hwdemo-x{background:none;border:1px solid ' + INK + ';color:inherit;width:34px;height:34px;font-size:18px;line-height:1;cursor:pointer;font-family:inherit}' +
    '.hwdemo-x:hover,.hwdemo-x:focus-visible{background:' + INK + ';color:' + PAPER + '}' +
    '.hwdemo video{display:block;width:100%;height:auto;max-height:calc(100vh - 140px);background:#17130C;aspect-ratio:16/9}' +
    'dialog.hwdemo.narrow{width:auto}' +
    '.hwdemo.narrow video{aspect-ratio:9/16;width:auto;max-width:100%;height:calc(100vh - 140px);height:calc(100dvh - 140px)}' +
    '.hwdemo-note{margin:0;padding:6px 14px 8px;font-size:10px;letter-spacing:.06em;color:var(--ink2,#6A6250)}' +
    'html.hwdemo-open{overflow:hidden}';
  var dlg = null, vid = null, closeBtn = null, opener = null, cur = '', native = false, active = false;

  function build(){
    if (dlg) return;
    var st = document.createElement('style'); st.id = 'hwdemoCss'; st.textContent = CSS; document.head.appendChild(st);
    dlg = document.createElement('dialog'); dlg.className = 'hwdemo'; dlg.id = 'hwDemo';
    dlg.setAttribute('aria-labelledby', 'hwDemoT'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = '<span class="hwdemo-trap" tabindex="0" data-trap="start"></span>' +
      '<div class="hwdemo-box">' +
      '<div class="hwdemo-head"><h2 class="hwdemo-t" id="hwDemoT"></h2><button type="button" class="hwdemo-x" id="hwDemoX">×</button></div>' +
      '<video id="hwDemoV" controls playsinline preload="none" tabindex="0"></video>' +
      '<p class="hwdemo-note"></p></div>' +
      '<span class="hwdemo-trap" tabindex="0" data-trap="end"></span>';
    document.body.appendChild(dlg);
    native = typeof dlg.showModal === 'function';
    if (!native) dlg.classList.add('hwdemo-fb');
    vid = dlg.querySelector('video'); closeBtn = dlg.querySelector('.hwdemo-x');
    dlg.querySelector('.hwdemo-t').textContent = L.title;
    dlg.querySelector('.hwdemo-note').textContent = L.note;
    closeBtn.setAttribute('aria-label', L.close); closeBtn.title = L.close;
    vid.setAttribute('webkit-playsinline', '');
    closeBtn.addEventListener('click', close);
    // backdrop: with showModal a click on ::backdrop targets the <dialog> itself (its content fills the box, padding 0)
    dlg.addEventListener('mousedown', function(e){ dlg.__downOut = (e.target === dlg); });
    dlg.addEventListener('click', function(e){ if (e.target === dlg && dlg.__downOut !== false) close(); });
    dlg.addEventListener('cancel', function(e){ e.preventDefault(); close(); });   // Esc / close request (native)
    dlg.addEventListener('close', function(){ if (dlg.__closing) return; finish(); });   // closed some other way
    Array.prototype.forEach.call(dlg.querySelectorAll('.hwdemo-trap'), function(t){
      t.addEventListener('focus', function(){ var f = focusables(); if (!f.length) return; (t.getAttribute('data-trap') === 'start' ? f[f.length - 1] : f[0]).focus(); });
    });
  }
  function focusables(){
    return Array.prototype.filter.call(dlg.querySelectorAll('.hwdemo-box button,.hwdemo-box video[controls]'), function(el){ return !el.disabled; });
  }
  function onKey(e){ if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()){ e.preventDefault(); e.stopPropagation(); close(); } }
  function onFocusIn(e){ if (isOpen() && !dlg.contains(e.target)){ e.stopPropagation(); closeBtn.focus(); } }
  function onDocClick(e){ if (!native && isOpen() && !dlg.contains(e.target)){ e.preventDefault(); e.stopPropagation(); close(); } }
  function isOpen(){ return !!(dlg && dlg.open); }
  function open(trigger){
    build();
    if (isOpen()) return;
    opener = trigger || document.activeElement; active = true;
    var narrow = isNarrow(), p = pick(narrow);
    dlg.classList.toggle('narrow', narrow);
    if (cur !== p.k){                     // first open, or the viewport crossed 600px since the last one
      cur = p.k;
      vid.setAttribute('poster', p.poster);
      vid.setAttribute('src', p.src); vid.setAttribute('data-file', p.k);
    }
    if (vid.ended){ try { vid.currentTime = 0; } catch(e){} }   // reopened after the end: start again from 0:00 (otherwise resume)
    if (native){ try { dlg.showModal(); } catch(e){ dlg.setAttribute('open', ''); } } else dlg.setAttribute('open', '');
    document.documentElement.classList.add('hwdemo-open');
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('keydown', onKey, true);      // fallback + belt and braces; native Esc arrives as 'cancel'
    document.addEventListener('click', onDocClick, true);
    try { closeBtn.focus(); } catch(e){}
    try { if (typeof window.hwTrack === 'function') window.hwTrack('demo_video_open', { file:p.k }); } catch(e){}
  }
  function close(){
    if (!isOpen()) return;
    dlg.__closing = true;
    try { if (native && dlg.close) dlg.close(); else dlg.removeAttribute('open'); } catch(e){ dlg.removeAttribute('open'); }
    if (dlg.open) dlg.removeAttribute('open');
    dlg.__closing = false;
    finish();
  }
  function finish(){
    if (!active) return; active = false;
    try { vid.pause(); } catch(e){}
    document.documentElement.classList.remove('hwdemo-open');
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('click', onDocClick, true);
    var o = opener; opener = null;
    if (o && typeof o.focus === 'function' && document.contains(o)){ try { o.focus(); } catch(e){} }
  }
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('[data-demo-open]') : null;
    if (!a) return;
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // new tab / window: plain link to the MP4
    e.preventDefault();
    open(a);
  });
  function inline(){
    if (!isNarrow()) return;
    Array.prototype.forEach.call(document.querySelectorAll('video[data-demo-inline]'), function(v){
      if (v.getAttribute('data-poster-narrow')) v.setAttribute('poster', v.getAttribute('data-poster-narrow'));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inline); else inline();
  window.__hwDemo = { open:open, close:close, isOpen:isOpen, pick:pick };
})();
