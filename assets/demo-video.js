/* HireWire demo video (2026-10-16): "▶ Watch the 90-sec demo" modal + responsive inline players.
   Source of truth: work/growth-src/demo-video.js. apply_demo.py inlines it into index.html and copies it to
   repo/assets/demo-video.js for the static pages (de/index.html, guide.html).
   • Links with [data-demo-open] open an accessible modal: role=dialog, aria-modal, close button, Esc, backdrop click,
     focus trapped inside (sentinels + focusin guard) and returned to the link afterwards; the video pauses on close.
   • Nothing video-related exists in the DOM until the first click: zero video (and poster) bytes before it.
   • The <video> uses controls, playsinline, preload="none" and a poster; no autoplay.
     max-width 600px → 9:16 file, otherwise 16:9 (re-checked on every open).
   • Inline players ([data-demo-inline], guide) pick their file with <source media>; this only swaps the poster
     and box shape on narrow screens. */
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
  var CSS = '.hwdemo{position:fixed;inset:0;z-index:2147483000;background:rgba(23,19,12,.78);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.hwdemo[hidden]{display:none}' +
    '.hwdemo-trap{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}' +
    '.hwdemo-box{position:relative;background:var(--paper,#F6F1E6);color:var(--ink,#17130C);border:1px solid var(--ink,#17130C);width:min(960px,100%);max-height:100%;display:flex;flex-direction:column;box-shadow:0 18px 60px rgba(0,0,0,.35)}' +
    '.hwdemo-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 14px;border-bottom:1px solid var(--ink,#17130C)}' +
    '.hwdemo-t{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;font-family:inherit}' +
    '.hwdemo-x{background:none;border:1px solid var(--ink,#17130C);color:inherit;width:34px;height:34px;font-size:18px;line-height:1;cursor:pointer;font-family:inherit}' +
    '.hwdemo-x:hover,.hwdemo-x:focus-visible{background:var(--ink,#17130C);color:var(--paper,#F6F1E6)}' +
    '.hwdemo video{display:block;width:100%;height:auto;max-height:calc(100vh - 120px);background:#17130C;aspect-ratio:16/9}' +
    '.hwdemo.narrow .hwdemo-box{width:auto;max-width:100%}' +
    '.hwdemo.narrow video{aspect-ratio:9/16;width:auto;max-width:100%;height:calc(100vh - 120px);height:calc(100dvh - 120px)}' +
    '.hwdemo-note{margin:0;padding:6px 14px 8px;font-size:10px;letter-spacing:.06em;color:var(--ink2,#6A6250)}' +
    'html.hwdemo-open{overflow:hidden}';
  var ov = null, box = null, vid = null, closeBtn = null, opener = null, cur = '';

  function build(){
    if (ov) return;
    var st = document.createElement('style'); st.id = 'hwdemoCss'; st.textContent = CSS; document.head.appendChild(st);
    ov = document.createElement('div'); ov.className = 'hwdemo'; ov.id = 'hwDemo'; ov.hidden = true;
    ov.innerHTML = '<span class="hwdemo-trap" tabindex="0" data-trap="start"></span>' +
      '<div class="hwdemo-box" role="dialog" aria-modal="true" aria-labelledby="hwDemoT" tabindex="-1">' +
      '<div class="hwdemo-head"><h2 class="hwdemo-t" id="hwDemoT"></h2><button type="button" class="hwdemo-x" id="hwDemoX">×</button></div>' +
      '<video id="hwDemoV" controls playsinline preload="none" tabindex="0"></video>' +
      '<p class="hwdemo-note"></p></div>' +
      '<span class="hwdemo-trap" tabindex="0" data-trap="end"></span>';
    document.body.appendChild(ov);
    box = ov.querySelector('.hwdemo-box'); vid = ov.querySelector('video'); closeBtn = ov.querySelector('.hwdemo-x');
    ov.querySelector('.hwdemo-t').textContent = L.title;
    ov.querySelector('.hwdemo-note').textContent = L.note;
    closeBtn.setAttribute('aria-label', L.close); closeBtn.title = L.close;
    vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', '');
    vid.preload = 'none'; vid.setAttribute('preload', 'none');
    closeBtn.addEventListener('click', close);
    ov.addEventListener('mousedown', function(e){ ov.__downOnBackdrop = (e.target === ov); });
    ov.addEventListener('click', function(e){ if (e.target === ov && ov.__downOnBackdrop !== false) close(); });
    // focus trap with sentinels, so Tab still walks through the video's own (shadow-DOM) controls natively
    Array.prototype.forEach.call(ov.querySelectorAll('.hwdemo-trap'), function(t){
      t.addEventListener('focus', function(){ var f = focusables(); if (!f.length) return box.focus(); (t.getAttribute('data-trap') === 'start' ? f[f.length - 1] : f[0]).focus(); });
    });
  }
  function focusables(){
    return Array.prototype.filter.call(box.querySelectorAll('button,[href],video[controls],[tabindex]:not([tabindex="-1"])'),
      function(el){ return !el.disabled && !el.hidden && !(el.parentElement && el.parentElement.closest('video')); });
  }
  function onKey(e){
    if (e.key === 'Escape' || e.key === 'Esc'){ e.preventDefault(); e.stopPropagation(); close(); }
  }
  function onFocusIn(e){ if (ov && !ov.hidden && !ov.contains(e.target)){ e.stopPropagation(); closeBtn.focus(); } }
  function open(trigger){
    build();
    opener = trigger || document.activeElement;
    var narrow = isNarrow(), p = pick(narrow);
    ov.classList.toggle('narrow', narrow);
    if (cur !== p.k){                     // first open, or the viewport crossed 600px since the last one
      cur = p.k;
      vid.poster = p.poster; vid.setAttribute('poster', p.poster);
      vid.setAttribute('src', p.src); vid.dataset.file = p.k;
    }
    ov.hidden = false;
    document.documentElement.classList.add('hwdemo-open');
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('keydown', onKey, true);   // capture on document: Esc works wherever focus sits (video controls, body)
    try { closeBtn.focus(); } catch(e){}
    try { if (typeof window.hwTrack === 'function') window.hwTrack('demo_video_open', { file:p.k }); } catch(e){}
  }
  function close(){
    if (!ov || ov.hidden) return;
    try { vid.pause(); } catch(e){}
    ov.hidden = true;
    document.documentElement.classList.remove('hwdemo-open');
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('keydown', onKey, true);
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
    var narrow = isNarrow();
    Array.prototype.forEach.call(document.querySelectorAll('video[data-demo-inline]'), function(v){
      if (narrow && v.dataset.posterNarrow){ v.poster = v.dataset.posterNarrow; v.classList.add('narrow'); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inline); else inline();
  window.__hwDemo = { open:open, close:close, isOpen:function(){ return !!(ov && !ov.hidden); }, pick:pick };
})();
