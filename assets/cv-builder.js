/* HireWire CV builder (/cv-builder.html, /de/lebenslauf-vorlage.html). Built 2026-10-21.
   Client-side only: no network requests, no analytics, no upload. The CV lives in this page and, when "Remember in this
   browser" is on (the default), in localStorage under hirewire.cvbuilder.v1. PDF = the browser's own print-to-PDF of the
   preview sheet (real, selectable text, so ATS parsers can read it).
   Hand-off to the app (same origin, still nothing leaves the browser): the plain-text CV is written to
   localStorage hirewire.cvbuilder.handoff.v1 and the app is opened at /#hw-cv; the app reads it once, deletes it, loads the
   CV for skill extraction + AI fit scores + Pass Plus tailored CVs (work/growth-src/apply_cvb.py).
   Templates: classic, modern, compact (single-column, ATS-safe) and lebenslauf (German tabular CV, optional photo). */
(function(){
  'use strict';
  var KEY = 'hirewire.cvbuilder.v1', HANDOFF = 'hirewire.cvbuilder.handoff.v1', PREF = 'hirewire.cvbuilder.remember';
  var TEMPLATES = ['classic', 'modern', 'compact', 'lebenslauf'];
  var UI = {
    en: {
      tpl:'Template', tplNames:{ classic:'Classic', modern:'Modern', compact:'Compact', lebenslauf:'German Lebenslauf' },
      cvlang:'CV language', paper:'Paper', pdf:'Download PDF', score:'Score it against live jobs →', more:'More',
      example:'Load example', exportJson:'Save as file (.json)', importJson:'Open a saved file', clear:'Clear everything',
      remember:'Remember in this browser', saved:'Saved in this browser', notSaved:'Not saved: this CV disappears when you close the page',
      storageOff:'This browser blocks storage, so the CV is not kept after you close the page. Save it as a file instead.',
      edit:'Edit', preview:'Preview',
      personal:'Personal details', name:'Full name', headline:'Job title / headline', email:'Email', phone:'Phone', location:'City, country',
      address:'Address (optional)', web:'Website or portfolio', linkedin:'LinkedIn', birth:'Date of birth (optional)', nationality:'Nationality (optional)',
      photo:'Photo (optional)', photoAdd:'Add photo', photoRemove:'Remove photo',
      photoHint:'Shown only on the German Lebenslauf template. Not required in Germany and usually left out in the UK and US.',
      birthHint:'Leave these out unless a job asks for them; they are shown only on the Lebenslauf template.',
      summary:'Summary', summaryPh:'2–3 lines: who you are, what you are good at, what you want next.',
      experience:'Experience', role:'Job title', org:'Employer', place:'Location', start:'Start', end:'End', datePh:'MM/YYYY', current:'I work here now',
      bullets:'Achievements (one per line)', bulletsPh:'Cut API response time by 40% by …\nLed a team of 4 …', addExp:'+ Add position',
      education:'Education', degree:'Degree / qualification', school:'School / university', details:'Details (one per line)', detailsPh:'Grade, thesis, focus …', addEdu:'+ Add education',
      skills:'Skills', skillsPh:'One group per line, e.g.\nLanguages: Python, Go, SQL\nTools: Docker, Terraform, GitHub Actions',
      languages:'Languages', languagesPh:'One per line, e.g.\nEnglish: native\nGerman: B2',
      extras:'More sections', extraTitle:'Section title', extraTitlePh:'Certifications, Projects, Volunteering …', extraLines:'Lines (one per line)', addExtra:'+ Add section',
      signature:'Place, date and signature line', sigPlace:'Place', sigDate:'Date', sigHint:'Traditional at the end of a German Lebenslauf; optional for online applications.',
      up:'Move up', down:'Move down', remove:'Remove', entry:'entry',
      needMore:'Add a little more first: HireWire needs at least 200 characters of CV text to score jobs.',
      confirmClear:'Delete this CV from the page and from this browser?', confirmExample:'Replace what you have typed with the example CV?',
      badFile:'That file is not a HireWire CV file (.json).', loaded:'CV loaded from your file.',
      printTip:'In the print dialog, choose “Save as PDF” as the destination. Tip: turn off “Headers and footers”.',
      pages:function(n){ return n > 1 ? 'about ' + n + ' pages' : '1 page'; }, pageBreak:'page break'
    },
    de: {
      tpl:'Vorlage', tplNames:{ classic:'Klassisch', modern:'Modern', compact:'Kompakt', lebenslauf:'Tabellarischer Lebenslauf' },
      cvlang:'Sprache des Lebenslaufs', paper:'Papier', pdf:'Als PDF herunterladen', score:'Mit echten Jobs abgleichen →', more:'Mehr',
      example:'Beispiel laden', exportJson:'Als Datei sichern (.json)', importJson:'Gesicherte Datei öffnen', clear:'Alles löschen',
      remember:'In diesem Browser merken', saved:'In diesem Browser gespeichert', notSaved:'Nicht gespeichert: Der Lebenslauf ist weg, wenn du die Seite schließt',
      storageOff:'Dieser Browser blockiert den Speicher, der Lebenslauf bleibt nach dem Schließen nicht erhalten. Sichere ihn als Datei.',
      edit:'Bearbeiten', preview:'Vorschau',
      personal:'Persönliche Daten', name:'Vor- und Nachname', headline:'Berufsbezeichnung', email:'E-Mail', phone:'Telefon', location:'Ort, Land',
      address:'Anschrift (optional)', web:'Website oder Portfolio', linkedin:'LinkedIn', birth:'Geburtsdatum und -ort (optional)', nationality:'Staatsangehörigkeit (optional)',
      photo:'Bewerbungsfoto (optional)', photoAdd:'Foto hinzufügen', photoRemove:'Foto entfernen',
      photoHint:'Erscheint nur in der Vorlage „Tabellarischer Lebenslauf“. Ein Foto ist in Deutschland üblich, aber keine Pflicht.',
      birthHint:'Nur angeben, wenn du möchtest; erscheint nur in der Vorlage „Tabellarischer Lebenslauf“.',
      summary:'Kurzprofil', summaryPh:'2–3 Zeilen: wer du bist, was du gut kannst, was du als Nächstes suchst.',
      experience:'Berufserfahrung', role:'Position', org:'Arbeitgeber', place:'Ort', start:'Beginn', end:'Ende', datePh:'MM/JJJJ', current:'Aktuelle Stelle',
      bullets:'Aufgaben und Erfolge (eine pro Zeile)', bulletsPh:'Antwortzeiten der API um 40 % gesenkt durch …\nTeam mit 4 Personen geführt …', addExp:'+ Station hinzufügen',
      education:'Ausbildung', degree:'Abschluss', school:'Schule / Hochschule', details:'Details (eine pro Zeile)', detailsPh:'Note, Abschlussarbeit, Schwerpunkt …', addEdu:'+ Ausbildung hinzufügen',
      skills:'Kenntnisse', skillsPh:'Eine Gruppe pro Zeile, z. B.\nEDV: Excel, SAP, Python\nFührerschein: Klasse B',
      languages:'Sprachen', languagesPh:'Eine pro Zeile, z. B.\nDeutsch: Muttersprache\nEnglisch: C1',
      extras:'Weitere Abschnitte', extraTitle:'Überschrift', extraTitlePh:'Zertifikate, Projekte, Ehrenamt, Interessen …', extraLines:'Zeilen (eine pro Zeile)', addExtra:'+ Abschnitt hinzufügen',
      signature:'Ort, Datum und Unterschrift', sigPlace:'Ort', sigDate:'Datum', sigHint:'Klassischer Abschluss eines tabellarischen Lebenslaufs; bei Online-Bewerbungen optional.',
      up:'Nach oben', down:'Nach unten', remove:'Entfernen', entry:'Eintrag',
      needMore:'Schreib erst noch etwas mehr: HireWire braucht mindestens 200 Zeichen Lebenslauf-Text, um Jobs zu bewerten.',
      confirmClear:'Diesen Lebenslauf aus der Seite und aus diesem Browser löschen?', confirmExample:'Deine Eingaben durch den Beispiel-Lebenslauf ersetzen?',
      badFile:'Diese Datei ist keine HireWire-Lebenslauf-Datei (.json).', loaded:'Lebenslauf aus deiner Datei geladen.',
      printTip:'Wähle im Druckdialog „Als PDF speichern“ als Ziel. Tipp: „Kopf- und Fußzeilen“ ausschalten.',
      pages:function(n){ return n > 1 ? 'etwa ' + n + ' Seiten' : '1 Seite'; }, pageBreak:'Seitenumbruch'
    }
  };
  var CVL = {   // headings inside the CV, by CV language
    en: { summary:'Summary', experience:'Experience', education:'Education', skills:'Skills', languages:'Languages', personal:'Personal details',
          present:'Present', title:'Curriculum Vitae', name:'Name', address:'Address', phone:'Phone', email:'Email', birth:'Date of birth',
          nationality:'Nationality', web:'Website', linkedin:'LinkedIn', location:'Location', signature:'Signature',
          months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], namePh:'Your Name' },
    de: { summary:'Kurzprofil', experience:'Berufserfahrung', education:'Ausbildung', skills:'Kenntnisse', languages:'Sprachen', personal:'Persönliche Daten',
          present:'heute', title:'Lebenslauf', name:'Name', address:'Anschrift', phone:'Telefon', email:'E-Mail', birth:'Geburtsdatum',
          nationality:'Staatsangehörigkeit', web:'Website', linkedin:'LinkedIn', location:'Wohnort', signature:'Unterschrift',
          months:null, namePh:'Vorname Nachname' }
  };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function lines(s){ return String(s || '').split(/\r?\n/).map(function(x){ return x.replace(/^\s*[-•*·]\s*/, '').trim(); }).filter(Boolean); }
  function clip(s, n){ return String(s == null ? '' : s).slice(0, n); }

  function blank(lang){
    return { v:1, template: lang === 'de' ? 'lebenslauf' : 'classic', lang: lang, paper: lang === 'de' ? 'a4' : 'a4',
      basics:{ name:'', headline:'', email:'', phone:'', location:'', address:'', web:'', linkedin:'', birth:'', nationality:'', photo:'' },
      summary:'', experience:[ { role:'', org:'', place:'', start:'', end:'', current:false, bullets:'' } ],
      education:[ { degree:'', school:'', place:'', start:'', end:'', details:'' } ],
      skills:'', languages:'', extras:[], sig:{ show:true, place:'', date:'' } };
  }
  var EXAMPLES = {
    en: { v:1, template:'classic', lang:'en', paper:'a4',
      basics:{ name:'Alex Morgan', headline:'Backend Engineer', email:'alex.morgan@example.com', phone:'+49 151 2345 6789', location:'Berlin, Germany',
               address:'', web:'alexmorgan.dev', linkedin:'linkedin.com/in/alexmorgan', birth:'', nationality:'', photo:'' },
      summary:'Backend engineer with 6 years of experience building payment and data APIs in Go and Python. I like owning services end to end, from design review to on-call, and I am looking for a product team in Berlin or remote in the EU.',
      experience:[
        { role:'Senior Backend Engineer', org:'Ledgerly GmbH', place:'Berlin', start:'03/2022', end:'', current:true,
          bullets:'Designed the payouts service in Go handling 2M transactions a month with 99.98% uptime\nCut p95 API latency from 480 ms to 190 ms by moving hot reads to Redis and fixing N+1 queries\nMentored 3 engineers; introduced design docs and blameless post-mortems' },
        { role:'Backend Engineer', org:'Shopwise', place:'Munich', start:'09/2019', end:'02/2022', current:false,
          bullets:'Built the order-export pipeline (Python, Kafka, PostgreSQL) used by 1,200 merchants\nAutomated deployments with Terraform and GitHub Actions, reducing release time from 2 hours to 15 minutes' } ],
      education:[ { degree:'MSc Computer Science', school:'Technical University of Munich', place:'Munich', start:'10/2017', end:'08/2019', details:'Thesis: Consistency trade-offs in event-sourced payment systems' } ],
      skills:'Languages: Go, Python, SQL, TypeScript\nData: PostgreSQL, Redis, Kafka\nInfrastructure: Docker, Kubernetes, Terraform, AWS, GitHub Actions',
      languages:'English: fluent\nGerman: B2', extras:[ { title:'Certifications', lines:'AWS Certified Developer – Associate (2023)' } ],
      sig:{ show:false, place:'', date:'' } },
    de: { v:1, template:'lebenslauf', lang:'de', paper:'a4',
      basics:{ name:'Max Mustermann', headline:'Kaufmann für Büromanagement', email:'max.mustermann@example.de', phone:'+49 30 1234567', location:'Berlin',
               address:'Musterstraße 12, 10115 Berlin', web:'', linkedin:'', birth:'14.05.1995 in Hamburg', nationality:'deutsch', photo:'' },
      summary:'Organisationsstarker Kaufmann für Büromanagement mit 5 Jahren Erfahrung in Assistenz und Buchhaltung, sicher in SAP und MS Office.',
      experience:[
        { role:'Teamassistenz der Geschäftsführung', org:'Muster Logistik GmbH', place:'Berlin', start:'04/2021', end:'', current:true,
          bullets:'Terminkoordination und Reiseplanung für drei Geschäftsführer\nVorbereitende Buchhaltung und Rechnungsprüfung in SAP\nEinführung einer digitalen Ablage, Bearbeitungszeit für Anfragen um 30 % gesenkt' },
        { role:'Sachbearbeiter Auftragsabwicklung', org:'Beispiel Handel AG', place:'Hamburg', start:'08/2018', end:'03/2021', current:false,
          bullets:'Auftragserfassung und Kundenkorrespondenz auf Deutsch und Englisch\nReklamationsbearbeitung für rund 200 Geschäftskunden' } ],
      education:[
        { degree:'Ausbildung zum Kaufmann für Büromanagement', school:'Beispiel Handel AG / Berufsschule Hamburg', place:'Hamburg', start:'08/2015', end:'07/2018', details:'Abschlussnote: 1,9' },
        { degree:'Allgemeine Hochschulreife', school:'Gymnasium am Stadtpark', place:'Hamburg', start:'', end:'06/2015', details:'' } ],
      skills:'EDV: MS Office (sehr gut), SAP S/4HANA, DATEV\nFührerschein: Klasse B',
      languages:'Deutsch: Muttersprache\nEnglisch: verhandlungssicher (C1)\nSpanisch: Grundkenntnisse (A2)', extras:[ { title:'Interessen', lines:'Laufen, Fotografie' } ],
      sig:{ show:true, place:'Berlin', date:'' } }
  };

  /* ---- sanitising a loaded / imported CV (untrusted) ---- */
  function norm(raw, lang){
    var d = blank(lang); if (!raw || typeof raw !== 'object') return d;
    if (TEMPLATES.indexOf(raw.template) >= 0) d.template = raw.template;
    if (raw.lang === 'en' || raw.lang === 'de') d.lang = raw.lang;
    if (raw.paper === 'a4' || raw.paper === 'letter') d.paper = raw.paper;
    var b = raw.basics || {};
    Object.keys(d.basics).forEach(function(k){ if (k !== 'photo' && typeof b[k] === 'string') d.basics[k] = clip(b[k], 300); });
    if (typeof b.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo) && b.photo.length < 400000) d.basics.photo = b.photo;
    if (typeof raw.summary === 'string') d.summary = clip(raw.summary, 3000);
    function arr(a, keys, max){
      if (!Array.isArray(a)) return null;
      return a.slice(0, max).map(function(x){ var o = {}; keys.forEach(function(k){ o[k] = k === 'current' ? !!(x && x[k]) : clip(x && typeof x[k] === 'string' ? x[k] : '', k === 'bullets' || k === 'details' || k === 'lines' ? 4000 : 300); }); return o; });
    }
    d.experience = arr(raw.experience, ['role','org','place','start','end','current','bullets'], 30) || d.experience;
    d.education = arr(raw.education, ['degree','school','place','start','end','details'], 20) || d.education;
    d.extras = arr(raw.extras, ['title','lines'], 12) || [];
    if (typeof raw.skills === 'string') d.skills = clip(raw.skills, 4000);
    if (typeof raw.languages === 'string') d.languages = clip(raw.languages, 2000);
    var s = raw.sig || {}; d.sig = { show: s.show !== false, place: clip(typeof s.place === 'string' ? s.place : '', 100), date: clip(typeof s.date === 'string' ? s.date : '', 40) };
    return d;
  }

  /* ---- dates: "09/2021", "9.2021", "2021-09", "2021" ---- */
  function fmtDate(s, L){
    s = String(s || '').trim(); if (!s) return '';
    var m = s.match(/^(\d{1,2})\s*[\/.\-]\s*(\d{4})$/) || null, y, mo;
    if (m){ mo = +m[1]; y = m[2]; }
    else if ((m = s.match(/^(\d{4})\s*[\/.\-]\s*(\d{1,2})$/))){ y = m[1]; mo = +m[2]; }
    if (!m || mo < 1 || mo > 12) return s;
    return L.months ? L.months[mo - 1] + ' ' + y : (mo < 10 ? '0' : '') + mo + '/' + y;
  }
  function range(start, end, current, L){
    var a = fmtDate(start, L), b = current ? L.present : fmtDate(end, L);
    if (a && b) return a + ' – ' + b;
    return a ? (current ? a + ' – ' + L.present : a) : b;
  }
  function todayStr(lang){ var d = new Date(); return lang === 'de' ? ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear() : d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); }
  function kv(line){ var i = line.indexOf(':'); return i > 0 && i < 40 ? [line.slice(0, i).trim(), line.slice(i + 1).trim()] : null; }

  /* ---- rendering the sheet ---- */
  function contactBits(b){ return [b.location, b.phone, b.email, b.web, b.linkedin].filter(function(x){ return x && x.trim(); }); }
  function renderAts(cv){
    var L = CVL[cv.lang], b = cv.basics, h = [];
    h.push('<header class="cv-head"><h1 class="cv-name' + (b.name ? '' : ' cv-ph') + '">' + esc(b.name || L.namePh) + '</h1>' +
      (b.headline ? '<p class="cv-headline">' + esc(b.headline) + '</p>' : '') +
      (contactBits(b).length ? '<p class="cv-contact">' + contactBits(b).map(esc).join('<span class="cv-sep"> | </span>') + '</p>' : '') + '</header>');
    if (cv.summary.trim()) h.push('<section class="cv-sec"><h2>' + L.summary + '</h2><p>' + esc(cv.summary.trim()).replace(/\n/g, '<br>') + '</p></section>');
    var ex = cv.experience.filter(function(e){ return e.role || e.org || e.bullets; });
    if (ex.length) h.push('<section class="cv-sec"><h2>' + L.experience + '</h2>' + ex.map(function(e){
      var bl = lines(e.bullets), r = range(e.start, e.end, e.current, L);
      return '<div class="cv-entry"><div class="cv-line"><span class="cv-title"><b>' + esc(e.role) + '</b>' + (e.role && e.org ? ', ' : '') + esc(e.org) + '</span>' +
        (r ? '<span class="cv-date">' + esc(r) + '</span>' : '') + '</div>' + (e.place ? '<div class="cv-meta">' + esc(e.place) + '</div>' : '') +
        (bl.length ? '<ul>' + bl.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('') + '</section>');
    var ed = cv.education.filter(function(e){ return e.degree || e.school; });
    if (ed.length) h.push('<section class="cv-sec"><h2>' + L.education + '</h2>' + ed.map(function(e){
      var dl = lines(e.details), r = range(e.start, e.end, false, L);
      return '<div class="cv-entry"><div class="cv-line"><span class="cv-title"><b>' + esc(e.degree) + '</b>' + (e.degree && e.school ? ', ' : '') + esc(e.school) + '</span>' +
        (r ? '<span class="cv-date">' + esc(r) + '</span>' : '') + '</div>' + (e.place ? '<div class="cv-meta">' + esc(e.place) + '</div>' : '') +
        (dl.length ? '<ul>' + dl.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('') + '</section>');
    var sk = lines(cv.skills);
    if (sk.length) h.push('<section class="cv-sec"><h2>' + L.skills + '</h2>' + sk.map(function(x){ var p = kv(x); return '<p class="cv-kv">' + (p ? '<b>' + esc(p[0]) + ':</b> ' + esc(p[1]) : esc(x)) + '</p>'; }).join('') + '</section>');
    var lg = lines(cv.languages);
    if (lg.length) h.push('<section class="cv-sec"><h2>' + L.languages + '</h2><p>' + lg.map(function(x){ var p = kv(x); return p ? esc(p[0]) + ' (' + esc(p[1]) + ')' : esc(x); }).join(' · ') + '</p></section>');
    cv.extras.forEach(function(x){ var ls = lines(x.lines); if (!x.title.trim() && !ls.length) return;
      h.push('<section class="cv-sec"><h2>' + esc(x.title.trim() || '—') + '</h2>' + (ls.length > 1 ? '<ul>' + ls.map(function(l){ return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '<p>' + esc(ls[0] || '') + '</p>') + '</section>'); });
    return h.join('');
  }
  function llRow(d, c){ return '<div class="ll-row"><div class="ll-d">' + d + '</div><div class="ll-c">' + c + '</div></div>'; }
  function renderLebenslauf(cv){
    var L = CVL[cv.lang], b = cv.basics, h = [];
    h.push('<header class="ll-head"><div><p class="ll-title">' + L.title + '</p><h1 class="cv-name' + (b.name ? '' : ' cv-ph') + '">' + esc(b.name || L.namePh) + '</h1>' +
      (b.headline ? '<p class="cv-headline">' + esc(b.headline) + '</p>' : '') + '</div>' +
      (b.photo ? '<img class="ll-photo" src="' + b.photo + '" alt="">' : '') + '</header>');
    var pd = [[L.address, b.address || b.location], [L.phone, b.phone], [L.email, b.email], [L.birth, b.birth], [L.nationality, b.nationality], [L.web, b.web], [L.linkedin, b.linkedin]]
      .filter(function(r){ return r[1] && r[1].trim(); });
    if (pd.length) h.push('<section class="cv-sec"><h2>' + L.personal + '</h2>' + pd.map(function(r){ return llRow(esc(r[0]), esc(r[1])); }).join('') + '</section>');
    if (cv.summary.trim()) h.push('<section class="cv-sec"><h2>' + L.summary + '</h2><p>' + esc(cv.summary.trim()).replace(/\n/g, '<br>') + '</p></section>');
    function entries(list, title, a, bKey, detailKey, cur){
      list = list.filter(function(e){ return e[a] || e[bKey]; }); if (!list.length) return;
      h.push('<section class="cv-sec"><h2>' + title + '</h2>' + list.map(function(e){
        var dl = lines(e[detailKey]);
        return llRow(esc(range(e.start, e.end, cur && e.current, L)), '<b>' + esc(e[a]) + '</b>' + (e[bKey] ? '<br>' + esc(e[bKey]) + (e.place ? ', ' + esc(e.place) : '') : (e.place ? '<br>' + esc(e.place) : '')) +
          (dl.length ? '<ul>' + dl.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''));
      }).join('') + '</section>');
    }
    entries(cv.experience, L.experience, 'role', 'org', 'bullets', true);
    entries(cv.education, L.education, 'degree', 'school', 'details', false);
    var sk = lines(cv.skills), lg = lines(cv.languages);
    if (sk.length || lg.length){
      var rows = sk.map(function(x){ var p = kv(x); return p ? llRow(esc(p[0]), esc(p[1])) : llRow('', esc(x)); });
      if (lg.length) rows.push(llRow(esc(L.languages), lg.map(function(x){ var p = kv(x); return p ? esc(p[0]) + ': ' + esc(p[1]) : esc(x); }).join('<br>')));
      h.push('<section class="cv-sec"><h2>' + L.skills + '</h2>' + rows.join('') + '</section>');
    }
    cv.extras.forEach(function(x){ var ls = lines(x.lines); if (!x.title.trim() && !ls.length) return;
      h.push('<section class="cv-sec"><h2>' + esc(x.title.trim() || '—') + '</h2>' + ls.map(function(l){ var p = kv(l); return p ? llRow(esc(p[0]), esc(p[1])) : llRow('', esc(l)); }).join('') + '</section>'); });
    if (cv.sig.show) h.push('<div class="ll-sig"><span>' + esc([cv.sig.place || (b.location || '').split(',')[0], cv.sig.date || todayStr(cv.lang)].filter(Boolean).join(', ')) + '</span><span class="ll-line">' + esc(b.name || L.signature) + '</span></div>');
    return h.join('');
  }
  function renderSheet(cv){ return cv.template === 'lebenslauf' ? renderLebenslauf(cv) : renderAts(cv); }

  /* ---- plain text for the hand-off to the app (and for ATS-style checks) ---- */
  function toText(cv){
    var L = CVL[cv.lang], b = cv.basics, out = [];
    if (b.name) out.push(b.name); if (b.headline) out.push(b.headline);
    var c = [b.location, b.phone, b.email, b.web, b.linkedin].filter(Boolean); if (c.length) out.push(c.join(' | '));
    function sec(t){ out.push('', t.toUpperCase()); }
    if (cv.summary.trim()){ sec(L.summary); out.push(cv.summary.trim()); }
    var ex = cv.experience.filter(function(e){ return e.role || e.org || e.bullets; });
    if (ex.length){ sec(L.experience); ex.forEach(function(e){ out.push([e.role, e.org, e.place].filter(Boolean).join(', ') + (range(e.start, e.end, e.current, L) ? ' (' + range(e.start, e.end, e.current, L) + ')' : '')); lines(e.bullets).forEach(function(x){ out.push('- ' + x); }); }); }
    var ed = cv.education.filter(function(e){ return e.degree || e.school; });
    if (ed.length){ sec(L.education); ed.forEach(function(e){ out.push([e.degree, e.school, e.place].filter(Boolean).join(', ') + (range(e.start, e.end, false, L) ? ' (' + range(e.start, e.end, false, L) + ')' : '')); lines(e.details).forEach(function(x){ out.push('- ' + x); }); }); }
    if (lines(cv.skills).length){ sec(L.skills); lines(cv.skills).forEach(function(x){ out.push(x); }); }
    if (lines(cv.languages).length){ sec(L.languages); lines(cv.languages).forEach(function(x){ out.push(x); }); }
    cv.extras.forEach(function(x){ var ls = lines(x.lines); if (!x.title.trim() && !ls.length) return; sec(x.title.trim() || '—'); ls.forEach(function(l){ out.push('- ' + l); }); });
    return out.join('\n').trim();
  }

  /* ---- storage ---- */
  function lsGet(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k, v){ try { window.localStorage.setItem(k, v); return true; } catch(e){ return false; } }
  function lsDel(k){ try { window.localStorage.removeItem(k); } catch(e){} }
  function storageOk(){ try { var t = '__hwcvb'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); return true; } catch(e){ return false; } }

  /* ---- photo: crop to 3:4 and shrink to 360x480 JPEG (stays well under 100 KB) ---- */
  function readPhoto(file, cb){
    if (!file || !/^image\//.test(file.type)) return;
    var fr = new FileReader();
    fr.onload = function(){
      var img = new Image();
      img.onload = function(){
        var W = 360, H = 480, r = W / H, sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (sw / sh > r){ var nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { var nh = sw / r; sy = Math.max(0, (sh - nh) / 3); sh = nh; }
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        try { cb(c.toDataURL('image/jpeg', 0.85)); } catch(e){}
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /* ---- editor ---- */
  function init(){
    var root = document.getElementById('cvb'); if (!root) return;
    var pageLang = (document.documentElement.lang || 'en').slice(0, 2) === 'de' ? 'de' : 'en', T = UI[pageLang];
    var canStore = storageOk();
    var remember = canStore && lsGet(PREF) !== '0';
    var cv = blank(pageLang);
    if (canStore){ try { var raw = lsGet(KEY); if (raw) cv = norm(JSON.parse(raw), pageLang); } catch(e){} }
    var saveT = null, lastSaved = 0;

    function field(path, label, opts){
      opts = opts || {};
      var v = get(path), id = 'cvb-' + path.replace(/[^a-z0-9]+/gi, '-');
      var input = opts.area ? '<textarea id="' + id + '" data-p="' + path + '" rows="' + (opts.rows || 3) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + '>' + esc(v) + '</textarea>'
        : '<input id="' + id + '" data-p="' + path + '" type="' + (opts.type || 'text') + '" value="' + esc(v) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + (opts.ac ? ' autocomplete="' + opts.ac + '"' : '') + '>';
      return '<div class="cvb-f' + (opts.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + input + (opts.hint ? '<p class="hint">' + esc(opts.hint) + '</p>' : '') + '</div>';
    }
    function get(path){ var o = cv; path.split('.').forEach(function(k){ o = o == null ? '' : o[k]; }); return o == null ? '' : o; }
    function set(path, val){ var ks = path.split('.'), o = cv; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; }
    function listTools(kind, i, n){
      return '<div class="cvb-tools"><span class="cvb-n">' + esc(T.entry) + ' ' + (i + 1) + '</span>' +
        '<button type="button" class="cvb-ib" data-mv="' + kind + ':' + i + ':-1" title="' + esc(T.up) + '" aria-label="' + esc(T.up) + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="cvb-ib" data-mv="' + kind + ':' + i + ':1" title="' + esc(T.down) + '" aria-label="' + esc(T.down) + '"' + (i === n - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="cvb-ib" data-rm="' + kind + ':' + i + '" title="' + esc(T.remove) + '" aria-label="' + esc(T.remove) + '">×</button></div>';
    }
    function editorHtml(){
      var h = [];
      h.push('<details class="cvb-s" open><summary>' + esc(T.personal) + '</summary><div class="cvb-grid">' +
        field('basics.name', T.name, { ac:'name' }) + field('basics.headline', T.headline, { ac:'organization-title' }) +
        field('basics.email', T.email, { type:'email', ac:'email' }) + field('basics.phone', T.phone, { type:'tel', ac:'tel' }) +
        field('basics.location', T.location, { ac:'address-level2' }) + field('basics.address', T.address, { ac:'street-address' }) +
        field('basics.web', T.web, { ac:'url' }) + field('basics.linkedin', T.linkedin) +
        field('basics.birth', T.birth) + field('basics.nationality', T.nationality) +
        '<p class="hint wide">' + esc(T.birthHint) + '</p>' +
        '<div class="cvb-f wide cvb-photo"><span class="lbl">' + esc(T.photo) + '</span><div class="cvb-photorow">' +
          (cv.basics.photo ? '<img src="' + cv.basics.photo + '" alt="">' : '') +
          '<label class="btn sm" for="cvb-photo-in">' + esc(T.photoAdd) + '</label><input type="file" id="cvb-photo-in" accept="image/jpeg,image/png,image/webp" class="cvb-hide">' +
          (cv.basics.photo ? '<button type="button" class="btn sm" data-act="photo-rm">' + esc(T.photoRemove) + '</button>' : '') +
        '</div><p class="hint">' + esc(T.photoHint) + '</p></div></div></details>');
      h.push('<details class="cvb-s" open><summary>' + esc(T.summary) + '</summary>' + field('summary', T.summary, { area:true, rows:3, ph:T.summaryPh, wide:true }) + '</details>');
      h.push('<details class="cvb-s" open><summary>' + esc(T.experience) + '</summary>' + cv.experience.map(function(e, i){
        return '<div class="cvb-item">' + listTools('experience', i, cv.experience.length) + '<div class="cvb-grid">' +
          field('experience.' + i + '.role', T.role) + field('experience.' + i + '.org', T.org) + field('experience.' + i + '.place', T.place) +
          '<div class="cvb-f cvb-dates">' + '<div>' + field('experience.' + i + '.start', T.start, { ph:T.datePh }) + '</div><div>' +
          (e.current ? '' : field('experience.' + i + '.end', T.end, { ph:T.datePh })) + '</div></div>' +
          '<label class="cvb-check wide"><input type="checkbox" data-p="experience.' + i + '.current"' + (e.current ? ' checked' : '') + '> ' + esc(T.current) + '</label>' +
          field('experience.' + i + '.bullets', T.bullets, { area:true, rows:4, ph:T.bulletsPh, wide:true }) + '</div></div>';
      }).join('') + '<button type="button" class="btn sm" data-add="experience">' + esc(T.addExp) + '</button></details>');
      h.push('<details class="cvb-s" open><summary>' + esc(T.education) + '</summary>' + cv.education.map(function(e, i){
        return '<div class="cvb-item">' + listTools('education', i, cv.education.length) + '<div class="cvb-grid">' +
          field('education.' + i + '.degree', T.degree) + field('education.' + i + '.school', T.school) + field('education.' + i + '.place', T.place) +
          '<div class="cvb-f cvb-dates"><div>' + field('education.' + i + '.start', T.start, { ph:T.datePh }) + '</div><div>' + field('education.' + i + '.end', T.end, { ph:T.datePh }) + '</div></div>' +
          field('education.' + i + '.details', T.details, { area:true, rows:2, ph:T.detailsPh, wide:true }) + '</div></div>';
      }).join('') + '<button type="button" class="btn sm" data-add="education">' + esc(T.addEdu) + '</button></details>');
      h.push('<details class="cvb-s" open><summary>' + esc(T.skills) + ' &amp; ' + esc(T.languages) + '</summary>' +
        field('skills', T.skills, { area:true, rows:4, ph:T.skillsPh, wide:true }) + field('languages', T.languages, { area:true, rows:3, ph:T.languagesPh, wide:true }) + '</details>');
      h.push('<details class="cvb-s"' + (cv.extras.length ? ' open' : '') + '><summary>' + esc(T.extras) + '</summary>' + cv.extras.map(function(x, i){
        return '<div class="cvb-item">' + listTools('extras', i, cv.extras.length) + field('extras.' + i + '.title', T.extraTitle, { ph:T.extraTitlePh, wide:true }) +
          field('extras.' + i + '.lines', T.extraLines, { area:true, rows:3, wide:true }) + '</div>';
      }).join('') + '<button type="button" class="btn sm" data-add="extras">' + esc(T.addExtra) + '</button></details>');
      if (cv.template === 'lebenslauf') h.push('<details class="cvb-s" open><summary>' + esc(T.signature) + '</summary>' +
        '<label class="cvb-check"><input type="checkbox" data-p="sig.show"' + (cv.sig.show ? ' checked' : '') + '> ' + esc(T.signature) + '</label>' +
        '<div class="cvb-grid">' + field('sig.place', T.sigPlace) + field('sig.date', T.sigDate, { ph:todayStr(cv.lang) }) + '</div><p class="hint">' + esc(T.sigHint) + '</p></details>');
      return h.join('');
    }
    function toolbarHtml(){
      return '<div class="cvb-bar">' +
        '<div class="cvb-tpls" role="radiogroup" aria-label="' + esc(T.tpl) + '">' + TEMPLATES.map(function(t){
          return '<label class="cvb-tpl' + (cv.template === t ? ' on' : '') + '"><input type="radio" name="cvb-tpl" value="' + t + '"' + (cv.template === t ? ' checked' : '') + '><span>' + esc(T.tplNames[t]) + '</span></label>';
        }).join('') + '</div>' +
        '<div class="cvb-opts"><label>' + esc(T.cvlang) + ' <select data-opt="lang"><option value="en"' + (cv.lang === 'en' ? ' selected' : '') + '>English</option><option value="de"' + (cv.lang === 'de' ? ' selected' : '') + '>Deutsch</option></select></label>' +
        '<label>' + esc(T.paper) + ' <select data-opt="paper"><option value="a4"' + (cv.paper === 'a4' ? ' selected' : '') + '>A4</option><option value="letter"' + (cv.paper === 'letter' ? ' selected' : '') + '>US Letter</option></select></label></div>' +
        '<div class="cvb-acts"><button type="button" class="btn red" data-act="pdf">' + esc(T.pdf) + '</button>' +
        '<button type="button" class="btn" data-act="score">' + esc(T.score) + '</button>' +
        '<details class="cvb-more"><summary class="btn">' + esc(T.more) + '</summary><div class="cvb-menu">' +
          '<button type="button" data-act="example">' + esc(T.example) + '</button><button type="button" data-act="export">' + esc(T.exportJson) + '</button>' +
          '<label for="cvb-import-in">' + esc(T.importJson) + '</label><input type="file" id="cvb-import-in" accept="application/json,.json" class="cvb-hide">' +
          '<button type="button" data-act="clear">' + esc(T.clear) + '</button></div></details></div>' +
        '<div class="cvb-status"><label class="cvb-check"><input type="checkbox" data-opt="remember"' + (remember ? ' checked' : '') + (canStore ? '' : ' disabled') + '> ' + esc(T.remember) + '</label> <span id="cvb-saved" role="status"></span></div>' +
        '<p class="cvb-msg" id="cvb-msg" role="alert" hidden></p></div>';
    }
    function build(){
      root.innerHTML = toolbarHtml() +
        '<div class="cvb-tabs" role="tablist"><button type="button" role="tab" data-tab="edit" aria-selected="true">' + esc(T.edit) + '</button><button type="button" role="tab" data-tab="prev" aria-selected="false">' + esc(T.preview) + '</button></div>' +
        '<div class="cvb-main" data-show="edit"><form class="cvb-edit" autocomplete="on" onsubmit="return false">' + editorHtml() + '</form>' +
        '<div class="cvb-prev"><div class="cvb-pinfo"><span id="cvb-pages"></span><span>' + esc(T.tplNames[cv.template]) + '</span></div><div class="cvb-scale" id="cvb-scale"><div class="cv-sheet" id="cvb-sheet"></div></div></div></div>';
      paint(); status();
    }
    function rebuildEditor(){ var f = root.querySelector('.cvb-edit'); var y = window.scrollY; f.innerHTML = editorHtml(); window.scrollTo(0, y); }
    function paint(){
      var sheet = document.getElementById('cvb-sheet'); if (!sheet) return;
      sheet.className = 'cv-sheet tpl-' + cv.template + ' paper-' + cv.paper;
      sheet.setAttribute('lang', cv.lang);
      sheet.innerHTML = renderSheet(cv);
      fit();
    }
    function pageHeightPx(){ return cv.paper === 'letter' ? 1056 : 1123; }   // 11in / 297mm at 96 dpi
    function fit(){
      var box = document.getElementById('cvb-scale'), sheet = document.getElementById('cvb-sheet'); if (!box || !sheet) return;
      var w = box.clientWidth || 600, sw = sheet.offsetWidth || 794, s = Math.min(1, w / sw);
      sheet.style.transform = 'scale(' + s + ')';
      var ph = pageHeightPx(), hgt = Math.max(sheet.scrollHeight, ph), n = Math.max(1, Math.ceil((sheet.scrollHeight - 2) / ph));
      sheet.style.minHeight = (n * ph) + 'px';
      box.style.height = Math.ceil(n * ph * s) + 'px';
      sheet.style.setProperty('--pg', ph + 'px');
      var p = document.getElementById('cvb-pages'); if (p) p.textContent = T.pages(n);
      void hgt;
    }
    function status(){
      var el = document.getElementById('cvb-saved'); if (!el) return;
      if (!canStore) el.textContent = T.storageOff;
      else if (!remember) el.textContent = T.notSaved;
      else el.textContent = lastSaved ? T.saved + ' · ' + new Date(lastSaved).toLocaleTimeString(pageLang === 'de' ? 'de-DE' : 'en-GB', { hour:'2-digit', minute:'2-digit' }) : T.saved;
    }
    function save(){
      if (!canStore || !remember) return;
      if (lsSet(KEY, JSON.stringify(cv))) lastSaved = Date.now();
      status();
    }
    function queueSave(){ clearTimeout(saveT); saveT = setTimeout(save, 400); }
    function msg(t){ var m = document.getElementById('cvb-msg'); if (!m) return; m.textContent = t || ''; m.hidden = !t; }
    function changed(full){ if (full) rebuildEditor(); paint(); queueSave(); }

    root.addEventListener('input', function(ev){
      var t = ev.target, p = t.getAttribute('data-p');
      if (p && t.type !== 'checkbox'){ set(p, clip(t.value, /bullets|details|lines|summary|skills|languages/.test(p) ? 4000 : 300)); paint(); queueSave(); msg(''); }
    });
    root.addEventListener('change', function(ev){
      var t = ev.target, p = t.getAttribute('data-p'), o = t.getAttribute('data-opt');
      if (p && t.type === 'checkbox'){ set(p, t.checked); changed(/current/.test(p)); return; }
      if (t.name === 'cvb-tpl'){ cv.template = t.value; Array.prototype.forEach.call(root.querySelectorAll('.cvb-tpl'), function(l){ l.classList.toggle('on', l.querySelector('input').checked); });
        var inf = root.querySelector('.cvb-pinfo span:last-child'); if (inf) inf.textContent = T.tplNames[cv.template]; changed(true); return; }
      if (o === 'lang' || o === 'paper'){ cv[o] = t.value; changed(o === 'lang'); return; }
      if (o === 'remember'){ remember = t.checked; lsSet(PREF, remember ? '1' : '0'); if (remember) save(); else { lsDel(KEY); lastSaved = 0; } status(); return; }
      if (t.id === 'cvb-photo-in'){ readPhoto(t.files && t.files[0], function(d){ cv.basics.photo = d; changed(true); }); t.value = ''; return; }
      if (t.id === 'cvb-import-in'){
        var f = t.files && t.files[0]; t.value = ''; if (!f) return;
        var fr = new FileReader(); fr.onload = function(){ try { var d = JSON.parse(fr.result); if (!d || d.v !== 1 || !d.basics) throw 0; cv = norm(d, pageLang); build(); save(); msg(T.loaded); } catch(e){ msg(T.badFile); } };
        fr.readAsText(f.slice(0, 1000000)); closeMenu();
      }
    });
    function closeMenu(){ var m = root.querySelector('.cvb-more'); if (m) m.open = false; }
    root.addEventListener('click', function(ev){
      var b = ev.target.closest ? ev.target.closest('button') : null; if (!b || !root.contains(b)) return;
      var a = b.getAttribute('data-act'), add = b.getAttribute('data-add'), mv = b.getAttribute('data-mv'), rm = b.getAttribute('data-rm'), tab = b.getAttribute('data-tab');
      if (tab){ root.querySelector('.cvb-main').setAttribute('data-show', tab); Array.prototype.forEach.call(root.querySelectorAll('[data-tab]'), function(x){ x.setAttribute('aria-selected', x === b ? 'true' : 'false'); }); if (tab === 'prev') fit(); return; }
      if (add){ cv[add].push(add === 'experience' ? { role:'', org:'', place:'', start:'', end:'', current:false, bullets:'' } : add === 'education' ? { degree:'', school:'', place:'', start:'', end:'', details:'' } : { title:'', lines:'' }); changed(true); return; }
      if (mv){ var q = mv.split(':'), list = cv[q[0]], i = +q[1], j = i + (+q[2]); if (j >= 0 && j < list.length){ var x = list[i]; list[i] = list[j]; list[j] = x; changed(true); } return; }
      if (rm){ var r = rm.split(':'); cv[r[0]].splice(+r[1], 1); changed(true); return; }
      if (a === 'photo-rm'){ cv.basics.photo = ''; changed(true); return; }
      if (a === 'pdf'){ printPdf(); return; }
      if (a === 'score'){ handoff(); return; }
      if (a === 'example'){ closeMenu(); if (hasContent() && !window.confirm(T.confirmExample)) return; cv = norm(JSON.parse(JSON.stringify(EXAMPLES[pageLang])), pageLang); build(); save(); return; }
      if (a === 'export'){ closeMenu(); download(JSON.stringify(cv, null, 1), fileBase() + '.json', 'application/json'); return; }
      if (a === 'clear'){ closeMenu(); if (!window.confirm(T.confirmClear)) return; cv = blank(pageLang); lsDel(KEY); lastSaved = 0; build(); return; }
    });
    function hasContent(){ return toText(cv).length > 0; }
    function fileBase(){ var n = (cv.basics.name || '').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''); return (n || 'cv') + (cv.lang === 'de' ? '-Lebenslauf' : '-CV'); }
    function download(text, name, type){
      var blob = new Blob([text], { type:type }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 500);
    }
    function printPdf(){
      var old = document.getElementById('cvb-print'); if (old) old.remove();
      var wrap = document.createElement('div'); wrap.id = 'cvb-print';
      wrap.innerHTML = '<div class="cv-sheet tpl-' + cv.template + ' paper-' + cv.paper + '" lang="' + cv.lang + '">' + renderSheet(cv) + '</div>';
      document.body.appendChild(wrap);
      var st = document.getElementById('cvb-page-style') || document.createElement('style'); st.id = 'cvb-page-style';
      st.textContent = '@page{size:' + (cv.paper === 'letter' ? 'letter' : 'A4') + ';margin:14mm 16mm}';
      document.head.appendChild(st);
      var title = document.title, sy = window.scrollY || 0; document.title = fileBase();
      msg(T.printTip);
      window.scrollTo(0, 0);   // Chromium keeps the scroll offset when printing a page whose content shrinks; start the CV at the top of page 1
      var done = function(){ document.title = title; window.removeEventListener('afterprint', done); try { window.scrollTo(0, sy); } catch(e){} };
      window.addEventListener('afterprint', done);
      try { window.print(); } catch(e){}
      setTimeout(function(){ if (document.title !== title) done(); }, 60000);
    }
    function handoff(){
      var text = toText(cv);
      if (text.length < 200){ msg(T.needMore); return; }
      var payload = { v:1, text:text.slice(0, 25000), role:clip(cv.basics.headline, 60), city:clip((cv.basics.location || '').split(',')[0].trim(), 60), at:Date.now() };
      save();
      if (!lsSet(HANDOFF, JSON.stringify(payload))){ msg(T.storageOff); return; }
      window.location.assign('/#hw-cv');
    }
    window.addEventListener('resize', fit);
    if (typeof ResizeObserver === 'function') try { new ResizeObserver(function(){ fit(); }).observe(root); } catch(e){}
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.HWCvBuilder = { get:function(){ return JSON.parse(JSON.stringify(cv)); }, toText:function(){ return toText(cv); } };
  }
  if (typeof module !== 'undefined' && module.exports){ module.exports = { norm:norm, toText:toText, renderSheet:renderSheet, fmtDate:fmtDate, range:range, blank:blank, EXAMPLES:EXAMPLES, CVL:CVL }; return; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
