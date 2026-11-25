'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import {createPortal} from 'react-dom';
import {Ghost,Skeleton} from './HalloweenStage';
import PixelBat from './PixelBat';
const KEY='last-save-haunting';
export default function AppHaunting({busy,exporting,error,decodedCount,selected,tab,dialogOpen}){
 const [dockHost,setDockHost]=useState(null);
 const [calm,setCalm]=useState(false),[ready,setReady]=useState(false),[reduced,setReduced]=useState(false),[bursts,setBursts]=useState([]),[sparks,setSparks]=useState([]),[message,setMessage]=useState('I guard the files. You disturb the dead.'),[talk,setTalk]=useState(0);
 const layer=useRef(null),timers=useRef(new Set()),serial=useRef(0),previous=useRef(null),pointerTime=useRef(0);
 const later=useCallback((fn,ms)=>{const id=setTimeout(()=>{timers.current.delete(id);fn()},ms);timers.current.add(id);return id},[]);
 const summon=useCallback((kind='summon',count=5)=>{
  const id=++serial.current;
  const flights=kind==='bats'?Array.from({length:count},(_,i)=>({
   direction:i%2===0?'right':'left',
   delay:i*2.6+Math.random()*1.2,
   duration:6.5+Math.random()*3.5,
   top:8+i*12+Math.random()*8,
   scale:1.05+Math.random()*.5,
   wing:.3+Math.random()*.2,
   phase:-Math.random()*.4,
   rise:-45-Math.random()*70,
   dip:20+Math.random()*70,
   finish:-35+Math.random()*70
  })):null;
  const spirits=kind!=='bats'?Array.from({length:count},(_,i)=>{
   if(kind==='artifact'){
    const baseRights=[36+Math.random()*15,125+Math.random()*25,215+Math.random()*30];
    const baseMobileRights=[12+Math.random()*10,55+Math.random()*15,100+Math.random()*20];
    const drift=-25-Math.random()*15;
    return{
     right:`${baseRights[i%baseRights.length]}px`,
     rightMobile:`${baseMobileRights[i%baseMobileRights.length]}px`,
     delay:i*0.07+Math.random()*0.03,
     duration:3.6+Math.random()*0.25,
     drift,
     top:-82-Math.random()*8,
     scale:0.9+Math.random()*0.18,
     rot0:-10+Math.random()*5,
     rot2:8+Math.random()*5,
     size:28+Math.random()*6
    };
   }
   const isSummon=kind==='summon';
   const drift=isSummon?(Math.random()*50-25):(-20-Math.random()*20);
   return{
    right:isSummon?undefined:`${24+i*65+Math.random()*25}px`,
    rightMobile:isSummon?undefined:`${10+i*30+Math.random()*15}px`,
    left:isSummon?`${6+i*11+Math.random()*4}%`:undefined,
    delay:i*0.08+Math.random()*0.04,
    duration:3.7+Math.random()*0.3,
    drift,
    top:-84-Math.random()*8,
    scale:0.88+Math.random()*0.22,
    rot0:-12+Math.random()*6,
    rot2:10+Math.random()*6,
    size:30+Math.random()*10
   };
  }):null;
  setBursts(all=>[...all.slice(-2),{id,kind,count,flights,spirits}]);
  const maxTime=flights?Math.max(...flights.map(f=>f.delay+f.duration)):spirits?Math.max(...spirits.map(s=>s.delay+s.duration)):4.8;
  const lifetime=maxTime*1000+350;
  later(()=>setBursts(all=>all.filter(b=>b.id!==id)),lifetime)
 },[later]);
 useEffect(()=>{const layout=matchMedia('(max-width:850px)');const sync=()=>setDockHost(document.querySelector(layout.matches?'.mobile-haunt-slot':'.haunt-dock-slot'));sync();layout.addEventListener('change',sync);return()=>layout.removeEventListener('change',sync)},[]);
 useEffect(()=>{try{setCalm(localStorage.getItem(KEY)==='calm')}catch{}const media=matchMedia('(prefers-reduced-motion: reduce)');setReduced(media.matches);const change=()=>setReduced(media.matches);media.addEventListener('change',change);setReady(true);return()=>{media.removeEventListener('change',change);for(const id of timers.current)clearTimeout(id);timers.current.clear()}},[]);
 useEffect(()=>{if(!ready)return;document.documentElement.dataset.haunting=calm?'calm':'full';return()=>delete document.documentElement.dataset.haunting},[calm,ready]);
 useEffect(()=>{
  const next={busy,exporting,error,decodedCount,selected,tab,dialogOpen},last=previous.current;previous.current=next;if(!last||!ready)return;
  if(error&&error!==last.error){setMessage('That file resisted. Read the error; I’ll keep watch.');if(!calm&&!reduced)summon('error',2)}
  else if(decodedCount>last.decodedCount){setMessage('Another file back among the living. Splendidly unnatural.');if(!calm&&!reduced)summon('recovered',4)}
  else if(exporting&&!last.exporting){setMessage('Packing the remains. Originals come with you.');if(!calm&&!reduced)summon('export',6)}
  else if(busy&&!last.busy)setMessage('Quiet. The archive is speaking in bytes.');
  else if(dialogOpen&&!last.dialogOpen){setMessage('The field guide opens. Mind the cobwebs.');if(!calm&&!reduced)summon('pages',2)}
  else if(selected&&selected!==last.selected){setMessage('A different artifact. A different unfinished story.');if(!calm&&!reduced)summon('artifact',2)}
  else if(tab!==last.tab)setMessage(tab==='bytes'?'The bones of a file. Every byte has a place.':tab==='report'?'Evidence first. Even ghosts need receipts.':'Back to the apparition. Those are the actual file pixels.');
 },[busy,exporting,error,decodedCount,selected,tab,dialogOpen,ready,calm,reduced,summon]);
 useEffect(()=>{if(!ready||calm||reduced)return;const interval=setInterval(()=>summon('bats',3),24000);return()=>clearInterval(interval)},[ready,calm,reduced,summon]);
 useEffect(()=>{
  if(!ready||calm||reduced)return;
  const move=e=>{if(e.pointerType==='touch'||Date.now()-pointerTime.current<130||e.target.closest('.viewer-surface,input,textarea,select,.field-notes'))return;pointerTime.current=Date.now();const id=++serial.current;setSparks(all=>[...all.slice(-8),{id,x:e.clientX,y:e.clientY}]);later(()=>setSparks(all=>all.filter(s=>s.id!==id)),950)};
  const click=e=>{if(layer.current?.contains(e.target)||e.target.closest('.skeleton-crew-dock')||!e.target.closest('button,[role=tab]'))return;const id=++serial.current;setSparks(all=>[...all.slice(-8),{id,x:e.clientX,y:e.clientY,rune:true}]);later(()=>setSparks(all=>all.filter(s=>s.id!==id)),950)};
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerdown',click,{passive:true});return()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',click)};
 },[ready,calm,reduced,later]);
 function toggle(){setCalm(v=>{try{localStorage.setItem(KEY,v?'full':'calm')}catch{}return !v});setBursts([]);setSparks([])}
 function speak(){const lines=['No cloud. No séance server. Just you and these restless files.','I used to work in tech support. Then I became the skeleton crew.','Never overwrite the evidence. That’s how you anger the archivist.','Your files aren’t haunted. I am. Important distinction.'];setMessage(lines[talk%lines.length]);setTalk(n=>n+1);summon('summon',5)}
 return <div ref={layer} className={'app-haunting '+(calm?'is-calm ':'')+(busy||exporting?'is-working ':'')+(reduced?'reduced-haunting':'')} data-testid="app-haunting">
 {!calm&&!reduced&&<><div className="corridor-fog fog-left" aria-hidden="true"/><div className="corridor-fog fog-right" aria-hidden="true"/><div className="haunt-ceiling" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div></>}
 {!calm&&!reduced&&<div className="apparition-layer" aria-hidden="true">{bursts.map(b=><div key={b.id} className={'apparition-burst burst-'+b.kind} data-haunt-event={b.kind}>{Array.from({length:b.count},(_,i)=>b.kind==='bats'?<span key={i} className={"flying-pixel-bat flies-"+b.flights[i].direction} style={{"--flight-top":b.flights[i].top+"%","--flight-delay":b.flights[i].delay+"s","--flight-time":b.flights[i].duration+"s","--bat-scale":b.flights[i].scale,"--wing-speed":b.flights[i].wing+"s","--wing-phase":b.flights[i].phase+"s","--rise":b.flights[i].rise+"px","--dip":b.flights[i].dip+"px","--finish":b.flights[i].finish+"px"}}><PixelBat/></span>:<Ghost key={i} style={b.spirits?{'--i':i,'--ghost-right':b.spirits[i]?.right,'--ghost-right-mobile':b.spirits[i]?.rightMobile,'--ghost-left':b.spirits[i]?.left,'--delay':b.spirits[i]?.delay+'s','--duration':b.spirits[i]?.duration+'s','--ghost-drift':b.spirits[i]?.drift+'px','--ghost-top':b.spirits[i]?.top+'vh','--ghost-scale':b.spirits[i]?.scale,'--ghost-rot0':b.spirits[i]?.rot0+'deg','--ghost-rot2':b.spirits[i]?.rot2+'deg','--size':b.spirits[i]?.size+'px'}:{'--i':i}}/>)}</div>)}</div>}
 {!calm&&!reduced&&<div className="haunt-sparks" aria-hidden="true">{sparks.map(s=><span key={s.id} className={s.rune?'click-rune':'cursor-ember'} style={{left:s.x,top:s.y}}>{s.rune?'✧':'✦'}</span>)}</div>}
 {dockHost&&createPortal(<div className={'skeleton-crew-dock '+(dialogOpen?'dock-hidden ':'')+(busy||exporting?'dock-working ':'')+(calm?'dock-calm':'')}>
 <div className="crew-speech" key={message}>{message}</div>
 <div className="crew-dock-controls"><button className="archive-keeper" onClick={speak} aria-label="Talk to the skeleton archivist"><Skeleton/><span>THE SKELETON CREW<small>{busy||exporting?'LISTENING TO THE DEAD…':'CLICK TO DISTURB'}</small></span></button><button className="haunt-toggle" onClick={toggle} aria-pressed={!calm} aria-label={calm?'Enable full haunting':'Calm the haunting'}>{calm?'HAUNT: CALM':'HAUNT: FULL'}</button></div>
 <button className="unleash-button" onClick={()=>{summon('summon',8);setMessage(reduced?'The crew is here. Reduced motion keeps them still.':calm?'The crew heard you. Enable full haunting for apparitions.':'You rang? The whole graveyard answers.')}}>SUMMON THE ARCHIVE <span aria-hidden="true">↗</span></button>
 </div>,dockHost)}
 </div>
}
