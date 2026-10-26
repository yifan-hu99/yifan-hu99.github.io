import { Worker } from 'node:worker_threads';
const workerCode = `
const {parentPort,workerData}=require('node:worker_threads');
(async()=>{
 try {
  const pdf=require(require.resolve('pdf-parse',{paths:[workerData.root]}));
  const result=await pdf(Uint8Array.from(workerData.bytes),{version:'v2.0.550'});
  parentPort.postMessage({text:result.text});
 } catch(e) { parentPort.postMessage({error:e instanceof Error?e.name:'ParseError'}); }
})();
`;
export function parsePdf(buffer:Buffer):Promise<string> {
 return new Promise((resolve,reject)=>{
  const worker=new Worker(workerCode,{eval:true,workerData:{bytes:buffer,root:process.cwd()},resourceLimits:{maxOldGenerationSizeMb:192}});
  const timeout=setTimeout(()=>{void worker.terminate();reject(new Error('PDF parsing timed out'));},15000);
  worker.once('message',(result:{text?:string;error?:string})=>{clearTimeout(timeout);void worker.terminate();if(result.error)reject(new Error('PDF parsing failed'));else resolve(result.text||'');});
  worker.once('error',()=>{clearTimeout(timeout);reject(new Error('PDF parser worker failed'));});
  worker.once('exit',code=>{clearTimeout(timeout);if(code!==0)reject(new Error('PDF parser exited'));});
 });
}

