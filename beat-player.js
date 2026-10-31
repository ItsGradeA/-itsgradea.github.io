(()=>{"use strict";
const fallbackTracks=[{"title":"Be A Playa","src":"assets/beats/track-01.mp3"},{"title":"BirdzSing","src":"assets/beats/track-02.mp3"},{"title":"RockWitYa","src":"assets/beats/track-03.mp3"},{"title":"OnThatFR","src":"assets/beats/track-04.mp3"},{"title":"Amtrakk","src":"assets/beats/track-05.mp3"},{"title":"Redy$U","src":"assets/beats/track-06.mp3"},{"title":"EvryThingEyeNeed","src":"assets/beats/track-07.mp3"},{"title":"HarpHeart","src":"assets/beats/track-08.mp3"}];
const audio=document.getElementById('gradea-audio');
const el=id=>document.getElementById(id);
const list=el('gradea-track-list');
const FEATURED_TITLE='Be A Playa'; // Change this to any exact title in beats.json.
let tracks=fallbackTracks,current=0,shuffle=false,repeat=false,history=[],historyCursor=-1,activeFilter='all';
const FAV_KEY='gradea-favorite-beats-v1';
let favorites=[];
try{const stored=JSON.parse(localStorage.getItem(FAV_KEY)||'[]');if(Array.isArray(stored))favorites=stored.filter(v=>typeof v==='string')}catch(e){}
const key=t=>t.title.trim().toLocaleLowerCase();
const isFavorite=t=>favorites.includes(key(t));
function saveFavorites(){try{localStorage.setItem(FAV_KEY,JSON.stringify(favorites))}catch(e){}}
function newIndices(){return new Set(tracks.slice(-Math.min(3,tracks.length)).map(key))}
function updateFavoritesInquiry(){const selected=tracks.filter(isFavorite);el('gradea-fav-count').textContent=selected.length;const a=el('gradea-favorites-inquire');a.hidden=!selected.length;if(!selected.length)return;const body=`What's good GradeA,\n\nI'm interested in these beats from THE FREQUENCY:\n\n${selected.map(t=>'• '+t.title).join('\n')}\n\nName:\nProject / intended use:\n`;a.href=`mailto:beats@itsgradea.com?subject=${encodeURIComponent('Beat Inquiry — Favorites | GradeA')}&body=${encodeURIComponent(body)}`}
function toggleFavorite(t){const k=key(t);favorites=isFavorite(t)?favorites.filter(v=>v!==k):[...favorites,k];saveFavorites();render();trackEvent('beat_favorite',{beat_title:t.title,is_favorite:isFavorite(t)})}
function setFilter(filter){activeFilter=filter;document.querySelectorAll('.gradea-filter').forEach(b=>{const selected=b.dataset.filter===filter;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',String(selected))});render();trackEvent('beat_filter',{filter})}
document.querySelectorAll('.gradea-filter').forEach(b=>b.addEventListener('click',()=>setFilter(b.dataset.filter)));
el('gradea-favorites-inquire').addEventListener('click',()=>trackEvent('favorites_inquiry',{beat_count:tracks.filter(isFavorite).length}));
const requestedBeat=new URLSearchParams(window.location.search).get('beat');
audio.volume=.8;
const time=n=>Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'0:00';
function trackEvent(name,detail={}){if(typeof window.gtag==='function')window.gtag('event',name,detail)}
function sync(){const playing=!audio.paused;['gradea-main-play','gradea-sticky-play'].forEach(id=>{el(id).textContent=playing?'❚❚':'▶';el(id).setAttribute('aria-label',playing?'Pause':'Play')});list.querySelectorAll('.gradea-track').forEach(row=>{const i=Number(row.dataset.index);row.classList.toggle('is-active',i===current);row.querySelector('.gradea-track-icon').textContent=i===current&&playing?'❚❚':'▶'});el('gradea-play-status').textContent=playing?'NOW TRANSMITTING':'READY TO PLAY'}
function shareURL(title){const url=new URL(window.location.origin+window.location.pathname);url.searchParams.set('beat',title);url.hash='beat-player';return url.toString()}
async function shareTrack(title,button){const url=shareURL(title);try{
  if(navigator.share){await navigator.share({title:`${title} — GradeA`,text:`Listen to ${title} on THE FREQUENCY`,url});trackEvent('beat_share',{beat_title:title,method:'native'});return}
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url)}
  else{const input=document.createElement('textarea');input.value=url;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();if(!document.execCommand('copy'))throw Error('Copy unavailable');input.remove()}
  const old=button.textContent;button.textContent='✓ COPIED';button.setAttribute('aria-label',`Link copied for ${title}`);setTimeout(()=>{button.textContent=old;button.setAttribute('aria-label',`Share ${title}`)},2200);
  trackEvent('beat_share',{beat_title:title,method:'copy'});
}catch(e){if(e.name!=='AbortError')window.prompt('Copy this beat link:',url)} }
function render(){list.replaceChildren();const latest=newIndices();let visible=0;tracks.forEach((t,i)=>{if(activeFilter==='favorites'&&!isFavorite(t))return;if(activeFilter==='new'&&!latest.has(key(t)))return;visible++;
 const row=document.createElement('div');row.className='gradea-track';row.dataset.index=String(i);
 const play=document.createElement('button');play.type='button';play.className='gradea-track-play';play.innerHTML=`<span class="gradea-track-index">${String(i+1).padStart(2,'0')}</span><span class="gradea-track-name"></span><span class="gradea-track-icon">▶</span>`;
 play.querySelector('.gradea-track-name').textContent=t.title;if(latest.has(key(t))){const badge=document.createElement('span');badge.className='gradea-new-badge';badge.textContent='NEW';play.querySelector('.gradea-track-name').append(badge)}play.setAttribute('aria-label',`Play ${t.title}`);
 play.addEventListener('click',()=>{if(i===current)toggle();else load(i,true)});
 const share=document.createElement('button');share.type='button';share.className='gradea-share';share.textContent='↗ SHARE';share.setAttribute('aria-label',`Share ${t.title}`);share.addEventListener('click',()=>shareTrack(t.title,share));
 const fav=document.createElement('button');fav.type='button';fav.className='gradea-fav'+(isFavorite(t)?' is-favorite':'');fav.textContent=isFavorite(t)?'♥':'♡';fav.setAttribute('aria-label',`${isFavorite(t)?'Remove':'Add'} ${t.title} ${isFavorite(t)?'from':'to'} favorites`);fav.setAttribute('aria-pressed',String(isFavorite(t)));fav.addEventListener('click',()=>toggleFavorite(t));row.append(play,fav,share);list.append(row)
 });el('gradea-filter-empty').hidden=visible!==0;el('gradea-filter-empty').textContent=activeFilter==='favorites'?'No favorites yet. Tap ♡ beside any beat to save it.':'No beats found in this category.';updateFavoritesInquiry();el('gradea-track-count').textContent=`${String(tracks.length).padStart(2,'0')} TRACKS / ORIGINAL PRODUCTION`;sync()}
function applySharedBeat(){if(!requestedBeat)return;const index=tracks.findIndex(t=>t.title.toLocaleLowerCase()===requestedBeat.toLocaleLowerCase());if(index>=0){load(index,false);el('gradea-play-status').textContent='SHARED BEAT · PRESS PLAY';}else console.warn('Shared beat not found:',requestedBeat)}
function updateInquiry(){const title=tracks[current].title;const subject=`Beat Inquiry — ${title} | GradeA`;const body=`What's good GradeA,\n\nI'm interested in the beat \"${title}\" that I heard on your website. I'd like to discuss working with you.\n\nName:\nProject / intended use:\n`;const link=el('gradea-beat-inquire');link.href=`mailto:beats@itsgradea.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;el('gradea-inquiry-title').textContent=title}
el('gradea-beat-inquire').addEventListener('click',()=>trackEvent('beat_inquiry',{beat_title:tracks[current].title}));
function load(i,play=false){if(!tracks.length)return;current=(i+tracks.length)%tracks.length;updateInquiry();audio.src=tracks[current].src;el('gradea-current-title').textContent=tracks[current].title;el('gradea-sticky-title').textContent=tracks[current].title;el('gradea-current-time').textContent='0:00';el('gradea-duration').textContent='0:00';el('gradea-seek').value=0;el('gradea-sticky-seek').value=0;sync();if(play)audio.play().catch(()=>{})}
function toggle(){if(audio.paused)audio.play().catch(()=>{});else audio.pause()}
function nextIndex(){if(!shuffle||tracks.length<2)return (current+1)%tracks.length;let i=current;while(i===current)i=Math.floor(Math.random()*tracks.length);return i}
function move(n){if(n<0){if(shuffle&&historyCursor>0){historyCursor--;load(history[historyCursor],true)}else load((current-1+tracks.length)%tracks.length,true)}else{const i=nextIndex();if(shuffle){history=history.slice(0,historyCursor+1);history.push(i);historyCursor=history.length-1}load(i,true)}}
['gradea-main-play','gradea-sticky-play'].forEach(id=>el(id).addEventListener('click',toggle));
['gradea-prev','gradea-sticky-prev'].forEach(id=>el(id).addEventListener('click',()=>move(-1)));
['gradea-next','gradea-sticky-next'].forEach(id=>el(id).addEventListener('click',()=>move(1)));
el('gradea-shuffle').addEventListener('click',()=>{shuffle=!shuffle;el('gradea-shuffle').setAttribute('aria-pressed',String(shuffle));el('gradea-shuffle').textContent=shuffle?'⇄ SHUFFLE ON':'⇄ SHUFFLE OFF';history=[current];historyCursor=0});
el('gradea-repeat').addEventListener('click',()=>{repeat=!repeat;el('gradea-repeat').setAttribute('aria-pressed',String(repeat));el('gradea-repeat').textContent=repeat?'↻ REPEAT ON':'↻ REPEAT OFF'});
el('gradea-feature-play').addEventListener('click',()=>{const i=tracks.findIndex(t=>t.title.toLowerCase()===FEATURED_TITLE.toLowerCase());load(i<0?0:i,true)});
audio.addEventListener('play',()=>{sync();trackEvent('beat_play',{beat_title:tracks[current].title})});audio.addEventListener('pause',sync);
audio.addEventListener('ended',()=>{trackEvent('beat_complete',{beat_title:tracks[current].title});if(repeat){audio.currentTime=0;audio.play().catch(()=>{})}else move(1)});
audio.addEventListener('loadedmetadata',()=>{el('gradea-duration').textContent=time(audio.duration)});
audio.addEventListener('timeupdate',()=>{el('gradea-current-time').textContent=time(audio.currentTime);if(Number.isFinite(audio.duration)&&audio.duration>0){const v=Math.round(1000*audio.currentTime/audio.duration);el('gradea-seek').value=v;el('gradea-sticky-seek').value=v}});
['gradea-seek','gradea-sticky-seek'].forEach(id=>el(id).addEventListener('input',e=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(e.target.value)/1000}));
el('gradea-volume').addEventListener('input',e=>audio.volume=Number(e.target.value)/100);
document.querySelectorAll('a[href^="mailto:"]').forEach(a=>a.addEventListener('click',()=>trackEvent('contact_click',{contact_type:a.textContent.trim()})));
document.querySelectorAll('a[href*="spotify.com"],a[href*="music.apple.com"]').forEach(a=>a.addEventListener('click',()=>trackEvent('streaming_click',{destination:a.href})));
render();load(0);applySharedBeat();
fetch('beats.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing beats.json');return r.json()}).then(items=>{if(!Array.isArray(items)||!items.length||!items.every(t=>typeof t.title==='string'&&typeof t.src==='string'))throw Error('Invalid beats.json');tracks=items;render();load(0);applySharedBeat()}).catch(e=>console.warn('Using built-in playlist:',e));

// Real-time oscilloscope waveform: one audio source shared across all tracks.
(function setupWaveform(){
  const canvas=el('gradea-waveform-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  let ac,analyser,data,started=false;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){
    const box=canvas.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(box.width*ratio));
    canvas.height=Math.max(1,Math.round(box.height*ratio));
  }
  let displayedGain=1;
  function draw(){
    const w=canvas.width,h=canvas.height,mid=h/2;
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth=Math.max(2,w/380);
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle='#b78aff';
    ctx.shadowColor='rgba(169,122,255,.85)';ctx.shadowBlur=16;
    ctx.beginPath();
    if(analyser&&data&&!audio.paused&&!reducedMotion.matches){
      analyser.getByteTimeDomainData(data);
      // Automatically boost quiet tracks while preserving the real waveform.
      let sum=0;
      for(let i=0;i<data.length;i++){
        const sample=(data[i]-128)/128;
        sum+=sample*sample;
      }
      const rms=Math.sqrt(sum/data.length);
      const targetGain=Math.min(5.5,Math.max(1.35,.30/Math.max(rms,.018)));
      displayedGain+=(targetGain-displayedGain)*.14;
      // Use the entire sampled waveform across the available width.
      for(let x=0;x<w;x++){
        const i=Math.min(data.length-1,Math.floor(x*data.length/w));
        const sample=(data[i]-128)/128;
        const y=mid+Math.max(-.94,Math.min(.94,sample*displayedGain))*h*.46;
        if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
    }else{
      displayedGain=1;
      ctx.moveTo(0,mid);ctx.lineTo(w,mid);
    }
    ctx.stroke();ctx.shadowBlur=0;
    requestAnimationFrame(draw);
  }
  function initAudio(){
    if(!AudioContextClass)return;
    try{
      if(!started){
        ac=new AudioContextClass();
        const source=ac.createMediaElementSource(audio);
        analyser=ac.createAnalyser();
        analyser.fftSize=2048;analyser.smoothingTimeConstant=.25;
        data=new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);analyser.connect(ac.destination);
        started=true;
      }
      if(ac.state==='suspended')ac.resume().catch(()=>{});
    }catch(e){console.warn('Visualizer unavailable:',e)}
  }
  // Initialize on a user interaction, including track selection or sticky controls.
  document.addEventListener('pointerdown',e=>{
    if(e.target.closest('.gradea-player-section, .gradea-sticky'))initAudio();
  },{passive:true});
  audio.addEventListener('play',initAudio);
  window.addEventListener('resize',resize);
  resize();draw();
})();
})();
