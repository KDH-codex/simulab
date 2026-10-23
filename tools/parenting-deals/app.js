import {SHOPS} from './data.js';
import {matchesFilters,reviewState} from './model.js';
const form=document.getElementById('deal-filters'),query=document.getElementById('shop-query'),type=document.getElementById('deal-type');
const chips=document.querySelector('.deal-categories'),cards=[...document.querySelectorAll('[data-shop]')],byId=new Map(SHOPS.map(shop=>[shop.id,shop]));
let category='all';
function update(){
  let count=0;
  for(const card of cards){const item=byId.get(card.dataset.shop),state=reviewState(item);
    card.hidden=!matchesFilters(item,{category,type:type.value,query:query.value});if(!card.hidden)count++;
    const label=card.querySelector('.review-state');label.textContent=state.label;label.dataset.state=state.code;
    if(item.mode==='summary'){card.querySelector('.deal-facts').hidden=!state.current;card.querySelector('.deal-highlight').hidden=!state.current;card.querySelector('.recheck-note').hidden=state.current;}
  }
  document.getElementById('deals-count').textContent=count+'곳 안내';document.getElementById('deals-empty').hidden=count!==0;
  chips.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dealCategory===category)));
}
form.hidden=false;chips.hidden=false;
form.addEventListener('submit',event=>event.preventDefault());query.addEventListener('input',update);type.addEventListener('change',update);
chips.addEventListener('click',event=>{const button=event.target.closest('button[data-deal-category]');if(button){category=button.dataset.dealCategory;update();}});
form.addEventListener('reset',()=>{category='all';query.value='';type.value='all';update();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});setInterval(update,60000);update();
