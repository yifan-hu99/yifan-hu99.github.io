import {existsSync} from 'node:fs';
import {spawnSync,spawn} from 'node:child_process';
import {railwayRuntime} from './runtime-config.mjs';
if(existsSync('.env'))process.loadEnvFile('.env');
let env;try{env=railwayRuntime();}catch(error){console.error(error.message);process.exit(1);}
for(const args of [['scripts/init-db.mjs'],['node_modules/prisma/build/index.js','migrate','deploy']]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env});if(result.status!==0)process.exit(result.status||1);
}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0','--port',env.PORT],{stdio:'inherit',env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.kill(signal));
server.on('error',()=>{console.error('Unable to start application.');process.exit(1);});server.on('exit',code=>process.exit(code??1));
