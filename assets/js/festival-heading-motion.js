const escapeText=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Static, complete headings remain readable without JavaScript or motion.
export function splitHeading(lines) {
  let index=0;
  return '<h1 class="split-heading" data-split-heading aria-label="'+escapeText(lines.join(' '))+'">'+lines.map(line=>'<span class="split-line" aria-hidden="true">'+Array.from(line).map(char=>'<span class="split-char'+(char==='?'?' heading-accent':'')+'" style="--split-index:'+index+++'">'+escapeText(char)+'</span>').join('')+'</span>').join('')+'</h1>';
}

export function typewriterText(text) {
  const safe=escapeText(text),visual=safe.replace(/\?$/,'<span class="heading-accent">?</span>');
  return '<span class="typewriter-shell" data-typewriter-text="'+safe+'"><span class="motion-sr-only">'+safe+'</span><span class="typewriter-reserve" aria-hidden="true">'+visual+'</span><span class="typewriter-output" aria-hidden="true" hidden></span></span>';
}

export function setupHeadingMotion({reducedMotion,root=document}={}) {
  const splits=[...root.querySelectorAll('[data-split-heading]')];
  const typing=[...root.querySelectorAll('[data-typewriter-text]')];
  const timers=new Set();
  const later=(callback,delay)=>{const id=setTimeout(()=>{timers.delete(id);callback();},delay);timers.add(id);};
  const finish=()=>{
    timers.forEach(clearTimeout);timers.clear();
    splits.forEach(el=>{el.classList.remove('split-playing');el.classList.add('motion-complete');});
    typing.forEach(el=>{el.classList.remove('is-typing');el.classList.add('motion-complete');el.querySelector('.typewriter-output').hidden=true;});
  };
  const reveal=el=>{
    if(el.classList.contains('motion-complete')||reducedMotion.matches)return;
    if(el.hasAttribute('data-split-heading')){
      el.classList.add('split-playing');
      later(()=>{el.classList.remove('split-playing');el.classList.add('motion-complete');},600+Math.max(0,el.querySelectorAll('.split-char').length-1)*45);
      return;
    }
    const chars=Array.from(el.dataset.typewriterText),output=el.querySelector('.typewriter-output');
    const cursor=document.createElement('span');cursor.className='typewriter-cursor';cursor.textContent='|';
    output.replaceChildren(cursor);output.hidden=false;el.classList.add('is-typing');
    let index=0;
    const tick=()=>{
      if(!el.isConnected||reducedMotion.matches)return;
      const char=chars[index++];
      const letter=document.createElement('span');letter.textContent=char;
      if(char==='?')letter.className='heading-accent';
      output.insertBefore(letter,cursor);
      if(index<chars.length)later(tick,60);
      else{el.classList.add('motion-complete');cursor.classList.add('typing-finished');}
    };
    if(chars.length)later(tick,60);
  };
  if(reducedMotion.matches){finish();return finish;}
  let observer;
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target);}}),{threshold:.1});
    [...splits,...typing].forEach(el=>observer.observe(el));
  }else [...splits,...typing].forEach(reveal);
  const onPreferenceChange=()=>{if(reducedMotion.matches){observer?.disconnect();finish();}};
  reducedMotion.addEventListener('change',onPreferenceChange);
  return ()=>{observer?.disconnect();reducedMotion.removeEventListener('change',onPreferenceChange);finish();};
}
