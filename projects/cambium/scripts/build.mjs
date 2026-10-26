import { spawnSync } from 'node:child_process';
import { writeFileSync,renameSync,readFileSync,mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
// A fresh output directory avoids Windows ACL/cache collisions on repeated builds.
// The last successful build remains runnable if the next build fails.
const dir='.cambium-build/build-'+randomUUID().slice(0,8);
for(const suffix of ['server/app/_global-error.segments/_global-error','server/app/_not-found.segments/_not-found','server/app/_not-found','server/app/_global-error','static/chunks/next/dist/client','server/app/api/[...path]'])mkdirSync(dir+'/'+suffix,{recursive:true});
const tsconfig=JSON.parse(readFileSync('tsconfig.json','utf8'));
tsconfig.include=tsconfig.include.filter(s=>!s.startsWith('.next/')&&!s.startsWith('.cambium-build/')&&!s.startsWith('.cambium-dev/'));
writeFileSync('tsconfig.json',JSON.stringify(tsconfig,null,2));
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,CAMBIUM_BUILD_DIR:dir,UV_THREADPOOL_SIZE:'1'}});
if(result.status!==0)process.exit(result.status||1);
writeFileSync('.build-dir.tmp',dir);renameSync('.build-dir.tmp','.build-dir');
