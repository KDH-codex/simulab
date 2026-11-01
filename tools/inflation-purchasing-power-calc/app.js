import {calculate} from './logic.js';
import {boot,value,money,pct,details} from '../../assets/js/reference-ui.js';
boot(f=>({amount:value(f,'amount'),baseIndex:value(f,'baseIndex'),targetIndex:value(f,'targetIndex')}),calculate,(r,el)=>{el.innerHTML='<h2>같은 구매력에 필요한 금액</h2><p class="ref-value">'+money(r.equivalent)+'</p>'+details([['입력 지수의 물가 변화',pct(r.priceChange)],['기준 금액을 보유한 경우의 구매력',money(r.purchasingPower)],['구매력 변화',pct(r.powerChange)]])+'<p class="ref-note">직접 입력한 지수의 계산 결과입니다. 기본값은 가정 예시입니다.</p>';});
