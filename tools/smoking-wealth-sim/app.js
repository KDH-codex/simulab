/**
 * [담배값 주식 투자 시뮬] UI 컨트롤러 (app.js)
 * 
 * 사용자 입력(갑수, 가격, 기간)을 실시간으로 감지하여
 * 자산 형성 결과와 건강 회복 영수증 카드를 렌더링합니다.
 */

import { simulateSmokingWealth, ASSET_YIELDS } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM 요소 취득
    const packsInput = document.getElementById('packsInput');
    const packsSlider = document.getElementById('packsSlider');
    const priceInput = document.getElementById('priceInput');
    const yearsSlider = document.getElementById('yearsSlider');
    const yearsDisplay = document.getElementById('yearsDisplay');
    const customRateInput = document.getElementById('customRateInput');

    // 프리셋 버튼들
    const packPresetBtns = document.querySelectorAll('.pack-preset-btn');
    const yearPresetBtns = document.querySelectorAll('.year-preset-btn');

    // 결과 표시 요소들
    const heroAssetVal = document.getElementById('heroAssetVal');
    const heroProfitTag = document.getElementById('heroProfitTag');
    const equivalentBanner = document.getElementById('equivalentBanner');

    const principalVal = document.getElementById('principalVal');
    const savingsVal = document.getElementById('savingsVal');
    const sp500Val = document.getElementById('sp500Val');
    const nasdaqVal = document.getElementById('nasdaqVal');

    // 차트 바
    const barPrincipal = document.getElementById('barPrincipal');
    const barSavings = document.getElementById('barSavings');
    const barSp500 = document.getElementById('barSp500');
    const barNasdaq = document.getElementById('barNasdaq');

    // 건강 영수증 요소들
    const healthCigarettes = document.getElementById('healthCigarettes');
    const healthTar = document.getElementById('healthTar');
    const healthLife = document.getElementById('healthLife');
    const healthTime = document.getElementById('healthTime');

    // 공유 버튼
    const copyResultBtn = document.getElementById('copyResultBtn');

    // 숫자 포맷터 (원 단위 한글 포맷)
    function formatMoney(amount) {
        if (amount >= 100000000) {
            const eok = Math.floor(amount / 100000000);
            const man = Math.round((amount % 100000000) / 10000);
            return man > 0 ? `${eok.toLocaleString()}억 ${man.toLocaleString()}만 원` : `${eok.toLocaleString()}억 원`;
        } else if (amount >= 10000) {
            const man = Math.round(amount / 10000);
            return `${man.toLocaleString()}만 원`;
        }
        return `${Number(amount).toLocaleString()}원`;
    }

    // 2. 메인 시뮬레이션 렌더링 함수
    function updateSimulation() {
        const packs = parseFloat(packsInput.value) || 1;
        const price = parseInt(priceInput.value, 10) || 4500;
        const years = parseInt(yearsSlider.value, 10) || 10;
        const customRate = parseFloat(customRateInput?.value) || 8;

        yearsDisplay.textContent = `${years}년`;

        // 계산 로직 실행
        const res = simulateSmokingWealth({
            packsPerDay: packs,
            pricePerPack: price,
            years,
            customRate
        });

        // (1) 헤어로 하이라이트 (S&P 500 기준)
        heroAssetVal.textContent = formatMoney(res.investments.sp500);
        const sign = res.investments.sp500Profit >= 0 ? '+' : '';
        heroProfitTag.textContent = `원금 대비 ${sign}${formatMoney(res.investments.sp500Profit)} (+${res.investments.sp500Roi}%)`;
        equivalentBanner.innerHTML = `💡 이 돈이면 <strong>${res.equivalentItem}</strong> 구매가 가능합니다!`;

        // (2) 금액 테이블 업데이트
        principalVal.textContent = formatMoney(res.costs.totalPrincipal);
        savingsVal.textContent = formatMoney(res.investments.savings);
        sp500Val.textContent = formatMoney(res.investments.sp500);
        nasdaqVal.textContent = formatMoney(res.investments.nasdaq);

        // (3) 시각화 비교 바 비율 계산 (최대치인 나스닥 기준 100%)
        const maxVal = Math.max(res.investments.nasdaq, 1);
        const pPct = Math.max(5, (res.costs.totalPrincipal / maxVal) * 100);
        const sPct = Math.max(5, (res.investments.savings / maxVal) * 100);
        const spPct = Math.max(5, (res.investments.sp500 / maxVal) * 100);
        const nPct = 100;

        barPrincipal.style.width = `${pPct}%`;
        barSavings.style.width = `${sPct}%`;
        barSp500.style.width = `${spPct}%`;
        barNasdaq.style.width = `${nPct}%`;

        // (4) 건강 회복 영수증 업데이트
        healthCigarettes.textContent = `${res.health.totalCigarettes.toLocaleString()} 개비`;
        healthTar.textContent = `${res.health.savedTarGrams}g (종이컵 약 ${res.health.savedTarCups}컵)`;
        healthLife.textContent = `약 ${res.health.regainedLifeDays.toLocaleString()}일 (${res.health.regainedLifeYears}년)`;
        healthTime.textContent = `약 ${res.health.savedHours.toLocaleString()}시간 (${res.health.savedDays}일)`;
    }

    // 3. 이벤트 바인딩
    // 갑수 입력 및 슬라이더 연동
    packsInput.addEventListener('input', () => {
        packsSlider.value = packsInput.value;
        updateSimulation();
    });
    packsSlider.addEventListener('input', () => {
        packsInput.value = packsSlider.value;
        updateSimulation();
    });

    // 가격 및 기간 변경
    priceInput.addEventListener('input', updateSimulation);
    yearsSlider.addEventListener('input', updateSimulation);
    if (customRateInput) customRateInput.addEventListener('input', updateSimulation);

    // 프리셋 버튼 핸들러 (갑수)
    packPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            packPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.dataset.pack;
            packsInput.value = val;
            packsSlider.value = val;
            updateSimulation();
        });
    });

    // 프리셋 버튼 핸들러 (기간)
    yearPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            yearPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.dataset.year;
            yearsSlider.value = val;
            updateSimulation();
        });
    });

    // 결과 텍스트 복사 (카톡/SNS 공유용)
    if (copyResultBtn) {
        copyResultBtn.addEventListener('click', () => {
            const packs = packsInput.value;
            const years = yearsSlider.value;
            const sp500 = heroAssetVal.textContent;
            const item = equivalentBanner.textContent.replace('💡 이 돈이면 ', '').replace(' 구매가 가능합니다!', '');
            
            const shareText = `[시뮬랩] 담배값 주식 투자 시뮬레이션 결과 🚬➡️📈\n\n` +
                `하루 ${packs}갑을 ${years}년 동안 안 피우고 S&P 500에 적립식 투자했다면?\n` +
                `✨ 최종 모인 자산: ${sp500}\n` +
                `🎁 비유: ${item} 살 수 있는 돈!\n\n` +
                `지금 내 담배값도 시뮬레이션 해보기 👉 https://simulab.kr/tools/smoking-wealth-sim/`;

            navigator.clipboard.writeText(shareText).then(() => {
                const origText = copyResultBtn.innerHTML;
                copyResultBtn.innerHTML = '✅ 복사 완료! 친구에게 공유해보세요';
                setTimeout(() => {
                    copyResultBtn.innerHTML = origText;
                }, 2500);
            }).catch(err => {
                alert('결과 복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
            });
        });
    }

    // 초기 실행
    updateSimulation();
});
