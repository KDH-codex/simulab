let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
const setText=(node,message)=>{if(node)node.textContent=message};
const isInstalled=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const canonical=()=>document.querySelector('link[rel="canonical"]')?.href||location.href;
async function copyLink(url,status){
 try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(url);setText(status,'링크를 복사했습니다.');}
 catch{const input=document.createElement('textarea');input.value=url;input.setAttribute('readonly','');input.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(input);input.select();let copied=false;try{copied=document.execCommand('copy')}catch{}input.remove();setText(status,copied?'링크를 복사했습니다.':'주소창의 링크를 길게 눌러 복사해 주세요.');}
}
async function shareLink(url,title,status){
 if(!navigator.share){await copyLink(url,status);return}
 try{await navigator.share({title,url});setText(status,'공유창을 열었습니다.');}catch(error){if(error?.name!=='AbortError')await copyLink(url,status)}
}
const bar=document.querySelector('[data-sharing-bar]'),feedback=bar?.querySelector('[data-sharing-feedback]');
bar?.querySelector('[data-action="share"]')?.addEventListener('click',()=>shareLink(canonical(),document.title,feedback));
bar?.querySelector('[data-action="copy"]')?.addEventListener('click',()=>copyLink(canonical(),feedback));
bar?.querySelector('[data-action="install"]')?.addEventListener('click',async()=>{
 const help=bar.querySelector('[data-install-help]');
 if(isInstalled()){setText(feedback,'이미 앱으로 열려 있습니다.');return}
 if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();return}
 if(help)help.hidden=!help.hidden;
});
window.addEventListener('appinstalled',()=>{installPrompt=null;setText(feedback,'홈 화면에 추가되었습니다.');});
for(const card of document.querySelectorAll('.episode-post')){
 const link=card.querySelector('a.post-link');if(!link)continue;
 const row=document.createElement('div');row.className='episode-share';
 const copy=document.createElement('button'),share=document.createElement('button'),status=document.createElement('span');
 copy.type=share.type='button';copy.textContent='링크 복사';share.textContent='공유';status.className='episode-share-status';status.setAttribute('role','status');
 const url=new URL(link.getAttribute('href'),location.origin).href;const title=card.querySelector('h3')?.textContent||'AI 사망토론';
 copy.addEventListener('click',()=>copyLink(url,status));share.addEventListener('click',()=>shareLink(url,title,status));row.append(copy,share,status);card.append(row);
}
