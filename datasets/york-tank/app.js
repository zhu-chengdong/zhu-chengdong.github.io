'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const fmt = (n, d = 2) => n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString('en-GB', {minimumFractionDigits:d,maximumFractionDigits:d});
  const duration = s => { const whole = Math.round(s); return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`; };
  let lang = 'en', data, analysis, comparison, downloads, page = 1, filtered = [], selected, previewPosition = 50;
  const t = (en, zh) => lang === 'zh' ? zh : en;
  const group = id => data.groups.find(g => g.id === id);
  const groupName = id => lang === 'zh' ? group(id).zh : group(id).name;
  const staticText = [...document.querySelectorAll('[data-zh]')].map(el => ({el,en:el.innerHTML,zh:el.dataset.zh}));
  let lastFocus;
  function renderGroups() {
    $('condition-grid').innerHTML = data.groups.map(g => `<button class="condition-card" type="button" data-group="${g.id}" aria-label="${esc(t('Browse','浏览')+' '+groupName(g.id))}"><img src="assets/${g.example_id.toLowerCase()}-50-left.webp" width="640" height="400" loading="lazy" alt="${esc(groupName(g.id))} — ${g.example_id}"><span class="card-body"><span class="card-top"><span>${g.id.replace('sequence_','SEQ ')}</span><span>${g.count} ${t('RECORDINGS','条')}</span></span><strong>${esc(groupName(g.id))}</strong><span class="description">${esc(lang==='zh'?g.description_zh:g.description)}</span></span></button>`).join('');
    const old = $('condition').value;
    $('condition').innerHTML = `<option value="">${t('All conditions','全部条件')}</option>`+data.groups.map(g => `<option value="${g.id}">${esc(groupName(g.id))} (${g.count})</option>`).join('');
    $('condition').value = old;
    $('date').options[0].textContent = t('All dates','全部日期');
  }
  function applyFilters(resetPage = true) {
    const q = $('search').value.trim().toLowerCase(), condition = $('condition').value, date = $('date').value;
    filtered = data.sequences.filter(r => (!condition || r.group === condition) && (!date || r.date === date) && (!q || [r.id,r.source_stereo,r.source_reference,group(r.group).name,group(r.group).zh].some(x => x.toLowerCase().includes(q))));
    if (resetPage) page = 1;
    renderRows();
  }
  const archiveFor = r => downloads?.published ? downloads.sequences[r.id] : null;
  function archiveCell(r) {
    const a=archiveFor(r);
    return a ? `<a class="sequence-download" href="${esc(a.url)}" aria-label="${t('Download','下载')} ${r.id} ZIP">${t('Download ZIP ↓','下载ZIP ↓')}</a><span class="small">${fmt(a.bytes/1e9,3)} GB</span>` : `<span class="small">${t('Archive pending','归档中')}</span>`;
  }
  function archivePanel(r) {
    const a=archiveFor(r);
    if(!a)return '';
    return `<section class="sequence-archive" aria-label="${t('Sequence download','序列下载')}"><div><a class="button" href="${esc(a.url)}">${t('Download','下载')} ${r.id}.zip ↓</a><span>${fmt(a.bytes/1e9,3)} GB · v${esc(downloads.version)} · CC BY 4.0</span></div><p>${t('Rectified stereo PNGs, timestamps, candidate left-camera and board trajectories, calibration.','已校正双目PNG、时间戳、候选左目和板中心轨迹、标定。')}</p><details><summary>${t('SHA256 checksum','SHA256校验值')}</summary><code>${esc(a.sha256)}</code></details></section>`;
  }
  function renderRows() {
    const size = Number($('page-size').value), pages = Math.max(1,Math.ceil(filtered.length / size));
    page = Math.min(page,pages);
    $('sequence-rows').innerHTML = filtered.slice((page-1)*size,page*size).map(r => `<tr><td><div class="sample-cell"><img loading="lazy" src="${r.previews[1].left}" width="94" height="59" alt="${r.id} left camera sample"><div><strong>${r.id}</strong><span class="small">${r.group.replace('sequence_','SEQ ')}</span></div></div></td><td>${esc(groupName(r.group))}<span class="small">${r.date}</span></td><td><span class="value">${duration(r.duration_s)}</span><span class="small">${fmt(r.stereo_pairs,0)} ${t('pairs','对')}</span></td><td><span class="value">${fmt(r.metrics.raw_mean_gray,1)}</span><span class="small">${t('raw left / 255','原始左目 / 255')}</span></td><td><span class="value">${fmt(r.metrics.ate_rmse_cm)} cm / ${fmt(r.metrics.completeness_pct,1)}%</span><span class="small ${r.baseline_status==='Evaluated'?'':'warning'}">${r.baseline_status==='Evaluated'?t('candidate reference','候选位姿参考'):t('see baseline status','查看基线状态')}</span></td><td>${archiveCell(r)}</td><td><button class="secondary" data-sequence="${r.id}" aria-label="${t('View','查看')} ${r.id}">${t('View →','详情 →')}</button></td></tr>`).join('');
    $('results-count').textContent = `${filtered.length} / 64 ${t('recordings','条序列')} · ${t('metadata verified 1 Nov 2026','元数据核实于2026-11-01')}`;
    $('page-info').textContent = `${t('Page','第')} ${page} / ${pages} ${t('','页')}`;
    $('previous').disabled = page <= 1; $('next').disabled = page >= pages;
    $('empty').hidden = filtered.length !== 0;
    $('filtered-csv').disabled = filtered.length === 0;
  }
  function renderComparisons() {
    const currentComparisons=[...analysis.comparisons,...(analysis.light_comparisons||[]).map(r=>({group:r.comparison.split('_vs_')[0],matched_n:r.matched_n,target_n:r.target_n,outcomes:{ate_rmse_cm:r.ate_rmse_cm,completeness_pct:r.completeness_pct}}))];
    $('comparisons').innerHTML = currentComparisons.map(r => {
      const a=r.outcomes.ate_rmse_cm,c=r.outcomes.completeness_pct;
      return `<tr><td>${esc(groupName(r.group))}</td><td>${r.matched_n} / ${r.target_n}</td><td>${fmt(a.target.mean)} / ${fmt(a.control.mean)} cm <span class="small">n = ${a.valid_pair_n} ${t('pairs','对')}</span></td><td>${fmt(c.target.mean,1)} / ${fmt(c.control.mean,1)}% <span class="small">n = ${c.valid_pair_n} ${t('pairs','对')}</span></td></tr>`;
    }).join('');
    $('repair-results').innerHTML=data.sequences.filter(r=>r.baseline_revision==='export-safe-run002').map(r=>`<tr><td>${r.id}</td><td>${r.baseline_status==='Evaluated'?t('Evaluated','评估完成'):t('No initialization; export completed','未初始化；安全导出完成')}</td><td>${fmt(r.metrics.ate_rmse_cm)} cm</td><td>${fmt(r.metrics.completeness_pct,2)}%</td></tr>`).join('');
  }
  function renderReviewGroups() {
    const selectedGroup=$('review-group').value;
    $('review-group').innerHTML=`<option value="">${t('All sequences','全部sequence')}</option>`+data.groups.map(g=>`<option value="${g.id}">${g.id.replace('sequence_','sequence')} · ${esc(groupName(g.id))}</option>`).join('');
    $('review-group').value=selectedGroup;
  }
  function reviewCell(row,getValue,formatValue=value=>fmt(value)) {
    const version=$('review-version').value;
    const line=(key,label)=>`<div class="review-line ${key}"><small>${label}</small><span>${esc(formatValue(getValue(row[key])))}</span></div>`;
    if(version==='compare')return line('before',t('Before','修复前'))+line('after',t('After','修复后'));
    return `<span class="value">${esc(formatValue(getValue(row[version])))}</span>`;
  }
  function renderDailyReview() {
    if(!comparison)return;
    const day=$('review-date').value,condition=$('review-group').value;
    const include=r=>(!condition||r.group===condition)&&(day==='all'?r.date!=='both_dates':r.date===day);
    const byGroupDate=(a,b)=>a.group.localeCompare(b.group)||a.date.localeCompare(b.date);
    const cohorts=comparison.cohorts.filter(include).sort(byGroupDate);
    const matched=comparison.matched.filter(include).sort(byGroupDate);
    const dateLabel=date=>date==='both_dates'?t('Combined dates','两日汇总'):date;
    const label=r=>`<strong>${r.group.replace('sequence_','sequence')}</strong><span class="small">${esc(groupName(r.group))}</span>`;
    const integer=value=>fmt(value,0);
    const signed=value=>value===null||value===undefined?'—':(value>0?'+':'')+fmt(value);
    $('daily-cohorts').innerHTML=cohorts.map(r=>`<tr><td>${label(r)}</td><td>${dateLabel(r.date)}</td><td>${r.after.n}</td><td>${reviewCell(r,s=>s.ate_rmse_cm.mean)}</td><td>${reviewCell(r,s=>s.ate_rmse_cm.n,integer)}</td><td>${reviewCell(r,s=>s.completeness_pct.mean)}</td><td>${reviewCell(r,s=>s.completeness_pct.n,integer)}</td></tr>`).join('');
    const pairValues=o=>`${fmt(o.target_mean)} / ${fmt(o.reference_mean)}`;
    $('daily-matched').innerHTML=matched.map(r=>`<tr><td>${label(r)}<span class="small">${dateLabel(r.date)}</span></td><td>${r.matched_n} / ${r.target_n}</td><td>${reviewCell(r,s=>s.ate_rmse_cm,pairValues)}</td><td>${reviewCell(r,s=>s.ate_rmse_cm.valid_pair_n,integer)}</td><td>${reviewCell(r,s=>s.ate_rmse_cm.difference_mean,signed)}</td><td>${reviewCell(r,s=>s.completeness_pct,pairValues)}</td><td>${reviewCell(r,s=>s.completeness_pct.valid_pair_n,integer)}</td><td>${reviewCell(r,s=>s.completeness_pct.difference_mean,signed)}</td></tr>`).join('');
    $('matched-empty').hidden=matched.length>0;
    const versions={compare:t('before / after','修复前后'),after:t('after repair · v008','修复后v008'),before:t('preserved first run','保留的首轮结果')};
    $('review-status').textContent=`${cohorts.length} ${t('group/date means','条组别/日期均值')} · ${matched.length} ${t('matched control summaries','条同日匹配对照')} · ${versions[$('review-version').value]}`;
  }
  function box(value, label) { return `<div class="metric-box"><b>${value}</b><span>${label}</span></div>`; }
  function metadata(label, value) { return `<tr><td>${label}</td><td>${esc(value)}</td></tr>`; }
  function renderDialog() {
    const r=selected,m=r.metrics;
    $('dialog-title').textContent = `${r.id} — ${groupName(r.group)}`;
    $('dialog-kicker').textContent = `${r.date} / ${r.group.replace('sequence_','SEQUENCE ')} / ${t('DATASET RELEASE','数据集版本')} ${downloads?.published?'v'+downloads.version:''}`;
    $('close-dialog').textContent = t('Close ×','关闭 ×');
    $('dialog-content').innerHTML = `<p class="dialog-intro">${fmt(r.stereo_pairs,0)} ${t('retained pairs','对保留图像')} · ${fmt(r.duration_s,2)} s · ${t('native 1280 × 800 per eye','原始单目1280×800')} · ${t('preprocessing PASS; source hashes unchanged','预处理通过；原始bag校验未改变')}</p>
    ${archivePanel(r)}
    <div class="stereo-view" id="stereo-view"></div><div class="preview-tools"><span>${t('Temporal position','时间位置')}</span>${[25,50,75].map(p=>`<button data-position="${p}" aria-pressed="${previewPosition===p}">${p}%</button>`).join('')}<span>${t('Raw appearance · display 640 × 400 · no enhancement','原始外观 · 展示640×400 · 无增强')}</span></div><p class="timestamp" id="preview-timestamp"></p>
    <div class="metric-grid">${box(fmt(m.raw_mean_gray,1)+' / '+fmt(r.right_mean_gray,1),t('Mean grayscale · raw left / right','平均灰度 · 原始左/右'))}${box(fmt(m.dark_le030_pct,1)+'%',t('Dark fraction ≤30 · left','暗像素≤30 · 左'))}${box(fmt(m.bright_ge250_pct,2)+'%',t('Near saturation ≥250 · left','近饱和≥250 · 左'))}${box(fmt(m.spatial_cv_median,3),t('Spatial brightness CV · left','空间亮度CV · 左'))}${box(fmt(m.corner_density_median,0),t('Corners / MP · left','角点/百万像素 · 左'))}${box(fmt(m.dynamic_area_mean_pct,2)+'%',t('Semantic foreground · left','语义前景占比 · 左'))}${box(fmt(m.board_speed_p95_m_s,3)+' m/s',t('Board speed P95','板中心速度P95'))}${box(fmt(m.angular_speed_p95_deg_s,1)+' °/s',t('Rotation rate P95','角速度P95'))}${box(fmt(m.ate_rmse_cm)+' cm',t('ATE RMSE · candidate reference','ATE RMSE · 候选参考'))}${box(fmt(m.completeness_pct,3)+'%',t('Longest-segment completeness','最长连续段完整率'))}${box(fmt(m.tracking_ok_pct,1)+'%',t('Tracking OK frames','跟踪成功帧占比'))}${box(fmt(r.gt_valid_pct,1)+'%',t('Board-pose solver valid frames','板位姿求解有效帧'))}</div>
    <p class="detail-warning"><strong>${t('Baseline status','基线状态')}</strong> — ${esc(r.baseline_status)}<br>${t('Current run','当前运行')}: ${esc(r.baseline_run_id)}${r.baseline_revision==='export-safe-run002'?'<br>'+t('Fixed single rerun; original first-run state retained: ','固定单次重跑；保留首轮状态：')+esc(r.original_baseline_status):''}${r.rerun_note?'<br>'+t(r.rerun_note,'首轮SO3 NaN未在本次重跑复现，尚未证明数值故障已永久修复。'):''}${r.reference_fit_source?'<br>'+t('Historical transform-fit recording: not independent reference validation.','历史外参拟合来源，不是独立外参验证序列。'):''}<br>${t('All left-camera results use the historical candidate extrinsic. Pixel residual and low ATE do not establish independent metric GT accuracy.','左目结果均使用历史候选外参。像素重投影残差及较低ATE不能证明独立GT的米制精度。')}</p>
    <table class="detail-metadata"><tbody>${metadata(t('Original stereo bag','原始双目bag'),r.source_stereo)}${metadata(t('Original reference-camera bag','原始上视bag'),r.source_reference)}${metadata(t('Raw stereo image range (ns)','原始双目图像范围(ns)'),r.raw_stereo_start_ns+' → '+r.raw_stereo_end_ns)}${metadata(t('Raw reference image range (ns)','原始上视图像范围(ns)'),r.raw_reference_start_ns+' → '+r.raw_reference_end_ns)}${metadata(t('Shared crop interval (ns)','共同裁剪区间(ns)'),r.crop_start_ns+' → '+r.crop_end_ns)}${metadata(t('Crop review','头尾裁剪审阅'),t(r.crop_review,'头尾已审阅，保留内部预期退化'))}${metadata(t('Raw IMU messages retained','保留原始IMU消息'),fmt(r.imu_messages,0)+' · '+t('not used in current baseline','本轮基线未使用'))}${metadata(t('GT-camera frames / valid board poses','上视帧数/有效板位姿'),r.gt_frames+' / '+r.gt_valid_frames)}${metadata(t('Board reprojection median / P95','板重投影中位数/P95'),fmt(r.gt_reprojection_median_px,3)+' / '+fmt(r.gt_reprojection_p95_px,3)+' px')}${metadata(t('Right-eye descriptor checks','右目指标核查'),'CV '+fmt(m.right_spatial_cv_median,3)+' · '+t('corners/MP ','角点/MP ')+fmt(m.right_corner_density_median,0)+' · '+t('foreground ','前景 ')+fmt(m.right_dynamic_area_mean_pct,2)+'%')}${metadata(t('Fully saturated =255 · left','全饱和=255 · 左'),fmt(m.bright_ge255_pct,3)+'%')}${metadata(t('Semantic confidence sensitivity 0.1 / 0.5','前景置信度敏感性0.1/0.5'),fmt(m.dynamic_area_mean_pct_conf010,3)+' / '+fmt(m.dynamic_area_mean_pct_conf050,3)+'%')}</tbody></table>
    <p class="note" style="margin-top:16px">${t('Mean brightness uses all retained raw frames. Other appearance descriptors use 5 Hz source samples; previews are fixed temporal samples, not selected by SLAM outcome. Foreground is an estimated shark/stick mask, not a manual motion label.','平均亮度使用全部保留原始帧，其余外观指标使用5 Hz原始样图。预览按固定时间位置取样，不按SLAM结果挑图。前景为鲨鱼/木棒估计掩模，不是人工动态标注。')}</p>`;
    renderPreview();
  }
  function renderPreview() {
    const v=selected.previews.find(p=>p.position===previewPosition);
    $('stereo-view').innerHTML = ['left','right'].map(eye=>`<figure><img src="${v[eye]}" width="640" height="400" alt="${selected.id} ${eye} camera at ${previewPosition}%"><figcaption>${t(eye==='left'?'LEFT CAMERA':'RIGHT CAMERA',eye==='left'?'左相机':'右相机')} / ${selected.id}</figcaption></figure>`).join('');
    $('preview-timestamp').textContent = `${t('Original image header','原始图像header')}: ${v.timestamp_ns} ns · +${fmt(v.seconds_from_crop_start,3)} s ${t('from crop start','自裁剪起点')}`;
    document.querySelectorAll('[data-position]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.position)===previewPosition)));
  }
  function openSequence(id) {
    selected=data.sequences.find(r=>r.id===id); previewPosition=50; lastFocus=document.activeElement;
    renderDialog(); $('sequence-dialog').showModal(); $('close-dialog').focus();
    history.replaceState(null,'',`#sequence-${id}`);
  }
  function closeDialog() { $('sequence-dialog').close(); history.replaceState(null,'','#sequences'); }
  function csvDownload() {
    const columns=['id','group','date','duration_s','stereo_pairs','crop_start_ns','crop_end_ns','raw_mean_gray','spatial_cv_median','corner_density_median','dynamic_area_mean_pct','board_speed_p95_m_s','angular_speed_p95_deg_s','ate_rmse_cm','completeness_pct','baseline_status','baseline_run_id','baseline_revision','original_baseline_status'];
    const cell=v=>`"${String(v??'').replace(/"/g,'""')}"`;
    const csv='\ufeff'+columns.join(',')+'\r\n'+filtered.map(r=>columns.map(k=>cell(r[k]??r.metrics[k])).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`york-tank-64-filtered-${filtered.length}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function applyLanguage() {
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    staticText.forEach(x=>{x.el.innerHTML=lang==='zh'?x.zh:x.en;});
    $('language').textContent=lang==='zh'?'English':'中文';
    $('language').setAttribute('aria-label',lang==='zh'?'切换到英文':'Switch to Chinese');
    document.querySelectorAll('[data-personal-home]').forEach(a=>a.href='/?lang='+lang);
    if(data){renderGroups();renderComparisons();renderReviewGroups();renderDailyReview();applyFilters(false);if(selected && $('sequence-dialog').open)renderDialog();}
  }
  $('language').addEventListener('click',()=>{
    lang=lang==='en'?'zh':'en';
    try { localStorage.setItem('cdz-language',lang); } catch { /* Optional preference. */ }
    applyLanguage();
  });
  function closeNavigation(){ $('nav-toggle').setAttribute('aria-expanded','false');document.body.classList.remove('nav-open'); }
  $('nav-toggle').addEventListener('click',()=>{const open=$('nav-toggle').getAttribute('aria-expanded')!=='true';$('nav-toggle').setAttribute('aria-expanded',String(open));document.body.classList.toggle('nav-open',open);});
  $('dataset-nav').addEventListener('click',e=>{if(e.target.closest('a'))closeNavigation();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNavigation();});
  $('condition-grid').addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(!b)return;$('condition').value=b.dataset.group;$('search').value='';$('date').value='';applyFilters();$('sequences').scrollIntoView();});
  $('sequence-rows').addEventListener('click',e=>{const b=e.target.closest('[data-sequence]');if(b)openSequence(b.dataset.sequence);});
  $('dialog-content').addEventListener('click',e=>{const b=e.target.closest('[data-position]');if(b){previewPosition=Number(b.dataset.position);renderPreview();}});
  $('close-dialog').addEventListener('click',closeDialog);
  $('sequence-dialog').addEventListener('cancel',()=>history.replaceState(null,'','#sequences'));
  $('sequence-dialog').addEventListener('close',()=>lastFocus?.focus());
  $('sequence-dialog').addEventListener('click',e=>{if(e.target===$('sequence-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  ['search','condition','date','page-size'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>data&&applyFilters()));
  $('reset').addEventListener('click',()=>{$('search').value='';$('condition').value='';$('date').value='';applyFilters();});
  $('previous').addEventListener('click',()=>{page--;renderRows();});$('next').addEventListener('click',()=>{page++;renderRows();});
  $('filtered-csv').addEventListener('click',csvDownload);
  ['review-version','review-date','review-group'].forEach(id=>$(id).addEventListener('change',renderDailyReview));
  $('review-reset').addEventListener('click',()=>{$('review-version').value='compare';$('review-date').value='all';$('review-group').value='';renderDailyReview();});
  async function start() {
    try {
      const results=await Promise.all(['data/catalog.json','data/analysis.json','data/comparison-by-date-v001.json','data/downloads.json'].map(async path=>{const r=await fetch(path);if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}));
      [data,analysis,comparison,downloads]=results;
      if(data.sequences.length!==64||new Set(data.sequences.map(r=>r.id)).size!==64)throw Error('Catalogue validation failed');
      const requestedLanguage=new URLSearchParams(location.search).get('lang');
      let preferredLanguage=requestedLanguage;
      if(!preferredLanguage){try{preferredLanguage=localStorage.getItem('cdz-language');}catch{/* Optional preference. */}}
      lang=preferredLanguage==='zh'?'zh':'en';
      applyLanguage();
      const match=location.hash.match(/^#sequence-(P\d{3})$/);if(match&&data.sequences.some(r=>r.id===match[1]))openSequence(match[1]);
    } catch(e) { $('results-count').textContent=t('Catalogue could not load. Download the metadata CSV or refresh this page.','目录加载失败，请下载元数据CSV或刷新页面。');$('results-count').classList.add('error');console.error(e); }
  }
  start();
})();
