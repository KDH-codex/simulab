/**
 * ==========================================================================
 * SimuLab Hub - 고성능 HTML5 Canvas 2D 차트 렌더링 엔진
 * 파일 경로: assets/js/chart-engine.js
 * --------------------------------------------------------------------------
 * [리뉴얼 및 호환성 포인트]
 * - file:// 직접 실행 시에도 동작하도록 window.SimuLab 전역 객체에 등록합니다.
 * - TradingView / Linear 스타일의 정교한 점선 그리드, 상단 칩 범례,
 *   부드러운 영역 그라데이션, 고해상도 툴팁 디자인을 적용했습니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const SimuLab = (global.SimuLab = global.SimuLab || {});

  function getThemeChartColors() {
    const styles = getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

    return {
      bgCard: readVar('--chart-bg', '#101520'),
      bgSubtle: readVar('--bg-subtle', '#151c28'),
      textPrimary: readVar('--text-primary', '#f1f5f9'),
      textSecondary: readVar('--text-secondary', '#94a3b8'),
      gridColor: readVar('--chart-grid', 'rgba(255,255,255,0.06)'),
      axisText: readVar('--chart-text', '#64748b'),
      accentPrimary: readVar('--accent-primary', '#38bdf8'),
      accentSecondary: readVar('--accent-secondary', '#10b981'),
      colorSuccess: readVar('--color-success', '#10b981'),
      colorWarning: readVar('--color-warning', '#f59e0b'),
      colorDanger: readVar('--color-danger', '#f43f5e'),
      colorCaseA: readVar('--color-case-a', '#64748b'),
      colorCaseB: readVar('--color-case-b', '#38bdf8'),
      tooltipBg: readVar('--chart-tooltip-bg', 'rgba(15, 23, 42, 0.96)'),
      tooltipText: readVar('--chart-tooltip-text', '#f8fafc'),
    };
  }

  function setupHiDPICanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const height = Math.max(rect.height, 260);

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  function ensureInteractiveListeners(canvas) {
    if (canvas._hasChartListeners) return;
    canvas._hasChartListeners = true;
    canvas._hoverIndex = null;

    const redrawActive = () => {
      if (!canvas._lastChartConfig) return;
      if (canvas._chartType === 'candle') {
        drawInternalQuantCandleChart(canvas, canvas._lastChartConfig);
      } else if (canvas._chartType === 'line') {
        drawInternalLineChart(canvas, canvas._lastChartConfig);
      }
    };

    const handlePointerMove = (clientX) => {
      if (!canvas._lastChartConfig) return;
      const rect = canvas.getBoundingClientRect();
      const pointerX = clientX - rect.left;
      const count =
        canvas._chartType === 'candle'
          ? (canvas._lastChartConfig.candles || []).length
          : (canvas._lastChartConfig.labels || []).length;
      const padLeft = 78;
      const padRight = 24;
      const plotW = Math.max(rect.width - padLeft - padRight, 10);

      if (pointerX < padLeft - 10 || pointerX > rect.width - padRight + 10 || count < 2) {
        if (canvas._hoverIndex !== null) {
          canvas._hoverIndex = null;
          redrawActive();
        }
        return;
      }

      let idx = 0;
      if (canvas._chartType === 'candle') {
        const step = plotW / count;
        idx = Math.min(count - 1, Math.max(0, Math.floor((pointerX - padLeft) / step)));
      } else {
        const ratio = Math.min(Math.max((pointerX - padLeft) / plotW, 0), 1);
        idx = Math.round(ratio * (count - 1));
      }

      if (canvas._hoverIndex !== idx) {
        canvas._hoverIndex = idx;
        redrawActive();
      }
    };

    canvas.addEventListener('mousemove', (e) => handlePointerMove(e.clientX));

    canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches && e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches && e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    canvas.addEventListener('mouseleave', () => {
      if (canvas._hoverIndex !== null) {
        canvas._hoverIndex = null;
        redrawActive();
      }
    });

    window.addEventListener('simulab:themechange', redrawActive);
    window.addEventListener('resize', redrawActive);
  }

  function renderLineChart(canvas, config) {
    if (!canvas || !config || !Array.isArray(config.datasets)) return;

    canvas._lastChartConfig = config;
    canvas._chartType = 'line';
    ensureInteractiveListeners(canvas);
    drawInternalLineChart(canvas, config);
  }

  function drawInternalLineChart(canvas, config) {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    const colors = getThemeChartColors();
    const labels = config.labels || [];
    const datasets = config.datasets || [];
    const yFormatter = config.yFormatter || ((v) => v.toLocaleString('ko-KR'));

    // 1) 배경 채우기
    ctx.fillStyle = colors.bgCard;
    ctx.fillRect(0, 0, width, height);

    const padTop = 46;
    const padBottom = 38;
    const padLeft = 80;
    const padRight = 24;
    const plotW = Math.max(width - padLeft - padRight, 50);
    const plotH = Math.max(height - padTop - padBottom, 50);

    // 2) Y축 최소/최대값 산출
    let minY = Infinity;
    let maxY = -Infinity;
    for (const ds of datasets) {
      for (const val of ds.data) {
        if (Number.isFinite(val)) {
          if (val < minY) minY = val;
          if (val > maxY) maxY = val;
        }
      }
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
      minY = 0;
      maxY = 100;
    }
    if (minY > 0 && config.includeZero !== false) {
      minY = 0;
    }
    if (Math.abs(maxY - minY) < 1e-6) {
      maxY = minY + 100;
    }

    const rangeY = maxY - minY;
    maxY += rangeY * 0.08;
    if (minY < 0) {
      minY -= rangeY * 0.08;
    }

    const getX = (index) => {
      if (labels.length <= 1) return padLeft + plotW / 2;
      return padLeft + (index / (labels.length - 1)) * plotW;
    };

    const getY = (val) => {
      const ratio = (val - minY) / (maxY - minY);
      return padTop + plotH - ratio * plotH;
    };

    // 3) 상단 범례(Legend) 그리기
    ctx.font = '600 11.5px "Pretendard Variable", Pretendard, sans-serif';
    ctx.textBaseline = 'middle';
    let legendX = padLeft;
    const legendY = 18;

    datasets.forEach((ds, idx) => {
      const lineColor = ds.color || (idx === 0 ? colors.colorCaseB : colors.colorCaseA);

      // 컬러 인디케이터 도트/라인
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.roundRect(legendX, legendY - 4, 14, 8, 4);
      ctx.fill();

      ctx.fillStyle = colors.textPrimary;
      ctx.textAlign = 'left';
      ctx.fillText(ds.label, legendX + 20, legendY);
      legendX += ctx.measureText(ds.label).width + 40;
    });

    // 4) 가로 그리드 선 및 Y축 눈금 그리기
    const gridSteps = 5;
    ctx.font = '500 11px "JetBrains Mono", Pretendard, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const val = minY + ((maxY - minY) * i) / gridSteps;
      const y = getY(val);

      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      ctx.fillStyle = colors.axisText;
      ctx.fillText(yFormatter(val), padLeft - 10, y);
    }

    // Y=0 손익분기 기준선 강조
    if (minY < 0 && maxY > 0) {
      const zeroY = getY(0);
      ctx.strokeStyle = colors.colorWarning;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, zeroY);
      ctx.lineTo(padLeft + plotW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5) X축 라벨 그리기
    ctx.font = '500 11px "Pretendard Variable", Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = colors.axisText;
    const maxXLabels = Math.min(labels.length, 8);
    const stepX = Math.max(1, Math.ceil((labels.length - 1) / Math.max(1, maxXLabels - 1)));

    for (let i = 0; i < labels.length; i += stepX) {
      const x = getX(i);
      ctx.fillText(labels[i], x, padTop + plotH + 10);
    }
    if ((labels.length - 1) % stepX !== 0 && labels.length > 1) {
      ctx.fillText(labels[labels.length - 1], getX(labels.length - 1), padTop + plotH + 10);
    }

    // 6) 데이터셋 라인 및 그라데이션 영역 그리기
    datasets.forEach((ds, idx) => {
      const pts = ds.data.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));
      if (pts.length === 0) return;

      const lineColor = ds.color || (idx === 0 ? colors.colorCaseB : colors.colorCaseA);

      if (ds.fillArea && pts.length > 1) {
        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
        grad.addColorStop(0, hexToRgba(lineColor, 0.24));
        grad.addColorStop(1, hexToRgba(lineColor, 0.0));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, getY(Math.max(0, minY)));
        pts.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, getY(Math.max(0, minY)));
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = ds.dashed ? 2 : 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (ds.dashed) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // 포인트 마커
      if (pts.length <= 16) {
        pts.forEach((p) => {
          ctx.fillStyle = colors.bgCard;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
    });

    // 7) 워터마크
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillStyle = colors.axisText;
    ctx.textAlign = 'right';
    ctx.fillText(config.watermarkText || 'SIMULAB ANALYTICS', padLeft + plotW, padTop + plotH - 8);

    // 8) 호버 크로스헤어 & 툴팁 렌더링
    const hoverIdx = canvas._hoverIndex;
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < labels.length) {
      const hx = getX(hoverIdx);

      ctx.strokeStyle = colors.accentPrimary;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // 호버된 포인트 강조 원
      datasets.forEach((ds, idx) => {
        const val = ds.data[hoverIdx];
        if (!Number.isFinite(val)) return;
        const hy = getY(val);
        const lineColor = ds.color || (idx === 0 ? colors.colorCaseB : colors.colorCaseA);
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      const titleText = `${labels[hoverIdx]} 기준 상세`;
      const lines = datasets.map((ds, idx) => {
        const val = ds.data[hoverIdx];
        return {
          text: `${ds.label}: ${yFormatter(val)}`,
          color: ds.color || (idx === 0 ? colors.colorCaseB : colors.colorCaseA),
        };
      });

      ctx.font = '600 11.5px "Pretendard Variable", Pretendard, sans-serif';
      let maxTextW = ctx.measureText(titleText).width;
      lines.forEach((l) => {
        const w = ctx.measureText(l.text).width + 18;
        if (w > maxTextW) maxTextW = w;
      });

      const boxW = maxTextW + 24;
      const boxH = 32 + lines.length * 20;
      let boxX = hx + 14;
      if (boxX + boxW > width - 12) {
        boxX = hx - boxW - 14;
      }
      const boxY = padTop + 8;

      ctx.fillStyle = colors.tooltipBg;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 8);
      ctx.fill();

      ctx.fillStyle = colors.tooltipText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(titleText, boxX + 12, boxY + 9);

      lines.forEach((l, i) => {
        const rowY = boxY + 30 + i * 20;
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.arc(boxX + 16, rowY + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.tooltipText;
        ctx.fillText(l.text, boxX + 25, rowY);
      });
    }
  }

  function renderZoneBarChart(canvas, zones) {
    if (!canvas || !Array.isArray(zones)) return;

    canvas._lastZones = zones;
    canvas._chartType = 'zoneBar';

    if (!canvas._hasZoneListeners) {
      canvas._hasZoneListeners = true;
      window.addEventListener('simulab:themechange', () => {
        if (canvas._lastZones && canvas._chartType === 'zoneBar') {
          drawInternalZoneBarChart(canvas, canvas._lastZones);
        }
      });
      window.addEventListener('resize', () => {
        if (canvas._lastZones && canvas._chartType === 'zoneBar') {
          drawInternalZoneBarChart(canvas, canvas._lastZones);
        }
      });
    }

    drawInternalZoneBarChart(canvas, zones);
  }

  function drawInternalZoneBarChart(canvas, zones) {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    const colors = getThemeChartColors();

    ctx.fillStyle = colors.bgCard;
    ctx.fillRect(0, 0, width, height);

    const padTop = 36;
    const padBottom = 24;
    const padLeft = 140;
    const padRight = 95;
    const plotW = Math.max(width - padLeft - padRight, 60);
    const plotH = Math.max(height - padTop - padBottom, 120);

    const minScale = Math.max(40, Math.min(...zones.map((z) => z.minBpm)) - 12);
    const maxScale = Math.max(...zones.map((z) => z.maxBpm)) + 8;

    const getX = (bpm) => {
      const ratio = (bpm - minScale) / Math.max(1, maxScale - minScale);
      return padLeft + ratio * plotW;
    };

    ctx.font = '700 12px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('KARVONEN HEART RATE ZONES (BPM TARGET RANGE)', 16, 12);

    const rowH = plotH / zones.length;

    zones.forEach((z, idx) => {
      const centerY = padTop + idx * rowH + rowH / 2;
      const barH = Math.min(24, rowH * 0.56);
      const barY = centerY - barH / 2;

      if (z.highlight) {
        ctx.fillStyle = hexToRgba(z.color, 0.1);
        ctx.beginPath();
        ctx.roundRect(8, centerY - rowH / 2 + 2, width - 16, rowH - 4, 8);
        ctx.fill();
      }

      ctx.font = z.highlight
        ? '700 12.5px "Pretendard Variable", Pretendard, sans-serif'
        : '600 12px "Pretendard Variable", Pretendard, sans-serif';
      ctx.fillStyle = z.highlight ? z.color : colors.textPrimary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${z.zone} · ${z.name}`, 16, centerY);

      ctx.fillStyle = colors.bgSubtle;
      ctx.beginPath();
      ctx.roundRect(padLeft, barY, plotW, barH, 5);
      ctx.fill();

      const startX = getX(z.minBpm);
      const endX = getX(z.maxBpm);
      const barW = Math.max(16, endX - startX);

      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.roundRect(startX, barY, barW, barH, 5);
      ctx.fill();

      ctx.font = '600 11.5px "JetBrains Mono", monospace';
      ctx.fillStyle = z.highlight ? z.color : colors.textPrimary;
      ctx.textAlign = 'right';
      ctx.fillText(`${z.minBpm}–${z.maxBpm} bpm`, width - 16, centerY);
    });
  }

  function hexToRgba(hex, alpha = 1) {
    const clean = (hex || '').replace('#', '').trim();
    if (clean.length !== 6) {
      return `rgba(56, 189, 248, ${alpha})`;
    }
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * ==========================================================================
   * [신설] TradingView 스타일 캔들스틱(OHLCV) 봉차트 + 일목균형표 구름대 + 볼린저밴드 +
   *        슈퍼트렌드 타점 마커 + 하단 오실레이터(스토캐스틱·스퀴즈모멘텀·MACD·RSI) 렌더러
   * ==========================================================================
   */
  function renderQuantCandleChart(canvas, config) {
    if (!canvas || !config || !Array.isArray(config.candles)) return;

    canvas._lastChartConfig = config;
    canvas._chartType = 'candle';
    ensureInteractiveListeners(canvas);
    drawInternalQuantCandleChart(canvas, config);
  }

  function drawInternalQuantCandleChart(canvas, config) {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    const colors = getThemeChartColors();
    const candles = config.candles || [];
    const n = candles.length;
    if (n < 2) return;

    const yFormatter = config.yFormatter || ((v) => v.toLocaleString('ko-KR'));
    const overlays = config.overlays || {};
    const subChart = config.subChart || { type: 'stochastic' };
    const chartStyle = config.chartStyle || 'candle';

    // 1) 전체 캔버스 배경
    ctx.fillStyle = colors.bgCard;
    ctx.fillRect(0, 0, width, height);

    const padLeft = 78;
    const padRight = 24;
    const padTop = 44;
    const padBottom = 26;
    const plotW = Math.max(width - padLeft - padRight, 60);
    const totalPlotH = Math.max(height - padTop - padBottom, 200);

    // 상단 메인 차트(68%)와 하단 서브 오실레이터(26%) 분할
    const mainH = Math.round(totalPlotH * 0.68);
    const gapH = Math.round(totalPlotH * 0.06);
    const subTop = padTop + mainH + gapH;
    const subH = Math.max(55, totalPlotH - mainH - gapH);

    // 2) 메인 차트 Y축(가격) 최소·최대값 산출 (활성화된 오버레이 지표 포함)
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 1;

    for (let i = 0; i < n; i++) {
      const c = candles[i];
      if (c.l < minPrice) minPrice = c.l;
      if (c.h > maxPrice) maxPrice = c.h;
      if (c.v > maxVol) maxVol = c.v;

      if (overlays.showSMA) {
        if (overlays.sma20 && overlays.sma20[i] != null) {
          minPrice = Math.min(minPrice, overlays.sma20[i]);
          maxPrice = Math.max(maxPrice, overlays.sma20[i]);
        }
        if (overlays.sma50 && overlays.sma50[i] != null) {
          minPrice = Math.min(minPrice, overlays.sma50[i]);
          maxPrice = Math.max(maxPrice, overlays.sma50[i]);
        }
        if (overlays.sma200 && overlays.sma200[i] != null) {
          minPrice = Math.min(minPrice, overlays.sma200[i]);
          maxPrice = Math.max(maxPrice, overlays.sma200[i]);
        }
      }
      if (overlays.showBollinger && overlays.bbUpper && overlays.bbLower) {
        if (overlays.bbUpper[i] != null) maxPrice = Math.max(maxPrice, overlays.bbUpper[i]);
        if (overlays.bbLower[i] != null) minPrice = Math.min(minPrice, overlays.bbLower[i]);
      }
      if (overlays.showIchimoku && overlays.spanA && overlays.spanB) {
        if (overlays.spanA[i] != null) {
          minPrice = Math.min(minPrice, overlays.spanA[i]);
          maxPrice = Math.max(maxPrice, overlays.spanA[i]);
        }
        if (overlays.spanB[i] != null) {
          minPrice = Math.min(minPrice, overlays.spanB[i]);
          maxPrice = Math.max(maxPrice, overlays.spanB[i]);
        }
      }
      if (overlays.showSupertrend && overlays.supertrend && overlays.supertrend[i] != null) {
        minPrice = Math.min(minPrice, overlays.supertrend[i]);
        maxPrice = Math.max(maxPrice, overlays.supertrend[i]);
      }
    }

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice === maxPrice) {
      minPrice = 0;
      maxPrice = 100;
    }
    const priceRange = maxPrice - minPrice;
    minPrice = Math.max(0, minPrice - priceRange * 0.06);
    maxPrice = maxPrice + priceRange * 0.07;

    const stepX = plotW / n;
    const getX = (idx) => padLeft + idx * stepX + stepX * 0.5;
    const getMainY = (val) => {
      const ratio = (val - minPrice) / Math.max(0.0001, maxPrice - minPrice);
      return padTop + mainH - ratio * mainH;
    };

    // 3) 메인 차트 수평 그리드 & Y축 가격 눈금
    const gridSteps = 4;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const ratio = i / gridSteps;
      const y = padTop + mainH - ratio * mainH;
      const val = minPrice + ratio * (maxPrice - minPrice);

      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash(i === 0 ? [] : [3, 3]);
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colors.axisText;
      ctx.fillText(yFormatter(val), padLeft - 8, y);
    }

    // 4) [오버레이 1] 일목균형표 구름대 (Ichimoku Cloud: 선행스팬 A·B 양운/음운 및 전환선·기준선)
    if (overlays.showIchimoku && Array.isArray(overlays.spanA) && Array.isArray(overlays.spanB)) {
      for (let i = 0; i < n - 1; i++) {
        const a1 = overlays.spanA[i];
        const b1 = overlays.spanB[i];
        const a2 = overlays.spanA[i + 1];
        const b2 = overlays.spanB[i + 1];
        if (a1 == null || b1 == null || a2 == null || b2 == null) continue;

        const isBullCloud = a1 + a2 >= b1 + b2;
        ctx.fillStyle = isBullCloud ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.15)';
        ctx.beginPath();
        ctx.moveTo(getX(i), getMainY(a1));
        ctx.lineTo(getX(i + 1), getMainY(a2));
        ctx.lineTo(getX(i + 1), getMainY(b2));
        ctx.lineTo(getX(i), getMainY(b1));
        ctx.closePath();
        ctx.fill();
      }

      // 선행스팬 A(초록 실선), 선행스팬 B(코랄 실선), 전환선(9, 하늘색), 기준선(26, 보라색)
      drawIndicatorLine(ctx, overlays.spanA, getX, getMainY, 'rgba(16, 185, 129, 0.65)', 1.2, []);
      drawIndicatorLine(ctx, overlays.spanB, getX, getMainY, 'rgba(244, 63, 94, 0.65)', 1.2, []);
      if (Array.isArray(overlays.tenkan)) {
        drawIndicatorLine(ctx, overlays.tenkan, getX, getMainY, '#38bdf8', 1.3, [2, 2]);
      }
      if (Array.isArray(overlays.kijun)) {
        drawIndicatorLine(ctx, overlays.kijun, getX, getMainY, '#c084fc', 1.5, []);
      }
    }

    // 5) [오버레이 2] 볼린저 밴드 (20, 2σ 채널 음영 + 상·중·하단선)
    if (
      overlays.showBollinger &&
      Array.isArray(overlays.bbUpper) &&
      Array.isArray(overlays.bbLower)
    ) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        if (overlays.bbUpper[i] == null) continue;
        if (!started) {
          ctx.moveTo(getX(i), getMainY(overlays.bbUpper[i]));
          started = true;
        } else {
          ctx.lineTo(getX(i), getMainY(overlays.bbUpper[i]));
        }
      }
      for (let i = n - 1; i >= 0; i--) {
        if (overlays.bbLower[i] == null) continue;
        ctx.lineTo(getX(i), getMainY(overlays.bbLower[i]));
      }
      ctx.closePath();
      ctx.fill();

      drawIndicatorLine(ctx, overlays.bbUpper, getX, getMainY, 'rgba(56, 189, 248, 0.75)', 1.3, [4, 3]);
      drawIndicatorLine(ctx, overlays.bbLower, getX, getMainY, 'rgba(56, 189, 248, 0.75)', 1.3, [4, 3]);
    }

    // 6) [오버레이 3] 돈치안 채널 (Turtle 20일 고점 돌파 / 10일 저점 라인)
    if (overlays.showDonchian && Array.isArray(overlays.donchianHigh)) {
      drawIndicatorLine(ctx, overlays.donchianHigh, getX, getMainY, '#a855f7', 1.4, [5, 3]);
      drawIndicatorLine(ctx, overlays.donchianLow, getX, getMainY, 'rgba(168, 85, 247, 0.55)', 1.2, [3, 3]);
    }

    // 7) [오버레이 4] 이동평균선 (SMA 20 · 50 · 200)
    if (overlays.showSMA) {
      if (Array.isArray(overlays.sma20)) {
        drawIndicatorLine(ctx, overlays.sma20, getX, getMainY, '#38bdf8', 1.4, []);
      }
      if (Array.isArray(overlays.sma50)) {
        drawIndicatorLine(ctx, overlays.sma50, getX, getMainY, '#10b981', 1.7, []);
      }
      if (Array.isArray(overlays.sma200)) {
        drawIndicatorLine(ctx, overlays.sma200, getX, getMainY, '#f59e0b', 2.3, []);
      }
    }

    // 8) 메인 차트 하단 16% 거래량(Volume) 바 렌더링
    const volMaxH = mainH * 0.16;
    const candleW = Math.max(2.5, Math.min(14, stepX * 0.68));
    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const isUp = c.c >= c.o;
      const vH = Math.max(2, (c.v / Math.max(1, maxVol)) * volMaxH);
      const x = getX(i);
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.22)';
      ctx.fillRect(x - candleW / 2, padTop + mainH - vH, candleW, vH);
    }

    // 9) 시가-고가-저가-종가 캔들스틱 봉차트 (또는 선차트) 렌더링
    if (chartStyle === 'line') {
      const closes = candles.map((c) => c.c);
      drawIndicatorLine(ctx, closes, getX, getMainY, colors.accentPrimary, 2.4, []);
    } else {
      for (let i = 0; i < n; i++) {
        const c = candles[i];
        const isUp = c.c >= c.o;
        const color = isUp ? '#10b981' : '#f43f5e';
        const x = getX(i);
        const highY = getMainY(c.h);
        const lowY = getMainY(c.l);
        const openY = getMainY(c.o);
        const closeY = getMainY(c.c);

        // 위·아래 꼬리 (Wick)
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, Math.min(1.6, candleW * 0.18));
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // 시가~종가 몸통 (Body)
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(closeY - openY));
        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      }
    }

    // 10) [오버레이 5] SuperTrend (10, 3 ATR) 추세선 & BUY/SELL 타점 마커
    if (
      overlays.showSupertrend &&
      Array.isArray(overlays.supertrend) &&
      Array.isArray(overlays.supertrendDir)
    ) {
      for (let i = 1; i < n; i++) {
        const stPrev = overlays.supertrend[i - 1];
        const stCurr = overlays.supertrend[i];
        const dirCurr = overlays.supertrendDir[i];
        const dirPrev = overlays.supertrendDir[i - 1];
        if (stPrev == null || stCurr == null) continue;

        ctx.beginPath();
        ctx.strokeStyle = dirCurr === 1 ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 2.0;
        if (dirCurr === dirPrev) {
          ctx.moveTo(getX(i - 1), getMainY(stPrev));
          ctx.lineTo(getX(i), getMainY(stCurr));
        } else {
          ctx.moveTo(getX(i), getMainY(stCurr));
          ctx.lineTo(getX(i) + 1, getMainY(stCurr));
        }
        ctx.stroke();
      }

      // BUY / SELL 추세 전환 마커 캡슐 표시
      if (Array.isArray(overlays.signals)) {
        overlays.signals.forEach((sig) => {
          if (sig.idx < 0 || sig.idx >= n) return;
          const x = getX(sig.idx);
          const c = candles[sig.idx];
          const isBuy = sig.type === 'BUY';
          const markerY = isBuy
            ? Math.min(padTop + mainH - 12, getMainY(c.l) + 14)
            : Math.max(padTop + 12, getMainY(c.h) - 14);

          ctx.fillStyle = isBuy ? '#10b981' : '#f43f5e';
          ctx.beginPath();
          ctx.roundRect(x - 18, markerY - 8, 36, 16, 4);
          ctx.fill();

          ctx.font = '700 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isBuy ? '▲BUY' : '▼SELL', x, markerY);
        });
      }
    }

    // 11) 하단 오실레이터 서브차트 렌더링 (스토캐스틱 / LazyBear 스퀴즈 모멘텀 / MACD / RSI)
    drawSubOscillatorPanel(ctx, {
      subChart,
      n,
      padLeft,
      padRight,
      width,
      subTop,
      subH,
      getX,
      candleW,
      colors,
    });

    // 12) X축 날짜 눈금 렌더링
    const maxLabels = Math.min(n, Math.floor(plotW / 68));
    const labelStep = Math.max(1, Math.ceil(n / maxLabels));
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = colors.axisText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < n; i += labelStep) {
      ctx.fillText(candles[i].d, getX(i), subTop + subH + 6);
    }
    if ((n - 1) % labelStep !== 0) {
      ctx.fillText(candles[n - 1].d, getX(n - 1), subTop + subH + 6);
    }

    // 13) 상단 실시간 OHLCV & 활성 지표 상태 HUD 바 렌더링
    const activeIdx =
      canvas._hoverIndex !== null && canvas._hoverIndex >= 0 && canvas._hoverIndex < n
        ? canvas._hoverIndex
        : n - 1;
    const curBar = candles[activeIdx];
    const prevBar = candles[Math.max(0, activeIdx - 1)];
    const chgPct = prevBar && prevBar.c > 0 ? ((curBar.c - prevBar.c) / prevBar.c) * 100 : 0;
    const isUpBar = curBar.c >= curBar.o;

    ctx.font = '700 11.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors.textPrimary;
    const hudHeader = `${config.symbol || ''} [${config.timeframeLabel || '1D'}] ${curBar.d}`;
    ctx.fillText(hudHeader, padLeft, 18);

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = isUpBar ? '#10b981' : '#f43f5e';
    const ohlcText = `시가 ${yFormatter(curBar.o)} · 고가 ${yFormatter(curBar.h)} · 저가 ${yFormatter(
      curBar.l
    )} · 종가 ${yFormatter(curBar.c)} (${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%)`;
    ctx.fillText(ohlcText, padLeft + ctx.measureText(hudHeader).width + 14, 18);

    // 14) 마우스 호버 크로스헤어(십자선) 및 상세 플로팅 툴팁 박스
    if (canvas._hoverIndex !== null && canvas._hoverIndex >= 0 && canvas._hoverIndex < n) {
      const hx = getX(activeIdx);
      const hy = getMainY(curBar.c);

      ctx.beginPath();
      ctx.strokeStyle = colors.textSecondary;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, subTop + subH);
      ctx.moveTo(padLeft, hy);
      ctx.lineTo(width - padRight, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      const tipLines = [
        {
          color: isUpBar ? '#10b981' : '#f43f5e',
          text: `시가 ${yFormatter(curBar.o)} / 종가 ${yFormatter(curBar.c)} (${
            chgPct >= 0 ? '+' : ''
          }${chgPct.toFixed(2)}%)`,
        },
        {
          color: colors.accentPrimary,
          text: `고가 ${yFormatter(curBar.h)} / 저가 ${yFormatter(curBar.l)} · 거래량 ${(
            curBar.v || 0
          ).toLocaleString()}K`,
        },
      ];

      if (overlays.showSMA && overlays.sma200 && overlays.sma200[activeIdx] != null) {
        tipLines.push({
          color: '#f59e0b',
          text: `MA50: ${yFormatter(overlays.sma50[activeIdx] || 0)} · MA200: ${yFormatter(
            overlays.sma200[activeIdx]
          )}`,
        });
      }
      if (overlays.showIchimoku && overlays.spanA && overlays.spanA[activeIdx] != null) {
        tipLines.push({
          color: '#c084fc',
          text: `일목 구름대: ${yFormatter(overlays.spanA[activeIdx])} ~ ${yFormatter(
            overlays.spanB[activeIdx]
          )}`,
        });
      }
      if (subChart.type === 'stochastic' && subChart.stochK && subChart.stochK[activeIdx] != null) {
        tipLines.push({
          color: '#38bdf8',
          text: `스토캐스틱 Slow %K: ${subChart.stochK[activeIdx].toFixed(1)} / %D: ${(
            subChart.stochD[activeIdx] || 0
          ).toFixed(1)}`,
        });
      } else if (
        subChart.type === 'squeeze' &&
        subChart.sqzVal &&
        subChart.sqzVal[activeIdx] != null
      ) {
        const sqzOnNow = subChart.sqzOn && subChart.sqzOn[activeIdx];
        tipLines.push({
          color: sqzOnNow ? '#f43f5e' : '#10b981',
          text: `Squeeze: ${sqzOnNow ? 'ON (에너지 응축)' : 'OFF (모멘텀 발산)'} · 값 ${subChart.sqzVal[
            activeIdx
          ].toFixed(2)}`,
        });
      }

      ctx.font = '600 11px "Pretendard Variable", Pretendard, sans-serif';
      const titleStr = `${curBar.d} (${config.symbol || ''})`;
      let maxW = ctx.measureText(titleStr).width;
      tipLines.forEach((l) => {
        maxW = Math.max(maxW, ctx.measureText(l.text).width + 18);
      });

      const boxW = maxW + 24;
      const boxH = 28 + tipLines.length * 18;
      let boxX = hx + 14;
      if (boxX + boxW > width - 10) boxX = hx - boxW - 14;
      boxX = Math.max(padLeft + 4, boxX);
      const boxY = padTop + 8;

      ctx.fillStyle = colors.tooltipBg;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 7);
      ctx.fill();
      ctx.strokeStyle = colors.gridColor;
      ctx.stroke();

      ctx.fillStyle = colors.tooltipText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(titleStr, boxX + 10, boxY + 7);

      tipLines.forEach((l, idx) => {
        const ry = boxY + 26 + idx * 18;
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.arc(boxX + 14, ry + 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.tooltipText;
        ctx.fillText(l.text, boxX + 22, ry);
      });
    }
  }

  function drawIndicatorLine(ctx, arr, getX, getY, color, lineWidth, dash) {
    if (!Array.isArray(arr)) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1.5;
    ctx.setLineDash(dash || []);
    let started = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == null || !Number.isFinite(arr[i])) continue;
      const x = getX(i);
      const y = getY(arr[i]);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSubOscillatorPanel(ctx, opts) {
    const { subChart, n, padLeft, padRight, width, subTop, subH, getX, candleW, colors } = opts;

    // 서브차트 상단 구분선 및 배경
    ctx.fillStyle = colors.bgSubtle;
    ctx.fillRect(padLeft, subTop, width - padLeft - padRight, subH);
    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(padLeft, subTop, width - padLeft - padRight, subH);

    const type = subChart.type || 'stochastic';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (type === 'stochastic') {
      ctx.fillText('STOCHASTIC SLOW (14, 3, 3) · %K(하늘) / %D(주황) · 과매수 80 / 과매도 20', padLeft + 8, subTop + 4);
      const getSubY = (v) => subTop + subH - (Math.min(100, Math.max(0, v)) / 100) * subH;

      // 80 / 20 기준 점선
      [20, 80].forEach((lvl) => {
        const y = getSubY(lvl);
        ctx.beginPath();
        ctx.strokeStyle = lvl === 80 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '500 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = colors.axisText;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${lvl}`, padLeft - 8, y);
      });

      drawIndicatorLine(ctx, subChart.stochK, getX, getSubY, '#38bdf8', 1.6, []);
      drawIndicatorLine(ctx, subChart.stochD, getX, getSubY, '#f59e0b', 1.4, [3, 2]);
    } else if (type === 'squeeze') {
      ctx.fillText(
        'LAZYBEAR SQUEEZE MOMENTUM · 빨간점=Squeeze ON(에너지 응축) / 초록점=Squeeze OFF(폭발)',
        padLeft + 8,
        subTop + 4
      );
      const vals = subChart.sqzVal || [];
      let maxAbs = 0.01;
      vals.forEach((v) => {
        if (v != null && Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
      });
      maxAbs *= 1.15;
      const zeroY = subTop + subH / 2;
      const getSubY = (v) => zeroY - (v / maxAbs) * (subH * 0.42);

      for (let i = 0; i < n; i++) {
        const v = vals[i] || 0;
        const prev = i > 0 ? vals[i - 1] || 0 : 0;
        const x = getX(i);
        const y = getSubY(v);
        if (v >= 0) {
          ctx.fillStyle = v >= prev ? '#10b981' : 'rgba(16, 185, 129, 0.45)';
          ctx.fillRect(x - candleW / 2, y, candleW, Math.max(1, zeroY - y));
        } else {
          ctx.fillStyle = v <= prev ? '#f43f5e' : 'rgba(244, 63, 94, 0.45)';
          ctx.fillRect(x - candleW / 2, zeroY, candleW, Math.max(1, y - zeroY));
        }

        // 0선 위 Squeeze ON/OFF 도트
        const isSqz = subChart.sqzOn && subChart.sqzOn[i];
        ctx.fillStyle = isSqz ? '#f43f5e' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, zeroY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'macd') {
      ctx.fillText('MACD (12, 26, 9) · 히스토그램 & 시그널 크로스', padLeft + 8, subTop + 4);
      const mLine = subChart.macdLine || [];
      const sLine = subChart.macdSignal || [];
      const hArr = subChart.macdHist || [];
      let maxAbs = 0.01;
      for (let i = 0; i < n; i++) {
        maxAbs = Math.max(
          maxAbs,
          Math.abs(mLine[i] || 0),
          Math.abs(sLine[i] || 0),
          Math.abs(hArr[i] || 0)
        );
      }
      maxAbs *= 1.15;
      const zeroY = subTop + subH / 2;
      const getSubY = (v) => zeroY - (v / maxAbs) * (subH * 0.42);

      for (let i = 0; i < n; i++) {
        const h = hArr[i] || 0;
        const x = getX(i);
        const y = getSubY(h);
        ctx.fillStyle = h >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)';
        if (h >= 0) ctx.fillRect(x - candleW / 2, y, candleW, Math.max(1, zeroY - y));
        else ctx.fillRect(x - candleW / 2, zeroY, candleW, Math.max(1, y - zeroY));
      }
      drawIndicatorLine(ctx, mLine, getX, getSubY, '#38bdf8', 1.5, []);
      drawIndicatorLine(ctx, sLine, getX, getSubY, '#f59e0b', 1.3, [3, 2]);
    } else {
      ctx.fillText('RSI (14 · 하늘) & LARRY CONNORS RSI (2 · 보라 점선) · 과매도 30 / 과매수 70', padLeft + 8, subTop + 4);
      const getSubY = (v) => subTop + subH - (Math.min(100, Math.max(0, v)) / 100) * subH;
      [30, 70].forEach((lvl) => {
        const y = getSubY(lvl);
        ctx.beginPath();
        ctx.strokeStyle = lvl === 70 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      drawIndicatorLine(ctx, subChart.rsi14, getX, getSubY, '#38bdf8', 1.6, []);
      drawIndicatorLine(ctx, subChart.connorsRsi2, getX, getSubY, '#c084fc', 1.2, [2, 2]);
    }
  }

  Object.assign(SimuLab, {
    getThemeChartColors,
    setupHiDPICanvas,
    renderLineChart,
    renderQuantCandleChart,
    renderZoneBarChart,
  });
})(typeof window !== 'undefined' ? window : globalThis);

