(()=>{"use strict";
const fallbackTracks=[{"title":"Be A Playa","src":"assets/beats/track-01.mp3"},{"title":"BirdzSing","src":"assets/beats/track-02.mp3"},{"title":"RockWitYa","src":"assets/beats/track-03.mp3"},{"title":"OnThatFR","src":"assets/beats/track-04.mp3"},{"title":"Amtrakk","src":"assets/beats/track-05.mp3"},{"title":"Redy$U","src":"assets/beats/track-06.mp3"},{"title":"EvryThingEyeNeed","src":"assets/beats/track-07.mp3"},{"title":"HarpHeart","src":"assets/beats/track-08.mp3"}];
const audio=document.getElementById('gradea-audio');
const el=id=>document.getElementById(id);
const list=el('gradea-track-list');
const FEATURED_TITLE='Be A Playa'; // Change this to any exact title in beats.json.
let tracks=fallbackTracks,current=0,shuffle=false,repeat=false,history=[],historyCursor=-1;
audio.volume=.8;
const time=n=>Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'0:00';
function trackEvent(name,detail={}){if(typeof window.gtag==='function')window.gtag('event',name,detail)}
function sync(){const playing=!audio.paused;['gradea-main-play','gradea-sticky-play'].forEach(id=>{el(id).textContent=playing?'❚❚':'▶';el(id).setAttribute('aria-label',playing?'Pause':'Play')});list.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('is-active',i===current);b.querySelector('.gradea-track-icon').textContent=i===current&&playing?'❚❚':'▶'});el('gradea-play-status').textContent=playing?'NOW TRANSMITTING':'READY TO PLAY'}
function render(){list.replaceChildren();tracks.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='gradea-track';b.innerHTML=`<span class="gradea-track-index">${String(i+1).padStart(2,'0')}</span><span class="gradea-track-name"></span><span class="gradea-track-icon">▶</span>`;b.querySelector('.gradea-track-name').textContent=t.title;b.addEventListener('click',()=>{if(i===current)toggle();else load(i,true)});list.append(b)});el('gradea-track-count').textContent=`${String(tracks.length).padStart(2,'0')} TRACKS / ORIGINAL PRODUCTION`;sync()}
function load(i,play=false){if(!tracks.length)return;current=(i+tracks.length)%tracks.length;audio.src=tracks[current].src;el('gradea-current-title').textContent=tracks[current].title;el('gradea-sticky-title').textContent=tracks[current].title;el('gradea-current-time').textContent='0:00';el('gradea-duration').textContent='0:00';el('gradea-seek').value=0;el('gradea-sticky-seek').value=0;sync();if(play)audio.play().catch(()=>{})}
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
render();load(0);
fetch('beats.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing beats.json');return r.json()}).then(items=>{if(!Array.isArray(items)||!items.length||!items.every(t=>typeof t.title==='string'&&typeof t.src==='string'))throw Error('Invalid beats.json');tracks=items;render();load(0)}).catch(e=>console.warn('Using built-in playlist:',e));

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
