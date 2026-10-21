/**
 * 세계 20개국 국민총소득(GNI) 및 1인당 소득 공공 빅데이터 (1990~2024)
 * 
 * 출처:
 * 1. 세계은행(World Bank) Open Data - GNI, Atlas method (current US$)
 * 2. 세계은행(World Bank) - GNI per capita, Atlas method (current US$)
 * 3. IMF World Economic Outlook (WEO) Database (2024)
 * 4. 한국은행 경제통계시스템 (BOK ECOS) 2024 국민계정 기준년 개편 결과
 * 
 * 단위:
 * - gniTotal: 10억 달러 (Billion USD)
 * - gniPerCapita: 1인당 달러 (USD)
 */

export const YEARS = [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2022, 2024];

export const COUNTRIES = [
  {
    code: 'KOR',
    name: '대한민국',
    flag: '🇰🇷',
    continent: '아시아',
    highlight: true,
    data: {
      1990: { gniTotal: 283, gniPerCapita: 6610 },
      1995: { gniTotal: 556, gniPerCapita: 12330 },
      2000: { gniTotal: 588, gniPerCapita: 12260 },
      2005: { gniTotal: 933, gniPerCapita: 19370 },
      2010: { gniTotal: 1144, gniPerCapita: 23070 },
      2015: { gniTotal: 1473, gniPerCapita: 28880 },
      2020: { gniTotal: 1718, gniPerCapita: 33200 },
      2022: { gniTotal: 1820, gniPerCapita: 35150 },
      2024: { gniTotal: 1870, gniPerCapita: 36200 }
    }
  },
  {
    code: 'USA',
    name: '미국',
    flag: '🇺🇸',
    continent: '아메리카',
    data: {
      1990: { gniTotal: 6010, gniPerCapita: 24010 },
      1995: { gniTotal: 7690, gniPerCapita: 28930 },
      2000: { gniTotal: 10300, gniPerCapita: 36520 },
      2005: { gniTotal: 13350, gniPerCapita: 45290 },
      2010: { gniTotal: 15280, gniPerCapita: 49370 },
      2015: { gniTotal: 18350, gniPerCapita: 56980 },
      2020: { gniTotal: 21540, gniPerCapita: 64960 },
      2022: { gniTotal: 25800, gniPerCapita: 76800 },
      2024: { gniTotal: 28780, gniPerCapita: 82050 }
    }
  },
  {
    code: 'CHN',
    name: '중국',
    flag: '🇨🇳',
    continent: '아시아',
    data: {
      1990: { gniTotal: 395, gniPerCapita: 350 },
      1995: { gniTotal: 735, gniPerCapita: 610 },
      2000: { gniTotal: 1205, gniPerCapita: 950 },
      2005: { gniTotal: 2310, gniPerCapita: 1770 },
      2010: { gniTotal: 5930, gniPerCapita: 4430 },
      2015: { gniTotal: 11040, gniPerCapita: 8040 },
      2020: { gniTotal: 14930, gniPerCapita: 10580 },
      2022: { gniTotal: 17950, gniPerCapita: 12720 },
      2024: { gniTotal: 18530, gniPerCapita: 13400 }
    }
  },
  {
    code: 'JPN',
    name: '일본',
    flag: '🇯🇵',
    continent: '아시아',
    data: {
      1990: { gniTotal: 3340, gniPerCapita: 27010 },
      1995: { gniTotal: 5310, gniPerCapita: 42320 },
      2000: { gniTotal: 4990, gniPerCapita: 39310 },
      2005: { gniTotal: 4890, gniPerCapita: 38280 },
      2010: { gniTotal: 5760, gniPerCapita: 45010 },
      2015: { gniTotal: 4860, gniPerCapita: 38240 },
      2020: { gniTotal: 5210, gniPerCapita: 41250 },
      2022: { gniTotal: 4570, gniPerCapita: 36500 },
      2024: { gniTotal: 4110, gniPerCapita: 33500 }
    }
  },
  {
    code: 'DEU',
    name: '독일',
    flag: '🇩🇪',
    continent: '유럽',
    data: {
      1990: { gniTotal: 1770, gniPerCapita: 22290 },
      1995: { gniTotal: 2610, gniPerCapita: 31880 },
      2000: { gniTotal: 2020, gniPerCapita: 24590 },
      2005: { gniTotal: 2930, gniPerCapita: 35540 },
      2010: { gniTotal: 3540, gniPerCapita: 43250 },
      2015: { gniTotal: 3570, gniPerCapita: 43760 },
      2020: { gniTotal: 4020, gniPerCapita: 48330 },
      2022: { gniTotal: 4320, gniPerCapita: 51580 },
      2024: { gniTotal: 4590, gniPerCapita: 54100 }
    }
  },
  {
    code: 'GBR',
    name: '영국',
    flag: '🇬🇧',
    continent: '유럽',
    data: {
      1990: { gniTotal: 1060, gniPerCapita: 18450 },
      1995: { gniTotal: 1350, gniPerCapita: 23220 },
      2000: { gniTotal: 1670, gniPerCapita: 28310 },
      2005: { gniTotal: 2510, gniPerCapita: 41530 },
      2010: { gniTotal: 2490, gniPerCapita: 39680 },
      2015: { gniTotal: 2950, gniPerCapita: 45190 },
      2020: { gniTotal: 2790, gniPerCapita: 41570 },
      2022: { gniTotal: 3180, gniPerCapita: 47100 },
      2024: { gniTotal: 3490, gniPerCapita: 50800 }
    }
  },
  {
    code: 'FRA',
    name: '프랑스',
    flag: '🇫🇷',
    continent: '유럽',
    data: {
      1990: { gniTotal: 1260, gniPerCapita: 21620 },
      1995: { gniTotal: 1620, gniPerCapita: 27240 },
      2000: { gniTotal: 1450, gniPerCapita: 23820 },
      2005: { gniTotal: 2260, gniPerCapita: 35830 },
      2010: { gniTotal: 2800, gniPerCapita: 43070 },
      2015: { gniTotal: 2560, gniPerCapita: 38480 },
      2020: { gniTotal: 2730, gniPerCapita: 40560 },
      2022: { gniTotal: 2980, gniPerCapita: 43850 },
      2024: { gniTotal: 3130, gniPerCapita: 45600 }
    }
  },
  {
    code: 'IND',
    name: '인도',
    flag: '🇮🇳',
    continent: '아시아',
    data: {
      1990: { gniTotal: 326, gniPerCapita: 380 },
      1995: { gniTotal: 365, gniPerCapita: 380 },
      2000: { gniTotal: 475, gniPerCapita: 450 },
      2005: { gniTotal: 835, gniPerCapita: 730 },
      2010: { gniTotal: 1680, gniPerCapita: 1360 },
      2015: { gniTotal: 2080, gniPerCapita: 1570 },
      2020: { gniTotal: 2630, gniPerCapita: 1900 },
      2022: { gniTotal: 3380, gniPerCapita: 2390 },
      2024: { gniTotal: 3940, gniPerCapita: 2730 }
    }
  },
  {
    code: 'ITA',
    name: '이탈리아',
    flag: '🇮🇹',
    continent: '유럽',
    data: {
      1990: { gniTotal: 1160, gniPerCapita: 20490 },
      1995: { gniTotal: 1220, gniPerCapita: 21450 },
      2000: { gniTotal: 1170, gniPerCapita: 20560 },
      2005: { gniTotal: 1870, gniPerCapita: 32170 },
      2010: { gniTotal: 2190, gniPerCapita: 36980 },
      2015: { gniTotal: 1910, gniPerCapita: 31440 },
      2020: { gniTotal: 1980, gniPerCapita: 33260 },
      2022: { gniTotal: 2150, gniPerCapita: 36470 },
      2024: { gniTotal: 2320, gniPerCapita: 39100 }
    }
  },
  {
    code: 'CAN',
    name: '캐나다',
    flag: '🇨🇦',
    continent: '아메리카',
    data: {
      1990: { gniTotal: 580, gniPerCapita: 20950 },
      1995: { gniTotal: 595, gniPerCapita: 20300 },
      2000: { gniTotal: 725, gniPerCapita: 23640 },
      2005: { gniTotal: 1140, gniPerCapita: 35370 },
      2010: { gniTotal: 1570, gniPerCapita: 46210 },
      2015: { gniTotal: 1610, gniPerCapita: 45050 },
      2020: { gniTotal: 1650, gniPerCapita: 43390 },
      2022: { gniTotal: 2110, gniPerCapita: 54100 },
      2024: { gniTotal: 2240, gniPerCapita: 55200 }
    }
  },
  {
    code: 'BRA',
    name: '브라질',
    flag: '🇧🇷',
    continent: '아메리카',
    data: {
      1990: { gniTotal: 440, gniPerCapita: 2950 },
      1995: { gniTotal: 745, gniPerCapita: 4570 },
      2000: { gniTotal: 645, gniPerCapita: 3680 },
      2005: { gniTotal: 865, gniPerCapita: 4630 },
      2010: { gniTotal: 2130, gniPerCapita: 10820 },
      2015: { gniTotal: 1840, gniPerCapita: 8990 },
      2020: { gniTotal: 1490, gniPerCapita: 6980 },
      2022: { gniTotal: 1910, gniPerCapita: 8870 },
      2024: { gniTotal: 2180, gniPerCapita: 10100 }
    }
  },
  {
    code: 'RUS',
    name: '러시아',
    flag: '🇷🇺',
    continent: '유럽',
    data: {
      1990: { gniTotal: 520, gniPerCapita: 3500 },
      1995: { gniTotal: 390, gniPerCapita: 2630 },
      2000: { gniTotal: 250, gniPerCapita: 1710 },
      2005: { gniTotal: 740, gniPerCapita: 5130 },
      2010: { gniTotal: 1510, gniPerCapita: 10550 },
      2015: { gniTotal: 1330, gniPerCapita: 9110 },
      2020: { gniTotal: 1480, gniPerCapita: 10170 },
      2022: { gniTotal: 1970, gniPerCapita: 13580 },
      2024: { gniTotal: 2060, gniPerCapita: 14250 }
    }
  },
  {
    code: 'AUS',
    name: '호주',
    flag: '🇦🇺',
    continent: '오세아니아',
    data: {
      1990: { gniTotal: 310, gniPerCapita: 18190 },
      1995: { gniTotal: 375, gniPerCapita: 20760 },
      2000: { gniTotal: 405, gniPerCapita: 21190 },
      2005: { gniTotal: 695, gniPerCapita: 34180 },
      2010: { gniTotal: 1130, gniPerCapita: 51090 },
      2015: { gniTotal: 1360, gniPerCapita: 56980 },
      2020: { gniTotal: 1370, gniPerCapita: 53620 },
      2022: { gniTotal: 1690, gniPerCapita: 64950 },
      2024: { gniTotal: 1790, gniPerCapita: 66800 }
    }
  },
  {
    code: 'ESP',
    name: '스페인',
    flag: '🇪🇸',
    continent: '유럽',
    data: {
      1990: { gniTotal: 520, gniPerCapita: 13380 },
      1995: { gniTotal: 605, gniPerCapita: 15280 },
      2000: { gniTotal: 600, gniPerCapita: 14840 },
      2005: { gniTotal: 1140, gniPerCapita: 26230 },
      2010: { gniTotal: 1480, gniPerCapita: 31690 },
      2015: { gniTotal: 1250, gniPerCapita: 26860 },
      2020: { gniTotal: 1300, gniPerCapita: 27440 },
      2022: { gniTotal: 1440, gniPerCapita: 30140 },
      2024: { gniTotal: 1650, gniPerCapita: 34100 }
    }
  },
  {
    code: 'MEX',
    name: '멕시코',
    flag: '🇲🇽',
    continent: '아메리카',
    data: {
      1990: { gniTotal: 280, gniPerCapita: 3330 },
      1995: { gniTotal: 340, gniPerCapita: 3710 },
      2000: { gniTotal: 670, gniPerCapita: 6780 },
      2005: { gniTotal: 870, gniPerCapita: 8250 },
      2010: { gniTotal: 1040, gniPerCapita: 9280 },
      2015: { gniTotal: 1160, gniPerCapita: 9760 },
      2020: { gniTotal: 1070, gniPerCapita: 8460 },
      2022: { gniTotal: 1380, gniPerCapita: 10820 },
      2024: { gniTotal: 1810, gniPerCapita: 13800 }
    }
  },
  {
    code: 'IDN',
    name: '인도네시아',
    flag: '🇮🇩',
    continent: '아시아',
    data: {
      1990: { gniTotal: 115, gniPerCapita: 630 },
      1995: { gniTotal: 215, gniPerCapita: 1090 },
      2000: { gniTotal: 165, gniPerCapita: 780 },
      2005: { gniTotal: 295, gniPerCapita: 1300 },
      2010: { gniTotal: 720, gniPerCapita: 2960 },
      2015: { gniTotal: 870, gniPerCapita: 3370 },
      2020: { gniTotal: 1050, gniPerCapita: 3860 },
      2022: { gniTotal: 1280, gniPerCapita: 4620 },
      2024: { gniTotal: 1470, gniPerCapita: 5180 }
    }
  },
  {
    code: 'NLD',
    name: '네덜란드',
    flag: '🇳🇱',
    continent: '유럽',
    data: {
      1990: { gniTotal: 310, gniPerCapita: 20720 },
      1995: { gniTotal: 440, gniPerCapita: 28450 },
      2000: { gniTotal: 415, gniPerCapita: 26050 },
      2005: { gniTotal: 670, gniPerCapita: 41040 },
      2010: { gniTotal: 880, gniPerCapita: 52930 },
      2015: { gniTotal: 800, gniPerCapita: 47160 },
      2020: { gniTotal: 920, gniPerCapita: 52750 },
      2022: { gniTotal: 1020, gniPerCapita: 57640 },
      2024: { gniTotal: 1130, gniPerCapita: 62800 }
    }
  },
  {
    code: 'SAU',
    name: '사우디',
    flag: '🇸🇦',
    continent: '아시아',
    data: {
      1990: { gniTotal: 120, gniPerCapita: 7430 },
      1995: { gniTotal: 145, gniPerCapita: 7790 },
      2000: { gniTotal: 190, gniPerCapita: 9020 },
      2005: { gniTotal: 325, gniPerCapita: 13530 },
      2010: { gniTotal: 535, gniPerCapita: 19440 },
      2015: { gniTotal: 670, gniPerCapita: 21180 },
      2020: { gniTotal: 735, gniPerCapita: 21020 },
      2022: { gniTotal: 1020, gniPerCapita: 28400 },
      2024: { gniTotal: 1110, gniPerCapita: 31200 }
    }
  },
  {
    code: 'CHE',
    name: '스위스',
    flag: '🇨🇭',
    continent: '유럽',
    data: {
      1990: { gniTotal: 260, gniPerCapita: 38780 },
      1995: { gniTotal: 345, gniPerCapita: 49020 },
      2000: { gniTotal: 290, gniPerCapita: 40480 },
      2005: { gniTotal: 435, gniPerCapita: 58540 },
      2010: { gniTotal: 615, gniPerCapita: 78560 },
      2015: { gniTotal: 710, gniPerCapita: 85750 },
      2020: { gniTotal: 765, gniPerCapita: 88520 },
      2022: { gniTotal: 840, gniPerCapita: 95530 },
      2024: { gniTotal: 935, gniPerCapita: 103500 }
    }
  },
  {
    code: 'TWN',
    name: '대만',
    flag: '🇹🇼',
    continent: '아시아',
    data: {
      1990: { gniTotal: 170, gniPerCapita: 8350 },
      1995: { gniTotal: 280, gniPerCapita: 13130 },
      2000: { gniTotal: 335, gniPerCapita: 15140 },
      2005: { gniTotal: 375, gniPerCapita: 16480 },
      2010: { gniTotal: 450, gniPerCapita: 19440 },
      2015: { gniTotal: 540, gniPerCapita: 23020 },
      2020: { gniTotal: 690, gniPerCapita: 29280 },
      2022: { gniTotal: 780, gniPerCapita: 33320 },
      2024: { gniTotal: 820, gniPerCapita: 35100 }
    }
  }
];
