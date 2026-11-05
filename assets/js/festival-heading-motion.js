const escapeText=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
const characters=text=>segmenter?Array.from(segmenter.segment(text),part=>part.segment):Array.from(text.normalize('NFC'));
const splitDelay=125;
const splitDuration=600;

// Static, complete headings remain readable without JavaScript or motion.
export function splitHeading(lines) {
  let index=0;
  const rows=lines.map(line=>{
    const letters=characters(line).map(char=>{
      if(/^\s$/u.test(char))return escapeText(char);
      return '<span class="split-char'+(char==='?'?' heading-accent':'')+'" style="--split-delay:'+index++*splitDelay+'ms">'+escapeText(char)+'</span>';
    }).join('');
    return '<span class="split-line" aria-hidden="true">'+letters+'</span>';
  });
  return '<h1 class="split-heading" data-split-heading style="--split-duration:'+splitDuration+'ms" aria-label="'+escapeText(lines.join(' '))+'">'+rows.join('')+'</h1>';
}

export function typewriterText(textOrLines) {
  const lines=typeof textOrLines==='string'?[[{text:textOrLines}]]:textOrLines;
  const label=lines.map(line=>line.map(part=>part.text).join('')).join(' ');
  // The same glyphs reserve the layout and animate. Opacity changes never add a second line box.
  const rows=lines.map(line=>{
    const letters=line.map(({text,accent})=>characters(text).map(char=>
      '<span class="typewriter-char'+(accent?' heading-accent':'')+'">'+escapeText(char)+'</span>'
    ).join('')).join('');
    return '<span class="typewriter-line" aria-hidden="true">'+letters+'</span>';
  });
  return '<span class="typewriter-shell" data-typewriter><span class="motion-sr-only">'+escapeText(label)+'</span>'+rows.join('')+'</span>';
}

export function setupHeadingMotion({reducedMotion,root=document}={}) {
  const splits=[...root.querySelectorAll('[data-split-heading]')];
  const typing=[...root.querySelectorAll('[data-typewriter]')];
  const timers=new Set();
  const later=(callback,delay)=>{const id=setTimeout(()=>{timers.delete(id);callback();},delay);timers.add(id);};
  const finish=()=>{
    timers.forEach(clearTimeout);timers.clear();
    splits.forEach(el=>{el.classList.remove('split-playing');el.classList.add('motion-complete');});
    typing.forEach(el=>{
      el.classList.remove('is-typing');
      el.classList.add('motion-complete');
      el.querySelector('.has-cursor')?.classList.remove('has-cursor');
    });
  };
  const reveal=el=>{
    if(el.classList.contains('motion-complete')||reducedMotion.matches)return;
    if(el.hasAttribute('data-split-heading')){
      el.classList.add('split-playing');
      const duration=splitDuration+Math.max(0,el.querySelectorAll('.split-char').length-1)*splitDelay;
      later(()=>{el.classList.remove('split-playing');el.classList.add('motion-complete');},duration);
      return;
    }
    const letters=[...el.querySelectorAll('.typewriter-char')];
    if(!letters.length)return;
    el.classList.add('is-typing');
    let index=0;
    const tick=()=>{
      if(!el.isConnected||reducedMotion.matches)return;
      letters[index-1]?.classList.remove('has-cursor');
      letters[index++].classList.add('is-typed','has-cursor');
      if(index<letters.length)later(tick,60);
      else{
        el.classList.remove('is-typing');
        el.classList.add('motion-complete');
        later(()=>letters[index-1].classList.remove('has-cursor'),1400);
      }
    };
    later(tick,60);
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
