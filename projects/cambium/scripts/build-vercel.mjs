import {spawnSync} from 'node:child_process';
import {vercelRuntime} from './vercel-config.mjs';
let env;try{env=vercelRuntime();}catch(error){console.error(error.message);process.exit(1);}
for(const args of [['scripts/generate-client.mjs'],['node_modules/prisma/build/index.js','migrate','deploy','--schema','prisma/postgres/schema.prisma'],['scripts/build.mjs']]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env});if(result.status!==0)process.exit(result.status??1);
}
