(() => {
  'use strict';
  const data = window.TRAVEL_DATA;
  if (!data) {
    document.getElementById('view-content').textContent = '资料加载失败，请刷新；也可使用原文字攻略。';
    return;
  }
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storageKey = 'chaoshan-pocket-v1';
  const inWechat = /MicroMessenger/i.test(navigator.userAgent);
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) preferences = {};
  const query = new URLSearchParams(location.search);
  const state = { day: data.days.some(d => d.id === query.get('day')) ? query.get('day') : data.days[0].id,
    area: '全部', role: 'all', category: '全部类型', search: '', mode: 'browse', selection: 'want' };
  const icons = {
    browse:'<rect x="2.5" y="3" width="5.5" height="6" rx="1"/><rect x="11" y="3" width="5.5" height="4" rx="1"/><rect x="2.5" y="12" width="5.5" height="4" rx="1"/><rect x="11" y="10" width="5.5" height="6" rx="1"/>',
    plan:'<path d="M6 3h10M6 9h10M6 15h10"/><circle cx="2.5" cy="3" r=".7"/><circle cx="2.5" cy="9" r=".7"/><circle cx="2.5" cy="15" r=".7"/>',
    saved:'<path d="M5 2.5h9v14L9.5 13 5 16.5z"/>',
  };
  const icon = kind => `<svg viewBox="0 0 19 19" aria-hidden="true">${icons[kind] || ''}</svg>`;
  const clock = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 1.5"/></svg>';
  const label = { main:'主选', backup:'备选', optional:'顺路可选' };
  function pref(id) { return preferences[id] || {}; }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); }
    catch { toast('浏览器未允许保存，本次选择仍可查看'); }
  }
  let toastTimer;
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2200);
  }
  const byId = new Map(data.items.map(p => [p.id, p]));
  function href(url) {
    try { const parsed = new URL(url); return parsed.protocol === 'https:' ? escape(url) : '#'; }
    catch { return '#'; }
  }
  function card(item, compact = false) {
    const selected = pref(item.id);
    const notes = item.notes;
    const noteLabel = notes.length ? '看小红书 ↗' : '搜小红书 ↗';
    const noteUrl = notes.length ? notes[0].url : item.xhsSearch;
    const compareGroup = item.groups.includes('gancao') ? 'gancao' : item.groups.find(g => data.items.some(p => p.id !== item.id && p.groups.includes(g)));
    const badge = item.tag.includes('候选A') ? '生腌候选A' : item.tag.includes('候选B') ? '生腌候选B' : label[item.role];
    return `<article class="place-card ${selected.status === 'skip' ? 'is-skipped' : ''}" data-place="${escape(item.id)}">
      <div class="card-meta"><span class="role-badge ${item.role}">${escape(badge)}</span><span class="category">${escape(item.category)}</span><span>${escape(item.area)}</span></div>
      <button class="save-button ${selected.want ? 'active' : ''}" data-action="want" data-id="${item.id}" aria-label="${selected.want ? '取消想去' : '想去'} ${escape(item.name)}" aria-pressed="${!!selected.want}">${selected.want ? '♥' : '♡'}</button>
      <h3>${escape(item.name)}</h3>
      ${item.reference ? '<div class="reference-note">酒店旁找店参考 · 非水果店精确定位，营业待确认</div>' : ''}
      <p class="summary">${escape(item.summary || item.tag)}</p>
      <div class="hours">${clock}<span>${escape(item.hours)} <span class="platform-label">· 平台资料</span></span></div>
      <div class="actions"><a class="nav-link" href="${href(item.amapApp || item.amap)}">${item.reference ? '去酒店参考点' : '高德地点'} ↗</a><a class="xhs-link" href="${href(noteUrl)}" data-note-link="${item.id}" data-note-index="0">${noteLabel}</a></div>
      <div class="link-fallbacks"><button data-action="map-help" data-id="${item.id}">复制店名地址</button><button data-action="note-help" data-id="${item.id}" data-note-index="0">${notes.length ? '笔记打不开？' : '复制搜索词'}</button></div>
      <div class="card-bottom">${compareGroup && !compact ? `<button class="compare-button" data-action="compare" data-group="${compareGroup}" data-id="${item.id}">看看${escape(data.mealGroups[compareGroup])}备选 →</button>` : '<span></span>'}<div class="status-buttons"><button class="status-button ${selected.status === 'done' ? 'active' : ''}" data-action="done" data-id="${item.id}" aria-pressed="${selected.status === 'done'}">${selected.status === 'done' ? '✓ 已去过' : '去过'}</button><button class="status-button ${selected.status === 'skip' ? 'active' : ''}" data-action="skip" data-id="${item.id}" aria-pressed="${selected.status === 'skip'}">${selected.status === 'skip' ? '已跳过' : '跳过'}</button></div></div>
      <details class="place-details"><summary>地址与${notes.length ? notes.length + '篇笔记' : '详细提示'}</summary><p>${escape(item.address)}</p><p>${escape(item.summary)}</p>${notes.length ? `<div class="source-list">${notes.map((note,index) => `<a class="source-link" href="${href(note.url)}" data-note-link="${item.id}" data-note-index="${index}">${escape(note.title)}<span>${escape(note.author)} · ${escape(note.published_at)}</span><small>${escape(note.summary)}</small></a>`).join('')}</div>` : '<p>尚未附上可核对的实吃原笔记。“搜小红书”打开检索，不代表该店已有好评依据。</p>'}</details>
    </article>`;
  }
  function dayItems() { return data.items.filter(p => p.day === state.day); }
  function renderControls() {
    $('days').innerHTML = data.days.map(day => `<button class="day-button ${day.id === state.day ? 'active' : ''}" data-day="${day.id}" aria-pressed="${day.id === state.day}"><small>${day.date} ${day.weekday}</small><strong>${escape(day.cities.join(' · '))}</strong></button>`).join('');
    const areas = ['全部', ...new Set(dayItems().sort((a,b) => a.order.localeCompare(b.order, 'zh-CN')).map(p => p.area))];
    $('areas').innerHTML = areas.map(area => `<button class="area-button ${area === state.area ? 'active' : ''}" data-area="${escape(area)}" aria-pressed="${area === state.area}">${escape(area)}</button>`).join('');
    $('roles').innerHTML = [['all','全部'],['main','主选'],['backup','备选'],['optional','可选']].map(([value,text]) => `<button class="role-button ${state.role === value ? 'active' : ''}" data-role="${value}" aria-pressed="${state.role === value}">${text}</button>`).join('');
    $('types').innerHTML = ['全部类型','吃点','逛逛','体验','伴手礼','出行'].map(type => `<button class="type-choice ${state.category === type ? 'active' : ''}" data-category="${type}">${type}</button>`).join('');
    $('type-button').textContent = state.category + '⌄';
    const day = data.days.find(d => d.id === state.day);
    $('day-note').innerHTML = `<span class="note-icon">◷</span><div><h2>${escape(day.deadline)}</h2><p>${escape(day.tip)}</p></div>`;
    $('modes').innerHTML = [['browse','刷候选'],['plan','看行程'],['saved','我的选择']].map(([value,text]) => `<button class="mode-button ${state.mode === value ? 'active' : ''}" data-mode="${value}" aria-pressed="${state.mode === value}">${icon(value)}${text}</button>`).join('');
    $('browse-tools').hidden = state.mode !== 'browse';
    $('areas').parentElement.hidden = state.mode === 'plan';
  }
  function renderCards(items) {
    if (!items.length) return '<div class="empty">这里暂时没有候选。<br>可以换个片区，或放宽筛选条件。<br><button class="reset-filters" data-action="reset-filters">显示当天全部候选</button></div>';
    const areas = [...new Set(items.map(p => p.area))];
    return areas.map(area => `<h2 class="section-label">${escape(area)} <span>${items.filter(p => p.area === area).length}处</span></h2><div class="cards">${items.filter(p => p.area === area).map(p => card(p)).join('')}</div>`).join('');
  }
  function renderBrowse() {
    let items = dayItems().filter(p => (state.area === '全部' || p.area === state.area) &&
      (state.role === 'all' || p.role === state.role) &&
      (state.category === '全部类型' || p.category === state.category));
    const term = state.search.trim().toLocaleLowerCase();
    if (term) items = items.filter(p => (p.name + p.tag + p.summary + p.address + p.area).toLocaleLowerCase().includes(term));
    const priorities = { main:0, backup:1, optional:2 };
    items.sort((a,b) => (a.category === '出行') - (b.category === '出行') || a.order.localeCompare(b.order,'zh-CN') || priorities[a.role] - priorities[b.role]);
    $('result-count').textContent = `${items.length}处候选`;
    $('view-content').innerHTML = renderCards(items);
  }
  function renderPlan() {
    const day = data.days.find(d => d.id === state.day);
    const stops = day.timeline.map(line => {
      const split = line.indexOf('｜');
      return { time: split >= 0 ? line.slice(0,split) : '', text: split >= 0 ? line.slice(split+1) : line };
    });
    $('view-content').innerHTML = `<div class="timeline-head"><h2>${escape(day.title)}</h2><p>沿用原攻略的游玩与转场。吃饭按胃口和实时叫号选，不要求完成所有候选。</p></div><div class="timeline">${stops.map(stop => `<div class="timeline-stop"><div class="timeline-time">${escape(stop.time)}</div><p>${escape(stop.text)}</p></div>`).join('')}</div>${state.day === '2026-11-07' ? `<section class="queue-box"><h3>吴记等位，现场用这三条</h3><ul>${data.queueTips.map(text => `<li>${escape(text)}</li>`).join('')}</ul></section>` : ''}<div class="plan-links"><a href="${href(data.document)}" target="_blank" rel="noopener noreferrer">看原文字攻略 ↗</a><a href="${href(data.map)}" target="_blank" rel="noopener noreferrer">打开完整高德地图 ↗</a></div>`;
  }
  function renderSaved() {
    const selectionLabels = [['want','想去'],['done','去过'],['skip','跳过']];
    const items = dayItems().filter(p => state.selection === 'want' ? pref(p.id).want : pref(p.id).status === state.selection);
    $('view-content').innerHTML = `<p class="saved-intro">这是你在本机挑出的候选，不会改动原行程、文档或高德。同伴手机上的选择暂不自动同步。</p><div class="selection-tabs">${selectionLabels.map(([value,text]) => `<button class="selection-tab ${state.selection === value ? 'active' : ''}" data-selection="${value}">${text}</button>`).join('')}</div>${items.length ? renderCards(items) : '<div class="empty">这一天还没有标记。<br>去“刷候选”点一下爱心，留下想去的地方。</div>'}`;
  }
  function render() {
    renderControls();
    if (state.mode === 'plan') renderPlan();
    else if (state.mode === 'saved') renderSaved();
    else renderBrowse();
  }
  function openCompare(group, currentId) {
    const current = byId.get(currentId);
    const items = data.items.filter(p => p.groups.includes(group));
    $('alternatives-title').textContent = data.mealGroups[group] + '怎么换';
    $('alternatives-content').innerHTML = `<div class="cards">${items.map(p => card(p,true)).join('')}</div>`;
    const hint = group === 'friday-dinner' ? '烧鹅配少量生腌合成一餐；富苑或凯兴整餐替换。想实吃PK就各点最小份，删其他加餐。' : group === 'gancao' ? '呱呱在周五龙眼片区；鲜语在周六中山中路，只是酒店旁参考点。路过再买，不专程折返。' : '按卡片提示搭配或替换，小份共享。片区、营业窗口和转场时间一起考虑。';
    $('alternatives').querySelector('.dialog-hint').textContent = hint;
    $('alternatives').showModal();
  }
  let copyValues = {};
  function openLinkHelper(kind, id, index = 0) {
    const item = byId.get(id);
    if (!item) return;
    let content;
    if (kind === 'map-help') {
      copyValues = { text: `${item.poiName || item.name}\n${item.address}`, title: item.poiName || item.name };
      $('link-helper-title').textContent = item.name;
      content = `<p>${item.reference ? '这是酒店旁参考地标，不是水果店精确位置。' : '手机定位链接会传入这家店的地点编号。'}若未到地点，复制完整店名和地址，在高德中搜索核对。</p><div class="helper-actions"><a href="${href(item.amapApp || item.amap)}">打开高德地点 ↗</a><a href="${href(item.amapWeb || item.amap)}">看网页版位置 ↗</a><button data-action="copy-value" data-copy="text">复制店名地址</button></div>`;
    } else {
      const note = item.notes[index];
      const keyword = new URL(item.xhsSearch).searchParams.get('keyword') || item.name;
      copyValues = note ? { text: `${note.title}\n作者：${note.author}\n${note.url}`, title: note.title, url: note.url } : { text: keyword, title: keyword, url: item.xhsSearch };
      $('link-helper-title').textContent = note ? '打开这篇笔记' : '去小红书搜索';
      content = note ? `<h3>${escape(note.title)}</h3><p class="helper-author">作者：${escape(note.author)}</p><p>微信里可能只唤起首页。先复制原帖链接，再切到小红书尝试识别；仍打不开时，复制标题搜索，核对作者。也可从微信右上角菜单用 Safari 打开攻略后再试。</p>` : `<p>此处尚未附实吃原帖，只提供搜索词。复制后在小红书搜索，结果不代表推荐依据。</p>`;
      content += `<div class="helper-actions"><button data-action="copy-value" data-copy="${note ? 'url' : 'text'}">${note ? '复制原帖链接' : '复制搜索词'}</button>${note ? '<button data-action="copy-value" data-copy="title">复制笔记标题</button>' : ''}<a href="${href(copyValues.url)}">${note ? '继续打开原帖 ↗' : '打开小红书搜索 ↗'}</a></div>`;
    }
    $('link-helper-content').innerHTML = content + `<label class="manual-copy-label" for="manual-copy">也可长按选择并复制</label><textarea id="manual-copy" class="manual-copy" readonly></textarea>`;
    $('manual-copy').value = copyValues.text;
    $('copy-status').textContent = '';
    $('link-helper').showModal();
  }
  async function copyValue(key) {
    const value = copyValues[key];
    if (!value) return;
    $('manual-copy').value = value;
    try {
      await navigator.clipboard.writeText(value);
      $('copy-status').textContent = '已复制，请切到对应 App 使用。';
    } catch {
      $('manual-copy').focus(); $('manual-copy').select();
      $('copy-status').textContent = '浏览器未允许自动复制，请长按上面的文字复制。';
    }
  }
  document.addEventListener('click', event => {
    const noteLink = event.target.closest('a[data-note-link]');
    if (noteLink && inWechat) {
      event.preventDefault(); openLinkHelper('note-help',noteLink.dataset.noteLink,Number(noteLink.dataset.noteIndex)); return;
    }
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.day) {
      state.day = button.dataset.day; state.area = '全部'; state.search = ''; $('search').value = ''; render();
      history.replaceState(null,'',location.pathname + '?day=' + state.day); return;
    }
    if (button.dataset.area) { state.area = button.dataset.area; render(); return; }
    if (button.dataset.role) { state.role = button.dataset.role; render(); return; }
    if (button.dataset.category) { state.category = button.dataset.category; $('types').hidden = true; $('type-button').setAttribute('aria-expanded','false'); render(); return; }
    if (button.dataset.mode) { state.mode = button.dataset.mode; render(); window.scrollTo({top:0,behavior:'auto'}); return; }
    if (button.dataset.selection) { state.selection = button.dataset.selection; renderSaved(); return; }
    const action = button.dataset.action;
    if (['map-help','note-help'].includes(action)) { openLinkHelper(action,button.dataset.id,Number(button.dataset.noteIndex || 0)); return; }
    if (action === 'copy-value') { copyValue(button.dataset.copy); return; }
    if (action === 'reset-filters') { state.area = '全部'; state.role = 'all'; state.category = '全部类型'; state.search = ''; $('search').value = ''; state.mode='browse'; render(); return; }
    if (action === 'compare') { openCompare(button.dataset.group,button.dataset.id); return; }
    if (['want','done','skip'].includes(action)) {
      const id = button.dataset.id;
      if (!byId.has(id)) return;
      const value = pref(id);
      if (action === 'want') value.want = !value.want;
      else value.status = value.status === action ? '' : action;
      preferences[id] = value; persist();
      const open = $('alternatives').open;
      if (open) {
        button.setAttribute('aria-pressed',String(action === 'want' ? !!value.want : value.status === action));
        button.classList.toggle('active',action === 'want' ? !!value.want : value.status === action);
        button.textContent = action === 'want' ? (value.want ? '♥':'♡') : action === 'done' ? (value.status === 'done' ? '✓ 已去过':'去过') : (value.status === 'skip' ? '已跳过':'跳过');
      }
      render(); return;
    }
  });
  $('search').addEventListener('input', event => { state.search = event.target.value; renderBrowse(); });
  $('type-button').addEventListener('click', () => { $('types').hidden = !$('types').hidden; $('type-button').setAttribute('aria-expanded',String(!$('types').hidden)); });
  $('close-dialog').addEventListener('click', () => $('alternatives').close());
  $('close-link-helper').addEventListener('click', () => $('link-helper').close());
  $('alternatives').addEventListener('click', event => { if (event.target === $('alternatives')) { const r = $('alternatives').getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $('alternatives').close(); } });
  $('original-guide').href = data.document; $('document-link').href = data.document; $('map-link').href = data.map;
  $('wechat-tip').hidden = !inWechat;
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
