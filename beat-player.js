(()=>{"use strict";
const tracks=[{"title": "Be A Playa", "src": "assets/beats/track-01.mp3"}, {"title": "BirdzSing", "src": "assets/beats/track-02.mp3"}, {"title": "RockWitYa", "src": "assets/beats/track-03.mp3"}, {"title": "OnThatFR", "src": "assets/beats/track-04.mp3"}, {"title": "Amtrakk", "src": "assets/beats/track-05.mp3"}, {"title": "Redy$U", "src": "assets/beats/track-06.mp3"}, {"title": "EvryThingEyeNeed", "src": "assets/beats/track-07.mp3"}, {"title": "HarpHeart", "src": "assets/beats/track-08.mp3"}];
const audio=document.getElementById('gradea-audio');
const el=id=>document.getElementById(id);
const list=el('gradea-track-list');
let current=0;
audio.volume=.8;
const time=n=>{if(!Number.isFinite(n))return '0:00';const s=Math.floor(n);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
tracks.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='gradea-track';b.innerHTML=`<span class="gradea-track-index">${String(i+1).padStart(2,'0')}</span><span class="gradea-track-name"></span><span class="gradea-track-icon">▶</span>`;b.querySelector('.gradea-track-name').textContent=t.title;b.addEventListener('click',()=>{if(i===current){toggle()}else{load(i,true)}});list.append(b)});
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
load(0);

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
  function draw(){
    const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);
    const mid=h/2;
    ctx.lineWidth=Math.max(1.5,w/420);
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle='#a97aff';
    ctx.shadowColor='rgba(169,122,255,.7)';ctx.shadowBlur=11;
    ctx.beginPath();
    if(analyser&&data&&!audio.paused&&!reducedMotion.matches){
      analyser.getByteTimeDomainData(data);
      for(let x=0;x<w;x++){
        const i=Math.min(data.length-1,Math.floor(x*data.length/w));
        const y=mid+(data[i]-128)/128*h*.43;
        if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
    }else{ctx.moveTo(0,mid);ctx.lineTo(w,mid)}
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
        analyser.fftSize=2048;analyser.smoothingTimeConstant=.8;
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
