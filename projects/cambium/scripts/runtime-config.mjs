import {isAbsolute,resolve,relative,join,sep} from 'node:path';
/** @param {Record<string, string | undefined>} env */
export function railwayRuntime(env=process.env){
 const volume=env.RAILWAY_VOLUME_MOUNT_PATH;
 if(!volume||!isAbsolute(volume))throw new Error('Attach a Railway volume at /data before starting.');
 if(!env.APP_ACCESS_PASSWORD||env.APP_ACCESS_PASSWORD.length<16)throw new Error('APP_ACCESS_PASSWORD must contain at least 16 characters.');
 const origin=env.APP_BASE_URL||(env.RAILWAY_PUBLIC_DOMAIN?'https://'+env.RAILWAY_PUBLIC_DOMAIN:'');
 const parsed=new URL(origin);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)throw new Error('APP_BASE_URL must be an HTTPS origin.');
 const database=env.DATABASE_URL||'file:'+join(volume,'cambium.db');
 if(!database.startsWith('file:')||!isAbsolute(database.slice(5)))throw new Error('Use an absolute SQLite DATABASE_URL on the volume.');
 const location=relative(resolve(volume),resolve(database.slice(5)));if(location==='..'||location.startsWith('..'+sep)||isAbsolute(location))throw new Error('SQLite must be stored inside the attached volume.');
 const port=env.PORT||'3000';if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw new Error('Invalid PORT.');
 return {...env,DATABASE_URL:database,APP_BASE_URL:parsed.origin,PORT:port};
}
