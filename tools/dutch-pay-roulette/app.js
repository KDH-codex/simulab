import {calculate} from './calculator.js';
import {boot,value,money,details} from '../../assets/js/reference-ui.js';
boot(f=>({total:value(f,'total'),people:value(f,'people')}),calculate,(r,el)=>{el.innerHTML='<h2>원 단위 균등 정산</h2><p class="ref-value">기본 '+money(r.base)+'</p>'+details([['1원 추가 부담 인원',r.extra+'명'],['기본 금액 부담 인원',r.people-r.extra+'명'],['실제 정산 합계',money(r.total)]])+'<p>이름과 계좌번호는 입력하지 않습니다. 추가 1원을 낼 순서는 참여자끼리 정하세요. 선결제·개별 메뉴 차이는 이 균등 정산에 포함하지 않습니다.</p>';});
