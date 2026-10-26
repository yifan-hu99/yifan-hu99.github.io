'use client';
import { useEffect,useRef } from 'react';
import { FileText,ArrowUpRight,X,ShieldCheck } from 'lucide-react';
export default function ProfileGate({open,onClose,onUpload,onProfile}:{open:boolean;onClose:()=>void;onUpload:()=>void;onProfile:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=ref.current;if(!d)return;if(open&&!d.open)d.showModal();if(!open&&d.open)d.close();},[open]);
 return <dialog ref={ref} className="profile-gate" aria-label="Complete your profile before a new chat" onCancel={e=>{e.preventDefault();onClose();}}>
  <button className="icon-button modal-close" aria-label="Close profile reminder" onClick={onClose}><X size={20}/></button>
  <FileText className="gate-icon" size={29}/>
  <h2>Complete your profile</h2><p>Add a resume or portfolio and confirm your skills to start a new chat.</p>
  <button className="button primary" onClick={onUpload}><FileText size={16}/>Upload resume and confirm profile<ArrowUpRight size={15}/></button>
  <button className="button" onClick={onProfile}>Add portfolio / complete profile</button>
  <p className="gate-privacy"><ShieldCheck size={14}/>Your resume stays local.</p>
  <button className="text-button gate-continue" onClick={onClose}>Continue this chat and explore results</button>
 </dialog>;
}
