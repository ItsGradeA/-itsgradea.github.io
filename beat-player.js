(()=>{"use strict";
let tracks=[];
const audio=document.getElementById('gradea-audio');
const el=id=>document.getElementById(id);
const list=el('gradea-track-list');
let current=0;
audio.volume=.8;
const time=n=>{if(!Number.isFinite(n))return '0:00';const s=Math.floor(n);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
function renderTracks(){list.replaceChildren();tracks.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='gradea-track';b.innerHTML=`<span class="gradea-track-index">${String(i+1).padStart(2,'0')}</span><span class="gradea-track-name"></span><span class="gradea-track-icon">▶</span>`;b.querySelector('.gradea-track-name').textContent=t.title;b.addEventListener('click',()=>{if(i===current){toggle()}else{load(i,true)}});list.append(b)});}
function sync(){const playing=!audio.paused;el('gradea-main-play').textContent=playing?'❚❚':'▶';el('gradea-sticky-play').textContent=playing?'❚❚':'▶';el('gradea-main-play').setAttribute('aria-label',playing?'Pause':'Play');el('gradea-sticky-play').setAttribute('aria-label',playing?'Pause':'Play');list.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('is-active',i===current);b.querySelector('.gradea-track-icon').textContent=i===current&&playing?'❚❚':'▶'})}
function load(i,play=false){current=(i+tracks.length)%tracks.length;audio.src=tracks[current].src;el('gradea-current-title').textContent=tracks[current].title;el('gradea-sticky-title').textContent=tracks[current].title;el('gradea-current-time').textContent='0:00';el('gradea-duration').textContent='0:00';el('gradea-seek').value=0;el('gradea-sticky-seek').value=0;sync();if(play)audio.play().catch(()=>{});}
function toggle(){if(audio.paused)audio.play().catch(()=>{});else audio.pause()}
function move(n){load(current+n,true)}
['gradea-main-play','gradea-sticky-play'].forEach(id=>el(id).addEventListener('click',toggle));
['gradea-prev','gradea-sticky-prev'].forEach(id=>el(id).addEventListener('click',()=>move(-1)));
['gradea-next','gradea-sticky-next'].forEach(id=>el(id).addEventListener('click',()=>move(1)));
audio.addEventListener('play',sync);audio.addEventListener('pause',sync);audio.addEventListener('ended',()=>move(1));
audio.addEventListener('loadedmetadata',()=>{el('gradea-duration').textContent=time(audio.duration)});
audio.addEventListener('timeupdate',()=>{el('gradea-current-time').textContent=time(audio.currentTime);if(Number.isFinite(audio.duration)&&audio.duration>0){const v=Math.round(1000*audio.currentTime/audio.duration);el('gradea-seek').value=v;el('gradea-sticky-seek').value=v}});
['gradea-seek','gradea-sticky-seek'].forEach(id=>el(id).addEventListener('input',e=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(e.target.value)/1000}));
el('gradea-volume').addEventListener('input',e=>audio.volume=Number(e.target.value)/100);
async function init(){
  try{
    const response=await fetch('beats.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Could not load beat catalog');
    const data=await response.json();
    if(!Array.isArray(data)||!data.length||!data.every(t=>typeof t.title==='string'&&typeof t.src==='string'))throw new Error('Invalid beat catalog');
    tracks=data;
    renderTracks();
    load(0);
    audio.addEventListener('error',()=>{el('gradea-current-title').textContent='Audio unavailable — check file path';});
  }catch(err){
    list.textContent='Beat catalog unavailable. Please refresh or try again later.';
    console.error('GradeA beat catalog:',err);
  }
}
init();
})();
