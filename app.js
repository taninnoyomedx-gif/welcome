/* ▼ Apps Script の「ウェブアプリのURL」をここに入れます。空の間はプレビュー表示です */
var ANSWER_URL = 'https://script.google.com/macros/s/AKfycbzzp09pg34DXqHXXAnql3zq5f2sQX7VZVHF7RBrVwcvKvUlU-1CQHYhHlD0Zv7FNdHZ/exec';

(function () {
  var cards = [].slice.call(document.querySelectorAll('.card'));
  var bars = [].slice.call(document.querySelectorAll('#progress i'));
  var progress = document.getElementById('progress');
  var nameEl = document.getElementById('name');
  var nameNext = document.getElementById('nameNext');
  var send = document.getElementById('send');
  var start = document.getElementById('start');
  var err = document.getElementById('err');
  var linkErr = document.getElementById('linkErr');
  var answers = { name: '', speech: '', drink: '' };
  var step = 0;
  var SEND_LABEL = '回答して、お部屋の案内を見る';
  var SAVE_KEY = 'tdx-survey-result';
  var ref = new URLSearchParams(location.search).get('r') || '';
  var keyMatch = location.hash.match(/[#&]k=([\w-]+)/);
  var accessKey = keyMatch ? keyMatch[1] : '';

  function show(n) {
    step = n;
    cards.forEach(function (c) { c.classList.toggle('on', +c.dataset.step === n); });
    progress.classList.toggle('on', n >= 1 && n <= 3);
    bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
    window.scrollTo(0, 0);
    if (n === 1 && window.matchMedia('(hover: hover)').matches) nameEl.focus();
  }

  function honorific(v) {
    return /(さん|様|さま|くん|君|ちゃん|あなた)$/.test(v) ? v : v + '様';
  }

  function result(data, name, demo) {
    document.getElementById('who').textContent = honorific(name);
    document.getElementById('room').textContent = data.room;
    document.getElementById('map').href = data.map;
    document.getElementById('demo').hidden = !demo;
    show(4);
  }

  document.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () { show(step + 1); });
  });
  document.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { show(step - 1); });
  });

  nameEl.addEventListener('input', function () {
    answers.name = nameEl.value.replace(/[\r\n]/g, ' ').trim();
    nameNext.disabled = !answers.name;
  });
  nameEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.isComposing && answers.name) { e.preventDefault(); nameEl.blur(); show(2); }
  });

  document.querySelectorAll('.opts').forEach(function (group) {
    group.addEventListener('click', function (e) {
      var opt = e.target.closest('.opt');
      if (!opt) return;
      group.querySelectorAll('.opt').forEach(function (o) { o.setAttribute('aria-pressed', o === opt ? 'true' : 'false'); });
      answers[group.dataset.key] = opt.dataset.value;
      if (group.dataset.key === 'speech') setTimeout(function () { show(3); }, 220);
      if (group.dataset.key === 'drink') { send.disabled = false; err.textContent = ''; }
    });
  });

  send.addEventListener('click', function () {
    if (!ANSWER_URL) { result({ room: '〇〇〇号室', map: '#' }, answers.name, true); return; }
    send.disabled = true;
    send.textContent = '送信しています…';
    err.textContent = '';
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 25000);
    fetch(ANSWER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key: accessKey, name: answers.name, speech: answers.speech, drink: answers.drink, ref: ref }),
      signal: ctrl.signal
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error('rejected');
      try { sessionStorage.setItem(SAVE_KEY, JSON.stringify({ room: d.room, map: d.map, name: answers.name })); } catch (e) {}
      result(d, answers.name, false);
    }).catch(function () {
      err.textContent = '送信できませんでした。電波の良い場所でもう一度お試しください。解決しない場合は、お店へご連絡ください。';
      send.disabled = false;
    }).finally(function () {
      clearTimeout(timer);
      send.textContent = SEND_LABEL;
    });
  });

  /* 回答後に再読み込みしても、案内を見直せるように */
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
  if (saved && saved.room) { result(saved, saved.name, false); return; }

  if (ANSWER_URL && !accessKey) {
    start.disabled = true;
    linkErr.textContent = 'リンクが正しくありません。お店から届いたリンクを、そのまま開いてください。';
  }
})();
