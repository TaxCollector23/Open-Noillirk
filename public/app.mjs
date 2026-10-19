import { TIERS, BANDS, ROUND_MS, bandFor, shareText, etDate } from './rules.mjs';
import { Ocean } from './ocean.mjs';
import { Sound } from './sound.mjs';
import { DROP_MS, easeInOut, easeOut, iconFor, tierImage, diveChart, distributionChart } from './presentation.mjs';
import { noillirkApi } from './noillirk-adapter.mjs';

const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const runtime=JSON.parse($('runtime-config').textContent);
const testMode=runtime.local&&new URLSearchParams(location.search).has('test');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{/* Private browsing can limit storage. */}};
const settings={lowPower:false,colorblind:false,corrections:true,clearRejected:false,shareLink:true,buddy:'krill',...read('noillirk:settings',{})};
const scene=new Ocean($('ocean'),$('mascot')),sound=new Sound();
let today=null,game=null,phase='intro',busy=false,clockOffset=0,autoSent=false,correction=null,lastTick=-1,review=null,currentScore=0,paused=false,dialogPausePending=null,clockAtServer=0,visualScore=0,scoreAnimation=null,promptExitTimer=null,selectedMode=read('noillirk:mode','classic');
if(!['daily','classic','endless'].includes(selectedMode))selectedMode='classic';
const now=()=>Date.now()+clockOffset+clockAtServer;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,testMode?Math.min(ms,40):ms));
const MODE_COPY={daily:{button:'START DAILY CLIMB',description:'The same seven prompts for everyone today.'},classic:{button:'START CLASSIC CLIMB',description:'A fresh set of seven prompts · 15 seconds each.'},endless:{button:'START ENDLESS CLIMB',description:'Keep going: a miss pops a balloon; Sky High restores one.'}};
function syncModePicker(){
  const copy=MODE_COPY[selectedMode]||MODE_COPY.classic;
  $('mode-description').textContent=copy.description;$('start-btn').textContent=copy.button;
  document.querySelectorAll('#mode-picker [data-mode]').forEach(item=>{const active=item.dataset.mode===selectedMode;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
}
const analyticsAllowed=location.hostname==='openkrillion.com'&&!navigator.webdriver&&!runtime.local;
function track(name,props={}){if(!analyticsAllowed)return;window.plausible?.(name,{props});window.gtag?.('event',name.toLowerCase().replace(/[^a-z0-9_]/g,'_'),props);window.clarity?.('event',name);}
function loadScript(src){const s=document.createElement('script');s.async=true;s.src=src;document.head.append(s);}
if(analyticsAllowed){
  window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};window.plausible.init=function(o){window.plausible.o=o||{}};window.plausible.init();loadScript(runtime.plausible);
  if(runtime.ga4){window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',runtime.ga4,{anonymize_ip:true});loadScript('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(runtime.ga4));}
  if(runtime.clarity){window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};loadScript('https://www.clarity.ms/tag/'+encodeURIComponent(runtime.clarity));}
}
async function api(path,data){return noillirkApi(path,data);}
function setPhase(value){const card=$('prompt-card'),exiting=value==='plunge'&&!card.hidden;clearTimeout(promptExitTimer);card.classList.toggle('leaving',exiting);if(exiting)promptExitTimer=setTimeout(()=>{if(phase==='plunge')card.hidden=true;},testMode?40:650);phase=value;if(value!=='answering')document.body.classList.remove('timer-hot');document.body.dataset.phase=value;scene.setPhase(value);$('hero').hidden=false;$('intro').hidden=value!=='intro';card.hidden=!exiting&&!['preview','answering'].includes(value);$('answer-dock').hidden=value!=='answering';$('preview-label').hidden=value!=='preview';$('landing').hidden=value!=='landed';$('next-wrap').hidden=value!=='landed';$('results').hidden=value!=='done';$('falling-answer').hidden=value!=='plunge';$('tier-ladder').hidden=value!=='plunge';}
function applySettings(){scene.lowPower=settings.lowPower;document.body.classList.toggle('low-power',settings.lowPower);document.body.classList.toggle('colorblind',settings.colorblind);document.querySelectorAll('[data-setting]').forEach(input=>input.checked=!!settings[input.dataset.setting]);sound.mute(!!settings.muted);$('mute-btn').setAttribute('aria-pressed',String(!!settings.muted));$('mute-btn').setAttribute('aria-label',settings.muted?'Turn sound on':'Turn sound off');$('mute-btn').innerHTML=`<svg viewBox="0 0 20 16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 6h3l4-4v12l-4-4H2z"/>${settings.muted?'<path d="m12 5 5 6m0-6-5 6" stroke="currentColor" stroke-width="2"/>':'<path d="M11 6h2v4h-2zm4-3h2v10h-2z"/>'}</svg>`;$('mascot').dataset.buddy=settings.buddy;const buddy=buddyOptions.find(b=>b.id===settings.buddy)||buddyOptions[0];$('mascot').querySelector('img').src=buddy.src;$('mascot').querySelector('img').alt=buddy.name;syncBuddyGold();}
const buddyOptions=[{id:'krill',name:'The Krill',streak:0,src:'/assets/krill.svg'},{id:'schooler',name:'Schooler',streak:5,src:'/assets/schooler.svg'},{id:'rare',name:'Rare Squid',streak:14,src:'/assets/rare.svg'},{id:'deepcut',name:'Deep Cut Angler',streak:30,src:'/assets/deepcut.svg'},{id:'evil',name:'Evil Krill',streak:45,src:'/assets/evil.svg'}];
applySettings();
function updateHud(){
  const results=game?.results||[];currentScore=results.reduce((sum,result)=>sum+result.score,0);
  $('score').textContent=Math.round(visualScore);$('depth').textContent=Math.round(currentScore*10).toLocaleString('en-US')+'m';
  $('round-label').textContent=game?(game.completed?'CLIMB COMPLETE':game.mode==='endless'?`PROMPT ${game.round+1}`:`PROMPT ${Math.min(7,game.round+1)} OF 7`):'READY';
  document.querySelectorAll('#round-dots i').forEach((dot,index)=>{const result=results.find(item=>item.round===index);dot.className=result?'done':index===(game?.round??-1)?'active':'';dot.style.setProperty('--dot-color',result?'#ffd166':'#26364b');});
  const oxygen=$('endless-oxygen');
  if(oxygen){oxygen.hidden=game?.mode!=='endless'||game?.completed;oxygen.setAttribute('aria-label',`${game?.oxygen??3} balloons remaining`);oxygen.querySelectorAll('span').forEach((balloon,index)=>{balloon.classList.toggle('popped',index>=(game?.oxygen??3));balloon.setAttribute('aria-hidden','true');});}
  const turn=$('party-turn');
  if(turn){const players=game?.players||[];turn.hidden=!players.length;if(players.length){const nextPlayer=players[results.length%players.length];turn.textContent=game.roundStart===null?`PASS DEVICE TO ${nextPlayer}`:`${nextPlayer} · YOUR TURN`;}}
}
function saveRun(){if(!game)return;write('noillirk:run',{runId:game.runId,date:game.date,mode:game.mode});}
function setGame(value){game=value;clockOffset=0;clockAtServer=typeof game.serverNow==='number'?game.serverNow-Date.now():0;visualScore=game.results.reduce((sum,r)=>sum+r.score,0);saveRun();updateHud();}
async function begin(mode=selectedMode){
  if(busy)return;
  const requested=typeof mode==='boolean'?(mode?'classic':selectedMode):mode;
  const gameMode=requested==='practice'?'classic':requested;
  busy=true;paused=false;$('start-btn').disabled=true;$('boot-error').hidden=true;
  await sound.init();
  try{
    const response=await api('start',{mode:gameMode});
    setGame(response);sound.event('begin');scene.targetActive=1;review=null;
    if(game.completed){await showResults();return;}
    if(game.roundStart===null&&game.results.length){const last=game.results.at(-1);showLanding({...last,promptText:game.prompts[last.round]?.text});}
    else showRound();
    track('Climb Started',{mode:game.mode,day:game.dayNumber});
  }catch(e){setPhase('intro');$('boot-error').textContent=e.message;$('boot-error').hidden=false;}
  finally{busy=false;$('start-btn').disabled=false;}
}
function showRound(){setPhase('preview');syncBuddyGold();correction=null;autoSent=false;lastTick=-1;$('answer-status').textContent='';$('answer-status').className='answer-status';const p=game.prompts[game.round];$('prompt-number').textContent=game.mode==='endless'?`PROMPT ${game.round+1}`:`PROMPT ${game.round+1} OF 7`;$('prompt-text').textContent=p.text;$('answer').value=read('noillirk:draft:'+game.runId+':'+game.round,'');$('answer').disabled=true;$('submit-btn').disabled=true;scene.setDepth(-currentScore*10);scene.roundBase=-currentScore*10;scene.roundIndex=game.round;scene.round(-currentScore*10);tick();}
async function submit(timeout=false){
  if(!game||busy||!['preview','answering'].includes(phase)||paused)return;
  const raw=$('answer').value.trim();if(!raw&&!timeout)return;
  busy=true;$('submit-btn').disabled=true;
  try{
    const response=await api('answer',{runId:game.runId,round:game.round,answer:raw,timeout,confirm:correction===raw,previewCorrection:settings.corrections});
    if(response.rejected){
      $('answer-status').className='answer-status';
      $('answer-status').textContent=response.message||'That answer is off topic. Try again with one specific, accurate answer.';
      sound.event('reject');$('answer').classList.remove('shake');void $('answer').offsetWidth;$('answer').classList.add('shake');
      if(settings.clearRejected)$('answer').value='';correction=null;
    }else if(response.correction){
      correction=response.correction;$('answer-status').className='answer-status correction';
      $('answer-status').innerHTML=`“${escape(raw)}” → corrects to “${escape(correction)}”<small>submit again to confirm · or edit</small>`;
      $('answer').value=correction;write('noillirk:draft:'+game.runId+':'+game.round,correction);
    }else if(response.alreadyScored){
      setGame(response.state);
      if(game.completed)await showResults();else if(game.roundStart===null)showLanding(game.results.at(-1));else showRound();
    }else{
      const oldScore=currentScore;setGame(response.state);sound.event('submit');
      const rect=$('answer').getBoundingClientRect();
      for(let i=0;i<12;i++)scene.typeAt(rect.left+Math.random()*rect.width,rect.top+Math.random()*rect.height,1);
      track('Answer Scored',{mode:game.mode,round:response.result.round+1,tier:response.result.tier||'miss'});
      await plunge(response.result,oldScore);
    }
  }catch(e){$('answer-status').textContent=e.message;$('answer-status').className='answer-status';}
  finally{busy=false;if(phase==='answering'){$('submit-btn').disabled=!$('answer').value.trim();$('answer').focus({preventScroll:true});}}
}
function animateScore(from,to,gold=false){
  if(scoreAnimation)cancelAnimationFrame(scoreAnimation);
  const started=performance.now(),duration=testMode?60:gold?1100:700;
  const frame=t=>{const p=Math.min(1,(t-started)/duration),e=1-(1-p)**4;visualScore=from+(to-from)*e;scene.depth=-visualScore*10;$('score').textContent=Math.round(visualScore);if(p<1)scoreAnimation=requestAnimationFrame(frame);else{visualScore=to;if(gold){$('score').classList.add('slam');setTimeout(()=>$('score').classList.remove('slam'),520);}}};
  scoreAnimation=requestAnimationFrame(frame);
}
async function plunge(result,oldScore){
  setPhase('plunge');document.body.dataset.tier=result.tier||'miss';visualScore=oldScore;updateHud();scene.roundIndex=game.round;
  const fall=$('falling-answer'),ladder=$('tier-ladder');fall.textContent=result.answer?`“${result.answer.toUpperCase()}”`:'';fall.style.color=TIERS[result.tier]?.color||'#7d93b8';fall.style.setProperty('--chip-color',TIERS[result.tier]?.color||'#7d93b8');
  ladder.innerHTML=result.tier?Object.entries(TIERS).filter(([id])=>id!=='miss').map(([id,t],i)=>`<div class="tier-line" data-tier="${id}" data-score="${t.score}" style="--index:${i};--line-color:${t.color}"><span>${tierImage(id)}${t.name.toUpperCase()} · ${t.score}</span></div>`).join(''):'';
  const duration=testMode?80:DROP_MS[result.tier||'miss'],began=performance.now();let lastPassed=-1;
  if(result.tier&&result.tier!=='miss')sound.event('rise');else{sound.event('miss');$('game').classList.add('shake');setTimeout(()=>$('game').classList.remove('shake'),500);}
  await new Promise(resolve=>{const frame=t=>{const p=Math.min(1,(t-began)/duration),e=easeInOut(p);scene.drop(-oldScore*10,{...result,score:-result.score},p);const sway=result.tier==='grounded'?36*Math.sin(p*7)*(1-.25*p):result.tier==='treetop'?7*Math.sin(p*42):Math.sin(p*(result.tier==='skyhigh'?24:16))*(1-p)*(result.tier==='skyhigh'?26:14);fall.style.left=`calc(50% - 24px + ${sway}px)`;fall.style.rotate=(sway*(result.tier==='grounded'?.55:.4))+'deg';fall.style.top=(scene.layout().height/2-60)+'px';
    const travelled=90+(-result.score*10-90)*e;Array.from(ladder.children).forEach((line,i)=>{if(travelled<=-Number(line.dataset.score)*10+4&&!line.classList.contains('active')){line.classList.add('active');if(i>lastPassed){sound.event('tier');lastPassed=i;}}});
    if(p<1)requestAnimationFrame(frame);else{scene.cameraDepth=scene.cameraTarget;resolve();}};requestAnimationFrame(frame);});
  showLanding(result,oldScore);
}
function showLanding(result,oldScore=currentScore-result.score){
  setPhase('landed');const tier=TIERS[result.tier];document.body.dataset.tier=result.tier||'miss';document.documentElement.style.setProperty('--tier',tier?.color||'#7d93b8');
  const icon=$('land-icon');icon.hidden=!tier;icon.src='/assets/'+(iconFor(result.tier)||'plankton')+'.svg';icon.style.visibility='visible';
  $('land-tier').textContent=tier?.name.toUpperCase()||'NO LIFT';$('land-answer').textContent=result.answer?`“${result.answer}”`:'—';$('land-points').innerHTML=`<b>+${result.score} PTS</b>${result.score?' · rise '+(result.score*10).toLocaleString('en-US')+'m':''}`;
  $('land-quip').textContent=result.quip||tier?.blurb||(result.rawAnswer?'That entry was not accepted. Try a more direct answer next time.':'The clock ran out before an answer was entered.');$('next-btn').textContent=game.completed?'VIEW RESULTS ▲':'CLIMB HIGHER ▲';
  if(tier)sound.event(result.tier);scene.target=-currentScore*10;scene.roundIndex=game.round;
  if(!scene.fx)scene.fx={tier:result.tier,progress:1};
  scene.moveCamera(-currentScore*10-30,testMode?1:500);
  const gold=result.tier==='skyhigh';visualScore=oldScore;
  if(gold){$('mascot').classList.remove('celebrate');void $('mascot').offsetWidth;$('mascot').classList.add('celebrate');setTimeout(()=>$('mascot').classList.remove('celebrate'),testMode?30:1250);scene.goldLandAt=performance.now();setTimeout(()=>{if(phase!=='landed'||game.results.at(-1)?.round!==result.round)return;syncBuddyGold();scene.burst('#ffd166',42);animateScore(oldScore,currentScore,true);},testMode?20:1000);}else animateScore(oldScore,currentScore);
  if(['jetstream','skyhigh'].includes(result.tier)){$('game').classList.add('shake');setTimeout(()=>$('game').classList.remove('shake'),500);}
  if(result.score>=60){scene.burst(tier.color,result.score===100?36:22);document.querySelector('.flash').style.background=tier.color;document.querySelector('.flash').classList.remove('on');void document.querySelector('.flash').offsetWidth;document.querySelector('.flash').classList.add('on');}
  if(!gold)syncBuddyGold();updateHud();
}
async function next(){if(busy)return;busy=true;try{if(game.completed){sound.event('surface');const duration=Math.min(9000,Math.max(2500,(currentScore*10+30)*3));scene.moveCamera(-currentScore*10-45,testMode?1:duration,easeOut);await showResults();return;}sound.event('begin');const data=await api('next',{runId:game.runId});setGame(data);showRound();}catch(e){$('land-quip').textContent=e.message;}finally{busy=false;}}
function syncBuddyGold(){const gold=game?.results.some(r=>r.tier==='skyhigh');$('mascot').classList.toggle('gold',!!gold);if(settings.buddy==='krill')$('mascot').querySelector('img').src=gold?'/assets/krill-gold.svg':'/assets/krill.svg';}
function historyStats(){const history=read('noillirk:history',{}),daily=Object.values(history).filter(r=>r.mode==='daily').sort((a,b)=>a.date.localeCompare(b.date));let bestStreak=0,streak=0,last=null;for(const r of daily){streak=last&&Date.parse(r.date)-Date.parse(last)===86400000?streak+1:1;bestStreak=Math.max(bestStreak,streak);last=r.date;}const diff=last?(Date.parse(etDate())-Date.parse(last))/86400000:Infinity;const current=diff<=1?streak:0;return{history,daily,played:daily.length,current,bestStreak,best:Math.max(0,...daily.map(r=>r.score)),average:daily.length?Math.round(daily.reduce((s,r)=>s+r.score,0)/daily.length):0};}
function storeHistory(){const history=read('noillirk:history',{}),key=game.mode==='daily'?game.date:game.runId;history[key]={date:game.date,dayNumber:game.dayNumber,mode:game.mode,score:currentScore,results:game.results};write('noillirk:history',history);}
function chart(results){return diveChart(results,escape);}
async function showResults(){setPhase('done');visualScore=currentScore;syncBuddyGold();scene.setDepth(-currentScore*10);review=null;storeHistory();const band=bandFor(currentScore),stats=historyStats();document.documentElement.style.setProperty('--tier',TIERS[band.tier].color);const modeName=({daily:'Daily',classic:'Classic',endless:'Endless'})[game.mode]||'Climb';const partyScore=(game.players||[]).map(player=>{const score=game.results.filter(result=>result.player===player).reduce((sum,result)=>sum+result.score,0);return `<li>${escape(player)} <strong>${score} pts</strong></li>`}).join('');$('results').innerHTML=`<header class="result-header"><span class="result-brand">OPEN NOILLIRK</span><span>${modeName} · climb complete</span></header><div class="result-score"><strong>${currentScore}</strong><span>+${(currentScore*10).toLocaleString('en-US')}m</span></div><div class="distribution" id="distribution"><p>Preparing your climb summary…</p></div><p class="rule">ASCENT LOG · COMMONER ANSWERS CLIMB HIGHER</p>${chart(game.results)}<p class="rule">YOUR CLIMB</p><ul class="band-list">${BANDS.map(b=>`<li class="${b===band?'current':''}">${tierImage(b.tier)}<span class="band-range" style="color:${TIERS[b.tier].color}">${b.min}${b.max===700?'+':'–'+b.max}</span><span>${b.name}. ${b.text}</span></li>`).join('')}</ul>${partyScore?`<p class="rule">LOCAL PARTY SCORES</p><ul class="party-results">${partyScore}</ul>`:''}<div class="share-actions"><button class="quiet" id="copy-result">Copy result</button>${navigator.share?'<button class="quiet" id="native-share">Share…</button>':''}</div><div class="actions"><button class="quiet" data-action="classic">PLAY CLASSIC</button><button class="quiet" data-action="logbook">LOGBOOK ⟲</button><button class="quiet" data-action="guide">HOW TO PLAY →</button></div><p class="rule">ANSWER REVIEW · TAP A ROUND TO SEE THE BOARD</p><ul class="answer-review">${game.results.map((r,i)=>`<li><button class="review-toggle" aria-expanded="false" data-review="${i}" style="--dot-color:${TIERS[r.tier]?.color||'#43556b'}"><span class="review-number">${i+1}</span><i class="review-dot">${tierImage(r.tier)}</i><span class="review-question">${escape(game.prompts[i].text)}<small>${escape(r.answer||'—')}</small></span><span class="review-points">${r.score}</span><span class="review-sign">+</span></button><div class="review-expanded" hidden></div></li>`).join('')}</ul><p class="rule">YOUR LOGBOOK</p><p class="logbook-line">daily streak ${stats.current} · daily climbs ${stats.played} · average ${stats.average} · best ${stats.best}</p><p class="reset-countdown" id="reset-countdown"></p><form class="suggestion" id="suggestion-form"><label for="suggestion">Private note for a future prompt idea · saved only in this browser.</label><div><input id="suggestion" placeholder="name a type of cloud…" maxlength="1000"><button class="quiet" type="submit">save note</button></div><p class="muted" id="suggestion-status"></p></form><div><p class="muted">Rate this climb for your local notes · 1 = rough · 5 = great</p><div class="rating" role="group" aria-label="Rate this climb">${[1,2,3,4,5].map(n=>`<button data-rating="${n}" aria-pressed="false" aria-label="${n} out of 5">${n}</button>`).join('')}</div><p class="muted" id="rating-status"></p></div><footer class="original-footer result-footer"><p>Open Noillirk · open source, open sky.</p><nav><a href="https://github.com/TaxCollector23/Open-Noillirk" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="/about">About</a><a href="/privacy">Privacy</a><button class="text-button" data-action="guide">How to play</button></nav><p class="independent">The interface is adapted from MIT-licensed OpenKrillion; Noillirk’s game and scoring rules are independent.</p></footer>`;$('results').scrollTop=0;updateHud();try{review=await api('review?run='+encodeURIComponent(game.runId));const d=$('distribution');if(phase!=='done')return;d.innerHTML=distributionChart([],currentScore,0)+`<p>${game.mode==='daily'?'Your daily result is saved on this device. No population comparison is collected.':'A local-first climb · no population comparison is collected.'}</p>`;}catch{$('distribution').innerHTML='<p>Your score is saved on this device. The answer board could not be loaded.</p>';}}
function resultText(){let text=shareText(game.dayNumber,game.results);if(!settings.shareLink)text=text.replace('\nhttps://open-noillirk.vercel.app','');return text;}
async function copyResult(button){try{await navigator.clipboard.writeText(resultText());button.textContent='Copied ✓';track('Result Copied',{score:currentScore});setTimeout(()=>button.textContent='Copy result',2200);}catch{button.textContent='Select and copy below';const box=document.createElement('textarea');box.value=resultText();box.readOnly=true;box.style.width='100%';button.parentElement.after(box);box.select();}}
async function expandReview(button){const i=Number(button.dataset.review),box=button.nextElementSibling,open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));button.querySelector('.review-sign').textContent=open?'+':'−';box.hidden=open;if(open)return;if(!review){box.innerHTML='<p class="muted">Loading accepted answers…</p>';try{review=await api('review?run='+encodeURIComponent(game.runId));}catch{box.innerHTML='<p class="muted">Could not load answers. Close and try again.</p>';return;}}const answers=review.prompts[i].answers,own=game.results[i].answer;box.innerHTML=`${answers.length>30?'<input class="search-answers" aria-label="Search accepted answers" placeholder="search '+answers.length+' answers…">':''}<ul class="review-list">${answers.map(a=>`<li data-answer="${escape(a.answer.toLowerCase())}" style="color:${TIERS[a.tier].color}"><span>${escape(a.answer)}${a.answer===own?'<b class="you">YOU</b>':''}${a.quip?'<small>'+escape(a.quip)+'</small>':''}</span><span>+${a.score}</span></li>`).join('')}</ul>`;}
function openLogbook(){const s=historyStats();$('logbook-content').innerHTML=`<div class="stats-grid"><div><strong>${s.current}</strong><span>Current streak</span></div><div><strong>${s.bestStreak}</strong><span>Best streak</span></div><div><strong>${s.played}</strong><span>Daily climbs</span></div><div><strong>${s.best}</strong><span>Best daily score</span></div></div><ul class="history-list">${Object.values(s.history).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30).map(r=>`<li><span>${escape(r.date)} <small>${r.mode}</small></span><span>${r.score} pts · +${r.score*10}m</span></li>`).join('')||'<li>Your next climb starts your logbook.</li>'}</ul>`;openDialog('logbook-dialog');}
function renderPartyRoom(room){
  if(!room?.local||!Array.isArray(room.players)||room.players.length<2)return;
  $('party-names').value=room.players.join(', ');$('party-code').textContent='THIS DEVICE';
  $('party-players').textContent=room.players.join(' · ');$('party-create').hidden=true;
  $('party-ready').hidden=false;$('party-error').hidden=true;
}
function openWardrobe(){const best=historyStats().bestStreak;$('buddy-list').innerHTML=buddyOptions.map(b=>`<button data-buddy="${b.id}" aria-pressed="${settings.buddy===b.id}" ${best<b.streak?'disabled':''}><img src="${b.src}" alt=""><span>${b.name}</span><small>${best>=b.streak?'Earned':b.streak+'-day streak'}</small></button>`).join('');openDialog('wardrobe-dialog');}
async function pauseGame(){if(!game||!['preview','answering'].includes(phase)||paused)return;paused=true;try{dialogPausePending=api('pause',{runId:game.runId,paused:true});setGame(await dialogPausePending);}catch{paused=false;}finally{dialogPausePending=null;}}
async function resumeGame(){if(document.querySelector('dialog[open]')||$('guide').open||!paused)return;const rid=game.runId;try{if(dialogPausePending)await dialogPausePending;const resumed=await api('pause',{runId:rid,paused:false});if(game.runId===rid)setGame(resumed);paused=false;tick();}catch{$('answer-status').textContent='Could not resume. Reopen the menu and try again.';}}
function openDialog(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal();void pauseGame();}
function openGuide(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('guide').open=true;void pauseGame();track('Guide Opened');}
function closeGuide(){$('guide').open=false;void resumeGame();}
function doAction(action){
  document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
  if(['daily','classic','endless'].includes(action)){selectedMode=action;write('noillirk:mode',selectedMode);syncModePicker();void begin(action);return;}
  if(action==='practice'){selectedMode='classic';syncModePicker();void begin('classic');return;}
  if(action==='multiplayer')openDialog('party-dialog');
  if(action==='guide')openGuide();
  if(action==='settings')openDialog('settings-dialog');
  if(action==='logbook')openLogbook();
}
function tick(){if(game&&['preview','answering'].includes(phase)&&!paused){const remaining=game.roundStart+ROUND_MS-now();if(now()<game.roundStart){const count=Math.max(1,Math.ceil((game.roundStart-now())/1000));$('preview-label').textContent=`Starting in ${count}…`;$('timer-number').textContent=count;document.documentElement.style.setProperty('--time',1);}else{if(phase==='preview'){setPhase('answering');$('answer').disabled=false;$('preview-label').textContent='';$('answer').focus({preventScroll:true});}$('submit-btn').disabled=busy||!$('answer').value.trim();const seconds=Math.max(0,Math.ceil(remaining/1000));document.body.classList.toggle('timer-hot',remaining<=3050);$('timer-number').textContent=seconds;document.documentElement.style.setProperty('--time',Math.max(0,remaining/ROUND_MS));document.documentElement.style.setProperty('--urgency',seconds<=3&&!scene.reduced?(1-seconds/4)*(.35+Math.sin(Date.now()*.012)*.2):0);if(seconds>0&&seconds<=3&&seconds!==lastTick){sound.event('tick');lastTick=seconds;}if(remaining<=0&&!autoSent&&!busy){autoSent=true;void submit(true);}}}else document.documentElement.style.setProperty('--urgency',0);if($('reset-countdown')&&game){const d=Math.max(0,(game.resetsAt-Date.now())/1000),h=Math.floor(d/3600),m=Math.floor(d%3600/60),s=Math.floor(d%60);$('reset-countdown').textContent=`next climb in ${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}if(game)$('depth').textContent=Math.round(currentScore*10).toLocaleString('en-US')+'m';}
syncModePicker();
$('start-btn').addEventListener('click',()=>begin(selectedMode));$('practice-btn').addEventListener('click',()=>begin('classic'));$('menu-btn').addEventListener('click',()=>openDialog('menu-dialog'));$('settings-btn').addEventListener('click',()=>openDialog('settings-dialog'));$('wardrobe-btn').addEventListener('click',openWardrobe);$('logbook-btn').addEventListener('click',openLogbook);$('guide-btn').addEventListener('click',openGuide);$('guide-link').addEventListener('click',openGuide);$('close-guide').addEventListener('click',closeGuide);$('guide').addEventListener('toggle',()=>{$('guide').open?void pauseGame():void resumeGame()});$('next-btn').addEventListener('click',next);
$('mode-picker').addEventListener('click',e=>{const button=e.target.closest('[data-mode]');if(!button)return;selectedMode=button.dataset.mode;write('noillirk:mode',selectedMode);syncModePicker();});
$('multiplayer-btn').addEventListener('click',()=>openDialog('party-dialog'));
$('party-create-btn').addEventListener('click',()=>{
  const names=[...new Set($('party-names').value.split(',').map(name=>name.trim()).filter(Boolean))];
  if(names.length<2||names.length>4){$('party-error').textContent='Enter 2–4 player names, separated by commas.';$('party-error').hidden=false;return;}
  if(names.some(name=>name.length>20)){$('party-error').textContent='Keep each player name to 20 characters or fewer.';$('party-error').hidden=false;return;}
  const room={players:names,local:true};write('noillirk:party',room);renderPartyRoom(room);
});
$('party-edit-btn').addEventListener('click',()=>{
  const room=read('noillirk:party');if(room?.players?.length)$('party-names').value=room.players.join(', ');
  $('party-ready').hidden=true;$('party-create').hidden=false;$('party-error').hidden=true;
});
renderPartyRoom(read('noillirk:party'));
$('party-start-btn').addEventListener('click',()=>{$('party-dialog').close();write('noillirk:party-next',true);selectedMode='classic';syncModePicker();void begin('classic');});
$('mute-btn').addEventListener('click',async()=>{await sound.init();settings.muted=!settings.muted;write('noillirk:settings',settings);applySettings();});$('mascot').addEventListener('click',async()=>{await sound.init();sound.event('blub');$('mascot').classList.remove('poked');void $('mascot').offsetWidth;$('mascot').classList.add('poked');setTimeout(()=>$('mascot').classList.remove('poked'),1000)});
$('answer-form').addEventListener('submit',e=>{e.preventDefault();void submit(false)});$('answer').addEventListener('input',()=>{const r=$('answer').getBoundingClientRect();scene.typeAt(r.left+14+Math.min(11*$('answer').value.length,r.width-28),r.top+5);write('noillirk:draft:'+game.runId+':'+game.round,$('answer').value);if(correction!==$('answer').value){correction=null;$('answer-status').textContent=''}tick()});
$('pass-btn').addEventListener('click',()=>void submit(true));
document.addEventListener('click',e=>{const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();const action=e.target.closest('[data-action]');if(action)doAction(action.dataset.action);const r=e.target.closest('[data-review]');if(r)void expandReview(r);const copy=e.target.closest('#copy-result');if(copy)void copyResult(copy);if(e.target.closest('#native-share'))navigator.share?.({text:resultText()}).catch(()=>{});const buddy=e.target.closest('[data-buddy]');if(buddy){settings.buddy=buddy.dataset.buddy;write('noillirk:settings',settings);applySettings();openWardrobe()}const rating=e.target.closest('[data-rating]');if(rating){api('feedback',{kind:'rating',text:rating.dataset.rating}).then(()=>{document.querySelectorAll('[data-rating]').forEach(b=>b.setAttribute('aria-pressed',String(b===rating)));$('rating-status').textContent='Saved only in this browser.'}).catch(err=>$('rating-status').textContent=err.message)}});
document.addEventListener('change',e=>{if(e.target.matches('[data-setting]')){settings[e.target.dataset.setting]=e.target.checked;write('noillirk:settings',settings);applySettings()}});
document.addEventListener('input',e=>{if(e.target.matches('.search-answers')){const text=e.target.value.toLowerCase();e.target.nextElementSibling.querySelectorAll('li').forEach(li=>li.hidden=!li.dataset.answer.includes(text));}});
document.addEventListener('submit',e=>{if(e.target.id==='suggestion-form'){e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;api('feedback',{kind:'suggestion',text:$('suggestion').value}).then(()=>{$('suggestion-status').textContent='Saved only in this browser.';$('suggestion').value=''}).catch(err=>$('suggestion-status').textContent=err.message).finally(()=>button.disabled=false)}});
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>void resumeGame());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
$('export-history').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(read('noillirk:history',{}),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='open-noillirk-history.json';a.click();URL.revokeObjectURL(url)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('guide').open)closeGuide();if(e.key.toLowerCase()==='f'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)&&!e.ctrlKey&&!e.metaKey){if(document.fullscreenElement)document.exitFullscreen?.();else $('game').requestFullscreen?.().catch(()=>{})}});
function viewport(){const height=window.visualViewport?.height||innerHeight;document.documentElement.style.setProperty('--vh',height+'px')}viewport();window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);
window.render_game_to_text=()=>JSON.stringify({phase,prompt:game?.prompts[game.round]?.text||null,round:game?.round??0,totalRounds:game?.mode==='endless'?null:7,score:Math.round(visualScore),targetScore:currentScore,altitude:Math.round(currentScore*10),targetAltitude:scene.target,camera:Math.round(scene.cameraDepth),effect:scene.fx?.tier||null,seconds:game?Math.max(0,Math.ceil((game.roundStart+ROUND_MS-now())/1000)):null,results:game?.results.map(r=>({answer:r.answer,tier:r.tier,score:r.score}))||[],draft:$('answer').value,correction,mode:game?.mode||selectedMode,paused,sound:{supported:!!(window.AudioContext||window.webkitAudioContext),state:sound.ac?.state||'not-started',muted:sound.muted},coordinates:'origin at top-left, x rightward, y downward; altitude rises as points increase',lowPower:settings.lowPower});
window.advanceTime=async ms=>{if(!runtime.local)return;clockOffset+=Math.max(0,ms);scene.time+=ms/1000;scene.depth=scene.target;scene.active=scene.targetActive;scene.cameraDepth=scene.cameraTarget;scene.cameraJob=null;scene.draw();tick();await new Promise(r=>setTimeout(r,0));};
setInterval(tick,80);
(async()=>{try{today=await api('today');$('day-number').textContent='CLIMB #'+today.dayNumber;$('sample-note').hidden=true;const saved=read('noillirk:run',null);if(saved?.date===today.date&&saved?.runId){try{setGame(await api('state?run='+encodeURIComponent(saved.runId)));if(game.pausedAt)setGame(await api('pause',{runId:game.runId,paused:false}));if(game.completed)await showResults();else if(game.roundStart===null)showLanding(game.results.at(-1));else showRound()}catch{write('noillirk:run',null)}}}catch(e){$('boot-error').textContent=e.message;$('boot-error').hidden=false;}})();
