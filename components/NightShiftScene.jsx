'use client';
import {useState,useRef,useEffect} from 'react';
import {Pumpkin,Skeleton,Ghost} from './HalloweenStage';
import PixelBat from './PixelBat';
export default function NightShiftScene(){const [awake,setAwake]=useState(false),[lit,setLit]=useState(true),[message,setMessage]=useState('The pumpkins are lit. The graveyard shift is in.');const timer=useRef(null);useEffect(()=>()=>clearTimeout(timer.current),[]);
function wake(){setAwake(true);setMessage('Bat fed. Your files are strictly off the menu.');clearTimeout(timer.current);timer.current=setTimeout(()=>{setAwake(false);setMessage('It’s keeping an eye on the archive. Both of them.')},4300)}
return <section className={'night-shift-scene '+(lit?'lanterns-lit ':'lanterns-dark ')+(awake?'bat-awake':'')} aria-label="Halloween night shift"><div className="night-scene-web" aria-hidden="true"/><button className="night-pumpkins" aria-label="Toggle workspace pumpkin lanterns" aria-pressed={lit} onClick={()=>{setLit(v=>!v);setMessage(lit?'Lights out. The pumpkins are plotting.':'Jack-o’-lanterns on. Welcome to the night shift.')}}><Pumpkin/><Pumpkin/></button><div className="night-scene-copy"><span>HALLOWEEN / THE GRAVEYARD SHIFT</span><strong>The archive is <em>alive.</em></strong><small role="status">{message}</small></div><button className="pixel-bat-button" aria-label="Wake the pixel bat" aria-pressed={awake} onClick={wake}><PixelBat/><span>FEED THE BAT ↗</span></button><Skeleton className="night-scene-skeleton"/><Ghost className="night-scene-ghost"/></section>
}
