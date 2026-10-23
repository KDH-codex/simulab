import {calculate} from './logic.js';
import {boot,value,money,pct,details} from '../../assets/js/reference-ui.js';
boot(f=>({assets:value(f,'assets'),debts:value(f,'debts')}),calculate,(r,el)=>{el.innerHTML='<h2>입력한 가구 순자산</h2><p class="ref-value">'+money(r.net)+'</p>'+details([['2024.3말 가구 평균',money(r.mean)],['평균과의 차이',money(r.difference)],['평균 대비 비율',pct(r.ratio)]])+'<p class="ref-note">평균 대비 비율은 상위 백분위·개인 순위가 아닙니다.</p>';});
