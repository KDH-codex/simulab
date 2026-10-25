import { COUNTRIES, YEARS, LATEST_GNI_YEAR } from './data.js';

// Ranks cover the selected countries only. Unavailable observations are omitted.
export function getRankingsByYear(year, metric = 'gniTotal') {
  const list = COUNTRIES.map(c => ({code:c.code,name:c.name,flag:c.flag,continent:c.continent,highlight:!!c.highlight,value:c.data[year]?.[metric] ?? null}))
    .filter(c => Number.isFinite(c.value)).sort((a,b) => b.value-a.value);
  const max = list[0]?.value || 1;
  return list.map((c,i) => ({...c,rank:i+1,percentage:Math.max(3,Math.round(c.value/max*100))}));
}

export function getCountryTimeSeries(countryCode) {
  const country=COUNTRIES.find(c=>c.code===countryCode)||COUNTRIES[0];
  return {...country,series:YEARS.map(year=>({year,gniTotal:country.data[year]?.gniTotal??null,gniPerCapita:country.data[year]?.gniPerCapita??null,
    rankTotal:getRankingsByYear(year,'gniTotal').find(c=>c.code===country.code)?.rank??null,
    rankPerCapita:getRankingsByYear(year,'gniPerCapita').find(c=>c.code===country.code)?.rank??null}))};
}

export function compareTwoCountries(targetCode='JPN',metric='gniPerCapita') {
  const kor=getCountryTimeSeries('KOR'), target=getCountryTimeSeries(targetCode);
  const metricLabel=metric==='gniPerCapita'?'1인당 GNI(Atlas 방식)':'명목 총 GNI';
  const unit=metric==='gniPerCapita'?'$':'10억 달러';
  const comparisons=YEARS.filter(y=>[kor.data[y]?.[metric],target.data[y]?.[metric]].every(Number.isFinite)).map(year=>{
    const korVal=kor.data[year][metric],targetVal=target.data[year][metric];
    return {year,korVal,targetVal,diff:korVal-targetVal,ratio:(korVal/targetVal*100).toFixed(1),isKorHigher:korVal>=targetVal};
  });
  const first=comparisons[0],latest=comparisons.at(-1);
  const korGrowth=(latest.korVal/first.korVal).toFixed(1), targetGrowth=(latest.targetVal/first.targetVal).toFixed(1);
  const crossoverYear=comparisons.find((c,i)=>i>0&&!comparisons[i-1].isKorHigher&&c.isKorHigher)?.year??null;
  const insightText=`${latest.year}년 한국 ${latest.korVal.toLocaleString()}${unit}, ${target.name} ${latest.targetVal.toLocaleString()}${unit}입니다. 공통 자료가 있는 ${first.year}~${latest.year}년 동안 각각 ${korGrowth}배, ${targetGrowth}배가 되었습니다. 역전 표시는 수록된 연도 사이의 변화이며 실제 최초 역전 연도를 뜻하지 않습니다.`;
  return {kor,target,metricLabel,unit,comparisons,korGrowth,targetGrowth,crossoverYear,insightText};
}

// Country GNI is not a wage distribution. This is a nominal arithmetic comparison.
export function benchmarkMySalary(salaryManwon=5000,exchangeRate=1350) {
  const safeSalary=Math.max(100,Number(salaryManwon)||5000), salaryUsd=Math.round(safeSalary*10000/exchangeRate);
  const rankings=getRankingsByYear(LATEST_GNI_YEAR,'gniPerCapita');
  const closestCountry=rankings.reduce((a,b)=>Math.abs(a.value-salaryUsd)<=Math.abs(b.value-salaryUsd)?a:b);
  return {salaryManwon:safeSalary,salaryUsd,exchangeRate,closestCountry,lowerCount:rankings.filter(c=>salaryUsd>=c.value).length,
    totalCount:rankings.length,year:LATEST_GNI_YEAR,tierTitle:`비슷한 국가 평균: ${closestCountry.name}`,badgeColor:'#6366f1',rankings};
}
