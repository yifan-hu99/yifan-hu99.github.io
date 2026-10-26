'use client';
import {useEffect} from 'react';
/** Replace stale local UI after a deployment, only when no editing or search is in progress. */
export function useAppVersion(ready:boolean,canReload:boolean){
 useEffect(()=>{
  const current=process.env.NEXT_PUBLIC_CAMBIUM_VERSION;
  if(!ready||!canReload||!current||current==='.cambium-dev')return;
  let active=true,pending=false;const controller=new AbortController();
  const check=async()=>{if(!active||pending||document.visibilityState!=='visible')return;pending=true;
   try{const r=await fetch('/api/app-version',{cache:'no-store',signal:controller.signal});if(!r.ok)return;const data=await r.json();if(active&&typeof data.version==='string'&&data.version!==current)window.location.reload();}catch{}finally{pending=false;}
  };
  const focus=()=>{void check();};void check();const timer=setInterval(focus,15000);
  window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[ready,canReload]);
}
