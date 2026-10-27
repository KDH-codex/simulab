import {calculate} from './logic.js';
import {boot,value,money,details} from '../../assets/js/reference-ui.js';
boot(f=>({fee:value(f,'fee'),spend:value(f,'spend'),rate:value(f,'rate'),cap:value(f,'cap'),shippingSaved:value(f,'shippingSaved')}),calculate,(r,el)=>{el.innerHTML='<h2>월회비 차감 후 혜택</h2><p class="ref-value">'+money(r.net)+'</p>'+details([['할인 한도 적용 후 할인',money(r.discount)],['할인·배송비 절감 합계',money(r.benefit)],['회비를 만회하는 대상 결제액',r.breakEven===null?'입력한 할인 한도로는 회비 만회 불가':money(r.breakEven)]])+'<p>다른 조건을 그대로 두고 계산한 손익입니다. 월회비를 만회하려고 불필요한 구매를 늘리면 가계 지출은 커질 수 있습니다.</p>';});
