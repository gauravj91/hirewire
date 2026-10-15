/* HireWire — standalone salary checker (/salary-checker.html).
   Uses window.HWFeedsLite (assets/feeds-lite.js: the app's own salary helpers, copied verbatim, plus two public feeds).
   Your browser fetches the feeds directly; nothing is sent to HireWire and nothing is stored. */
(function(){
  'use strict';
  var F = window.HWFeedsLite;
  var root = document.getElementById('salTool');
  if (!F || !root) return;
  var DEEPLINK = false;   // flip to true once the app understands /#salary?role=&level=&loc= (see CHANGES-pages-growth.md)
  var $ = function(id){ return document.getElementById(id); };
  var cache = {};          // per page view only
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function money(usd, cur){
    if (usd == null) return '—';
    var v = Math.round(usd / (F.FX[cur] || 1) / 1000) * 1000;
    try { return new Intl.NumberFormat('en-GB', { style:'currency', currency:cur, maximumFractionDigits:0 }).format(v); }
    catch(e){ return F.curSym(cur) + v.toLocaleString('en-US'); }
  }
  function range(j){
    var c = F.curSym(j.currency || 'USD'), k = function(v){ return Math.round(v / 1000) + 'k'; };
    if (j.salaryMin && j.salaryMax) return c + k(j.salaryMin) + '–' + k(j.salaryMax);
    if (j.salaryMax) return 'up to ' + c + k(j.salaryMax);
    if (j.salaryMin) return c + k(j.salaryMin) + '+';
    return '';
  }
  function tokens(s){ return String(s || '').split(/\s+/).filter(Boolean); }
  function roleMatch(qRole, role){
    var words = ' ' + role + ' ';
    return tokens(qRole).every(function(t){ return words.indexOf(' ' + t + ' ') >= 0 || words.indexOf(' ' + t) >= 0; });
  }
  function status(msg, bad){ var s = $('salStatus'); s.textContent = msg || ''; s.className = 'hint' + (bad ? ' err' : ''); }

  async function load(q){
    var key = q.toLowerCase();
    if (cache[key]) return cache[key];
    var settled = await Promise.all(F.LITE_SOURCES.map(function(src){
      return F.liteFetch(src, q).then(function(jobs){ return { src:src, jobs:jobs }; }, function(err){ return { src:src, jobs:[], err:String(err && err.message || err) }; });
    }));
    cache[key] = settled;
    return settled;
  }

  async function run(){
    var q = $('salRole').value.trim(), level = $('salLevel').value, loc = $('salLoc').value.trim().toLowerCase(), cur = $('salCur').value;
    var btn = $('salGo'); btn.disabled = true; status('Fetching live postings from Remotive and RemoteOK…');
    var settled;
    try { settled = await load(q); } finally { btn.disabled = false; }
    var qRole = q ? F.salRole(q).role : '';
    var seen = {}, recs = [], srcLines = [];
    settled.forEach(function(s){
      var withPay = 0;
      s.jobs.forEach(function(j){
        var k = (j.company + '|' + j.title).toLowerCase();
        if (seen[k]) return; seen[k] = 1;
        var r = F.salRole(j.title), usd = F.salaryUsd(j.salaryMin, j.salaryMax, j.currency);
        if (usd) withPay++;
        if (qRole && !roleMatch(qRole, r.role)) return;
        if (level !== '*' && r.level !== level) return;
        if (loc && String(j.location || '').toLowerCase().indexOf(loc) < 0) return;
        recs.push({ job:j, role:r.role, level:r.level, usd:usd });
      });
      srcLines.push(s.err ? s.src.label + ': could not be reached from your browser (' + s.err + ')'
        : s.src.label + ': ' + s.jobs.length + ' live postings, ' + withPay + ' with annual pay');
    });
    var st = F.salStats(recs);
    var h = '';
    if (st.n >= F.SAL_MIN_N){
      h += '<div class="stats">' +
        '<div><span class="lbl">Median</span><b>' + esc(money(st.median, cur)) + '</b></div>' +
        '<div><span class="lbl">P25 – P75</span><b>' + esc(money(st.p25, cur)) + '–' + esc(money(st.p75, cur).replace(/^[^\d]+/, '')) + '</b></div>' +
        '<div><span class="lbl">Postings with pay</span><b>' + st.n + '</b></div>' +
        '<div><span class="lbl">Pay disclosed</span><b>' + st.pct + '%</b></div>' +
      '</div>';
    } else {
      h += '<p><b>Not enough data for a median:</b> ' + st.n + ' posting' + (st.n === 1 ? '' : 's') + ' with annual pay out of ' + st.total +
        ' matched right now (HireWire needs at least ' + F.SAL_MIN_N + '). Try a broader role or level, or leave the location empty.</p>';
    }
    h += '<p class="muted">From ' + st.total + ' matching live remote postings (' + esc(srcLines.join(' · ')) + '). Each posting counts once at the midpoint of its range, converted with static, approximate exchange rates. Hourly and monthly figures are left out. <b>This is a snapshot of public postings, not market-wide pay data.</b></p>';
    var paid = recs.filter(function(r){ return r.usd; }).sort(function(a, b){ return b.usd - a.usd; }).slice(0, 40);
    if (paid.length){
      h += '<div class="tablewrap"><table><thead><tr><th>Role</th><th>Company</th><th>Where</th><th>Posted pay</th><th>≈ ' + esc(cur) + ' (midpoint)</th></tr></thead><tbody>' +
        paid.map(function(r){
          var j = r.job, u = /^https:\/\//.test(j.url) ? j.url : '';
          return '<tr><td>' + (u ? '<a href="' + esc(u) + '" rel="noopener nofollow" target="_blank">' + esc(j.title) + '</a>' : esc(j.title)) + '</td><td>' + esc(j.company) +
            '</td><td>' + esc(j.location) + '</td><td>' + esc(range(j)) + '</td><td>' + esc(money(r.usd, cur)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    $('salOut').innerHTML = h;
    $('salResult').hidden = false;
    var a = $('salApp');
    if (a && DEEPLINK) a.href = '/#salary?role=' + encodeURIComponent(qRole) + '&level=' + encodeURIComponent(level) + '&loc=' + encodeURIComponent(loc);
    status(settled.every(function(s){ return s.err; }) ? 'Neither feed could be reached from your browser. A content blocker or network filter may be stopping it.' : '', settled.every(function(s){ return s.err; }));
  }
  $('salGo').addEventListener('click', function(){ run().catch(function(e){ status('Something went wrong: ' + e.message, true); }); });
  $('salForm').addEventListener('submit', function(ev){ ev.preventDefault(); $('salGo').click(); });
  var lv = $('salLevel');
  F.SAL_LEVEL_NAMES.forEach(function(n){ var o = document.createElement('option'); o.value = n; o.textContent = n; lv.appendChild(o); });
  window.HWSalaryPage = { roleMatch:roleMatch, money:money };
})();
