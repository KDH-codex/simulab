// World Bank WDI, source 2, downloaded 2026-10-26; totals in billion current USD, per capita in Atlas USD. Null means unavailable.
// Reviewed 2026-10-26. See docs/statistics-refresh-20261026.md for source periods.

export const YEARS = [
  1990,
  1995,
  2000,
  2005,
  2010,
  2015,
  2020,
  2022,
  2024,
  2025
];

export const LATEST_GNI_YEAR = 2025;

export const COUNTRIES = [
  {
    "code": "KOR",
    "name": "대한민국",
    "flag": "🇰🇷",
    "continent": "아시아",
    "highlight": true,
    "data": {
      "1990": {
        "gniTotal": 291.78,
        "gniPerCapita": 6660
      },
      "1995": {
        "gniTotal": 584.207,
        "gniPerCapita": 12230
      },
      "2000": {
        "gniTotal": 593.632,
        "gniPerCapita": 11460
      },
      "2005": {
        "gniTotal": 965.137,
        "gniPerCapita": 19230
      },
      "2010": {
        "gniTotal": 1194.538,
        "gniPerCapita": 23250
      },
      "2015": {
        "gniTotal": 1543.798,
        "gniPerCapita": 30130
      },
      "2020": {
        "gniTotal": 1758.426,
        "gniPerCapita": 35000
      },
      "2022": {
        "gniTotal": 1821.087,
        "gniPerCapita": 38590
      },
      "2024": {
        "gniTotal": 1902.457,
        "gniPerCapita": 36750
      },
      "2025": {
        "gniTotal": 1904.544,
        "gniPerCapita": 37880
      }
    }
  },
  {
    "code": "USA",
    "name": "미국",
    "flag": "🇺🇸",
    "continent": "아메리카",
    "data": {
      "1990": {
        "gniTotal": 5902.482,
        "gniPerCapita": 24060
      },
      "1995": {
        "gniTotal": 7575.542,
        "gniPerCapita": 29040
      },
      "2000": {
        "gniTotal": 10385.197,
        "gniPerCapita": 35960
      },
      "2005": {
        "gniTotal": 13170.993,
        "gniPerCapita": 46190
      },
      "2010": {
        "gniTotal": 15185.16,
        "gniPerCapita": 49180
      },
      "2015": {
        "gniTotal": 18608.138,
        "gniPerCapita": 56320
      },
      "2020": {
        "gniTotal": 21466.292,
        "gniPerCapita": 64630
      },
      "2022": {
        "gniTotal": 26207.041,
        "gniPerCapita": 77230
      },
      "2024": {
        "gniTotal": 28993.443,
        "gniPerCapita": 82910
      },
      "2025": {
        "gniTotal": 30585.823,
        "gniPerCapita": 88810
      }
    }
  },
  {
    "code": "CHN",
    "name": "중국",
    "flag": "🇨🇳",
    "continent": "아시아",
    "data": {
      "1990": {
        "gniTotal": 362.524,
        "gniPerCapita": 330
      },
      "1995": {
        "gniTotal": 726.418,
        "gniPerCapita": 540
      },
      "2000": {
        "gniTotal": 1209.09,
        "gniPerCapita": 950
      },
      "2005": {
        "gniTotal": 2301.444,
        "gniPerCapita": 1790
      },
      "2010": {
        "gniTotal": 6166.492,
        "gniPerCapita": 4410
      },
      "2015": {
        "gniTotal": 11228.033,
        "gniPerCapita": 8040
      },
      "2020": {
        "gniTotal": 14878.808,
        "gniPerCapita": 10740
      },
      "2022": {
        "gniTotal": 18163.546,
        "gniPerCapita": 13170
      },
      "2024": {
        "gniTotal": 18600.889,
        "gniPerCapita": 13660
      },
      "2025": {
        "gniTotal": 19384.279,
        "gniPerCapita": 14230
      }
    }
  },
  {
    "code": "JPN",
    "name": "일본",
    "flag": "🇯🇵",
    "continent": "아시아",
    "data": {
      "1990": {
        "gniTotal": 3287.598,
        "gniPerCapita": 28990
      },
      "1995": {
        "gniTotal": 5686.769,
        "gniPerCapita": 43580
      },
      "2000": {
        "gniTotal": 5114.258,
        "gniPerCapita": 37330
      },
      "2005": {
        "gniTotal": 4982.85,
        "gniPerCapita": 41690
      },
      "2010": {
        "gniTotal": 5965.04,
        "gniPerCapita": 44290
      },
      "2015": {
        "gniTotal": 4709.299,
        "gniPerCapita": 40140
      },
      "2020": {
        "gniTotal": 5374.617,
        "gniPerCapita": 41880
      },
      "2022": {
        "gniTotal": 4711.073,
        "gniPerCapita": 44300
      },
      "2024": {
        "gniTotal": 4445.04,
        "gniPerCapita": 37170
      },
      "2025": {
        "gniTotal": 4715.126,
        "gniPerCapita": 38340
      }
    }
  },
  {
    "code": "DEU",
    "name": "독일",
    "flag": "🇩🇪",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 1795.931,
        "gniPerCapita": 21360
      },
      "1995": {
        "gniTotal": 2589.547,
        "gniPerCapita": 29650
      },
      "2000": {
        "gniTotal": 1955.279,
        "gniPerCapita": 26380
      },
      "2005": {
        "gniTotal": 2917.037,
        "gniPerCapita": 36310
      },
      "2010": {
        "gniTotal": 3536.72,
        "gniPerCapita": 45530
      },
      "2015": {
        "gniTotal": 3492.65,
        "gniPerCapita": 46590
      },
      "2020": {
        "gniTotal": 4041.531,
        "gniPerCapita": 48540
      },
      "2022": {
        "gniTotal": 4326.585,
        "gniPerCapita": 55200
      },
      "2024": {
        "gniTotal": 4847.009,
        "gniPerCapita": 55090
      },
      "2025": {
        "gniTotal": 5233.769,
        "gniPerCapita": 60200
      }
    }
  },
  {
    "code": "GBR",
    "name": "영국",
    "flag": "🇬🇧",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 1121.273,
        "gniPerCapita": 18640
      },
      "1995": {
        "gniTotal": 1310.427,
        "gniPerCapita": 21360
      },
      "2000": {
        "gniTotal": 1676.195,
        "gniPerCapita": 29550
      },
      "2005": {
        "gniTotal": 2577.762,
        "gniPerCapita": 42840
      },
      "2010": {
        "gniTotal": 2497.833,
        "gniPerCapita": 42010
      },
      "2015": {
        "gniTotal": 2881.766,
        "gniPerCapita": 44630
      },
      "2020": {
        "gniTotal": 2666.344,
        "gniPerCapita": 39350
      },
      "2022": {
        "gniTotal": 3182.928,
        "gniPerCapita": 49690
      },
      "2024": {
        "gniTotal": 3659.245,
        "gniPerCapita": 49320
      },
      "2025": {
        "gniTotal": 3977.883,
        "gniPerCapita": 54550
      }
    }
  },
  {
    "code": "FRA",
    "name": "프랑스",
    "flag": "🇫🇷",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 1262.916,
        "gniPerCapita": 20470
      },
      "1995": {
        "gniTotal": 1601.805,
        "gniPerCapita": 25660
      },
      "2000": {
        "gniTotal": 1383.91,
        "gniPerCapita": 24950
      },
      "2005": {
        "gniTotal": 2231.904,
        "gniPerCapita": 35870
      },
      "2010": {
        "gniTotal": 2710.818,
        "gniPerCapita": 44040
      },
      "2015": {
        "gniTotal": 2491.912,
        "gniPerCapita": 41130
      },
      "2020": {
        "gniTotal": 2701.22,
        "gniPerCapita": 39690
      },
      "2022": {
        "gniTotal": 2881.608,
        "gniPerCapita": 46010
      },
      "2024": {
        "gniTotal": 3221.123,
        "gniPerCapita": 45160
      },
      "2025": {
        "gniTotal": 3425.957,
        "gniPerCapita": 48630
      }
    }
  },
  {
    "code": "IND",
    "name": "인도",
    "flag": "🇮🇳",
    "continent": "아시아",
    "data": {
      "1990": {
        "gniTotal": 316.775,
        "gniPerCapita": 390
      },
      "1995": {
        "gniTotal": 356.252,
        "gniPerCapita": 370
      },
      "2000": {
        "gniTotal": 463.42,
        "gniPerCapita": 440
      },
      "2005": {
        "gniTotal": 814.485,
        "gniPerCapita": 700
      },
      "2010": {
        "gniTotal": 1657.661,
        "gniPerCapita": 1210
      },
      "2015": {
        "gniTotal": 2079.183,
        "gniPerCapita": 1580
      },
      "2020": {
        "gniTotal": 2638.922,
        "gniPerCapita": 1900
      },
      "2022": {
        "gniTotal": 3203.859,
        "gniPerCapita": 2360
      },
      "2024": {
        "gniTotal": 3712.419,
        "gniPerCapita": 2550
      },
      "2025": {
        "gniTotal": 3906.712,
        "gniPerCapita": 2760
      }
    }
  },
  {
    "code": "ITA",
    "name": "이탈리아",
    "flag": "🇮🇹",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 1169.477,
        "gniPerCapita": 18710
      },
      "1995": {
        "gniTotal": 1163.114,
        "gniPerCapita": 20720
      },
      "2000": {
        "gniTotal": 1145.284,
        "gniPerCapita": 21980
      },
      "2005": {
        "gniTotal": 1867.902,
        "gniPerCapita": 32480
      },
      "2010": {
        "gniTotal": 2140.256,
        "gniPerCapita": 37720
      },
      "2015": {
        "gniTotal": 1832.664,
        "gniPerCapita": 33460
      },
      "2020": {
        "gniTotal": 1931.76,
        "gniPerCapita": 32600
      },
      "2022": {
        "gniTotal": 2123.551,
        "gniPerCapita": 39060
      },
      "2024": {
        "gniTotal": 2378.272,
        "gniPerCapita": 38640
      },
      "2025": {
        "gniTotal": 2554.479,
        "gniPerCapita": 42080
      }
    }
  },
  {
    "code": "CAN",
    "name": "캐나다",
    "flag": "🇨🇦",
    "continent": "아메리카",
    "data": {
      "1990": {
        "gniTotal": 574.627,
        "gniPerCapita": 20650
      },
      "1995": {
        "gniTotal": 585.087,
        "gniPerCapita": 20850
      },
      "2000": {
        "gniTotal": 725.237,
        "gniPerCapita": 22740
      },
      "2005": {
        "gniTotal": 1149.136,
        "gniPerCapita": 34310
      },
      "2010": {
        "gniTotal": 1585.38,
        "gniPerCapita": 44490
      },
      "2015": {
        "gniTotal": 1532.664,
        "gniPerCapita": 47580
      },
      "2020": {
        "gniTotal": 1643.688,
        "gniPerCapita": 43900
      },
      "2022": {
        "gniTotal": 2168.804,
        "gniPerCapita": 54070
      },
      "2024": {
        "gniTotal": 2234.538,
        "gniPerCapita": 54110
      },
      "2025": {
        "gniTotal": 2322.446,
        "gniPerCapita": 56420
      }
    }
  },
  {
    "code": "BRA",
    "name": "브라질",
    "flag": "🇧🇷",
    "continent": "아메리카",
    "data": {
      "1990": {
        "gniTotal": 374.726,
        "gniPerCapita": 2470
      },
      "1995": {
        "gniTotal": 758.586,
        "gniPerCapita": 3440
      },
      "2000": {
        "gniTotal": 636.573,
        "gniPerCapita": 3950
      },
      "2005": {
        "gniTotal": 865.86,
        "gniPerCapita": 4030
      },
      "2010": {
        "gniTotal": 2140.606,
        "gniPerCapita": 9750
      },
      "2015": {
        "gniTotal": 1768.3,
        "gniPerCapita": 10330
      },
      "2020": {
        "gniTotal": 1445.311,
        "gniPerCapita": 8080
      },
      "2022": {
        "gniTotal": 1895.346,
        "gniPerCapita": 8440
      },
      "2024": {
        "gniTotal": 2112.836,
        "gniPerCapita": 9930
      },
      "2025": {
        "gniTotal": 2205.743,
        "gniPerCapita": 10550
      }
    }
  },
  {
    "code": "RUS",
    "name": "러시아",
    "flag": "🇷🇺",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 515.98,
        "gniPerCapita": null
      },
      "1995": {
        "gniTotal": 392.166,
        "gniPerCapita": 2640
      },
      "2000": {
        "gniTotal": 252.974,
        "gniPerCapita": 1710
      },
      "2005": {
        "gniTotal": 745.49,
        "gniPerCapita": 4450
      },
      "2010": {
        "gniTotal": 1477.812,
        "gniPerCapita": 9980
      },
      "2015": {
        "gniTotal": 1325.733,
        "gniPerCapita": 11740
      },
      "2020": {
        "gniTotal": 1458.071,
        "gniPerCapita": 10660
      },
      "2022": {
        "gniTotal": 2245.361,
        "gniPerCapita": 12890
      },
      "2024": {
        "gniTotal": 2158.964,
        "gniPerCapita": 15330
      },
      "2025": {
        "gniTotal": 2543.379,
        "gniPerCapita": 15960
      }
    }
  },
  {
    "code": "AUS",
    "name": "호주",
    "flag": "🇦🇺",
    "continent": "오세아니아",
    "data": {
      "1990": {
        "gniTotal": 300.991,
        "gniPerCapita": 17370
      },
      "1995": {
        "gniTotal": 356.046,
        "gniPerCapita": 19400
      },
      "2000": {
        "gniTotal": 404.912,
        "gniPerCapita": 21340
      },
      "2005": {
        "gniTotal": 671.051,
        "gniPerCapita": 30790
      },
      "2010": {
        "gniTotal": 1107.932,
        "gniPerCapita": 46900
      },
      "2015": {
        "gniTotal": 1329.207,
        "gniPerCapita": 60780
      },
      "2020": {
        "gniTotal": 1301.591,
        "gniPerCapita": 53770
      },
      "2022": {
        "gniTotal": 1629.212,
        "gniPerCapita": 60790
      },
      "2024": {
        "gniTotal": 1695.733,
        "gniPerCapita": 62680
      },
      "2025": {
        "gniTotal": 1748.457,
        "gniPerCapita": 64120
      }
    }
  },
  {
    "code": "ESP",
    "name": "스페인",
    "flag": "🇪🇸",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 530.017,
        "gniPerCapita": 12190
      },
      "1995": {
        "gniTotal": 608.998,
        "gniPerCapita": 14810
      },
      "2000": {
        "gniTotal": 593.825,
        "gniPerCapita": 15770
      },
      "2005": {
        "gniTotal": 1138.732,
        "gniPerCapita": 25910
      },
      "2010": {
        "gniTotal": 1407.118,
        "gniPerCapita": 32060
      },
      "2015": {
        "gniTotal": 1205.222,
        "gniPerCapita": 28700
      },
      "2020": {
        "gniTotal": 1292.136,
        "gniPerCapita": 27410
      },
      "2022": {
        "gniTotal": 1456.076,
        "gniPerCapita": 32690
      },
      "2024": {
        "gniTotal": 1721.317,
        "gniPerCapita": 33550
      },
      "2025": {
        "gniTotal": 1905.176,
        "gniPerCapita": 37120
      }
    }
  },
  {
    "code": "MEX",
    "name": "멕시코",
    "flag": "🇲🇽",
    "continent": "아메리카",
    "data": {
      "1990": {
        "gniTotal": 252.628,
        "gniPerCapita": 2820
      },
      "1995": {
        "gniTotal": 366.827,
        "gniPerCapita": 5110
      },
      "2000": {
        "gniTotal": 726.951,
        "gniPerCapita": 6570
      },
      "2005": {
        "gniTotal": 904.18,
        "gniPerCapita": 8490
      },
      "2010": {
        "gniTotal": 1093.238,
        "gniPerCapita": 9470
      },
      "2015": {
        "gniTotal": 1182.963,
        "gniPerCapita": 10580
      },
      "2020": {
        "gniTotal": 1085.048,
        "gniPerCapita": 8920
      },
      "2022": {
        "gniTotal": 1432.993,
        "gniPerCapita": 10730
      },
      "2024": {
        "gniTotal": 1779.406,
        "gniPerCapita": 12760
      },
      "2025": {
        "gniTotal": 1776.305,
        "gniPerCapita": 13730
      }
    }
  },
  {
    "code": "IDN",
    "name": "인도네시아",
    "flag": "🇮🇩",
    "continent": "아시아",
    "data": {
      "1990": {
        "gniTotal": 100.923,
        "gniPerCapita": 560
      },
      "1995": {
        "gniTotal": 196.188,
        "gniPerCapita": 970
      },
      "2000": {
        "gniTotal": 154.078,
        "gniPerCapita": 570
      },
      "2005": {
        "gniTotal": 271.958,
        "gniPerCapita": 1200
      },
      "2010": {
        "gniTotal": 734.988,
        "gniPerCapita": 2490
      },
      "2015": {
        "gniTotal": 832.299,
        "gniPerCapita": 3390
      },
      "2020": {
        "gniTotal": 1029.975,
        "gniPerCapita": 3850
      },
      "2022": {
        "gniTotal": 1283.471,
        "gniPerCapita": 4520
      },
      "2024": {
        "gniTotal": 1360.121,
        "gniPerCapita": 4920
      },
      "2025": {
        "gniTotal": 1407.196,
        "gniPerCapita": 5120
      }
    }
  },
  {
    "code": "NLD",
    "name": "네덜란드",
    "flag": "🇳🇱",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 309.671,
        "gniPerCapita": 19910
      },
      "1995": {
        "gniTotal": 449.871,
        "gniPerCapita": 27120
      },
      "2000": {
        "gniTotal": 414.34,
        "gniPerCapita": 28140
      },
      "2005": {
        "gniTotal": 678.588,
        "gniPerCapita": 42280
      },
      "2010": {
        "gniTotal": 848.188,
        "gniPerCapita": 54000
      },
      "2015": {
        "gniTotal": 764.254,
        "gniPerCapita": 49670
      },
      "2020": {
        "gniTotal": 905.74,
        "gniPerCapita": 51490
      },
      "2022": {
        "gniTotal": 1034.598,
        "gniPerCapita": 62110
      },
      "2024": {
        "gniTotal": 1203.141,
        "gniPerCapita": 62500
      },
      "2025": {
        "gniTotal": 1304.615,
        "gniPerCapita": 68530
      }
    }
  },
  {
    "code": "SAU",
    "name": "사우디",
    "flag": "🇸🇦",
    "continent": "아시아",
    "data": {
      "1990": {
        "gniTotal": 125.609,
        "gniPerCapita": 11230
      },
      "1995": {
        "gniTotal": 146.147,
        "gniPerCapita": 11020
      },
      "2000": {
        "gniTotal": 189.994,
        "gniPerCapita": 10450
      },
      "2005": {
        "gniTotal": 328.891,
        "gniPerCapita": 14620
      },
      "2010": {
        "gniTotal": 542.915,
        "gniPerCapita": 21820
      },
      "2015": {
        "gniTotal": 714.778,
        "gniPerCapita": 26580
      },
      "2020": {
        "gniTotal": 779.167,
        "gniPerCapita": 26940
      },
      "2022": {
        "gniTotal": 1247.676,
        "gniPerCapita": 35110
      },
      "2024": {
        "gniTotal": 1262.85,
        "gniPerCapita": 35990
      },
      "2025": {
        "gniTotal": 1287.607,
        "gniPerCapita": 36070
      }
    }
  },
  {
    "code": "CHE",
    "name": "스위스",
    "flag": "🇨🇭",
    "continent": "유럽",
    "data": {
      "1990": {
        "gniTotal": 274.873,
        "gniPerCapita": 37570
      },
      "1995": {
        "gniTotal": 365.954,
        "gniPerCapita": 49030
      },
      "2000": {
        "gniTotal": 300.192,
        "gniPerCapita": 45030
      },
      "2005": {
        "gniTotal": 458.282,
        "gniPerCapita": 63630
      },
      "2010": {
        "gniTotal": 641.441,
        "gniPerCapita": 80400
      },
      "2015": {
        "gniTotal": 711.643,
        "gniPerCapita": 88150
      },
      "2020": {
        "gniTotal": 728.789,
        "gniPerCapita": 83150
      },
      "2022": {
        "gniTotal": 827.181,
        "gniPerCapita": 97920
      },
      "2024": {
        "gniTotal": 939.732,
        "gniPerCapita": 99920
      },
      "2025": {
        "gniTotal": 1035.198,
        "gniPerCapita": 110330
      }
    }
  }
];
