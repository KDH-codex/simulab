import {writeFile as write} from 'node:fs/promises';
// Some Windows scanners briefly lock freshly regenerated HTML. Retry only those
// transient write errors; all other failures and exhausted retries still fail CI.
export async function writeFile(file,data,options){
 for(let attempt=0;;attempt++){
  try{return await write(file,data,options);}
  catch(error){
   if(process.platform!=='win32'||attempt>=3||!['UNKNOWN','EBUSY','EPERM'].includes(error.code))throw error;
   await new Promise(resolve=>setTimeout(resolve,[60,180,500][attempt]));
  }
 }
}
