import {createHash,randomBytes} from 'node:crypto';
export const visitorCookie='cambium_visitor';
export function newVisitor(){return randomBytes(32).toString('hex');}
export function visitorOwner(value:string|undefined){return value&&/^[a-f0-9]{64}$/.test(value)?'visitor_'+createHash('sha256').update(value).digest('hex'):null;}
