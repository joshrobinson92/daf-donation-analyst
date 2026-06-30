// DAF Donation Analyst - Custom SVG Charting Module

/**
 * Formats numbers as compact currency (e.g., $1.2M, $450K, $25K)
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrencyCompact(value) {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(0) + 'K';
  }
  return '$' + value.toFixed(0);
}

/**
 * Formats numbers as full currency (e.g., $1,250,000)
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrencyFull(value) {
  return '$' + Math.round(value).toLocaleString();
}

/**
 * Renders an interactive SVG Area/Line Chart for projections
 * @param {string} containerId ID of the parent element
 * @param {Array<Object>} data Year-by-year data from calculator
 * @param {Function} onHover Callback for mousemove event (yearData, x, y)
 * @param {Function} onLeave Callback for mouseleave event
 */
export function renderProjectionChart(containerId, data, onHover, onLeave) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous content
  container.innerHTML = '';

  const rect = container.getBoundingClientRect();
  const width = rect.width || 600;
  const height = rect.height || 350;

  const margin = { top: 20, right: 20, bottom: 40, left: 65 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // Find max value across both series to scale Y axis
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.endBalance, d.cumulativeGrants, 10000))
  );

  // Round maxVal to a clean ceiling for gridlines
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude;
  let ceilMultiplier = 1;
  if (normalized <= 1.2) ceilMultiplier = 1.2;
  else if (normalized <= 1.5) ceilMultiplier = 1.5;
  else if (normalized <= 2) ceilMultiplier = 2;
  else if (normalized <= 3) ceilMultiplier = 3;
  else if (normalized <= 4) ceilMultiplier = 4;
  else if (normalized <= 5) ceilMultiplier = 5;
  else if (normalized <= 6) ceilMultiplier = 6;
  else if (normalized <= 8) ceilMultiplier = 8;
  else ceilMultiplier = 10;
  
  const yMax = magnitude * ceilMultiplier;

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('style', 'overflow: visible;');

  // Define Gradients and Filters
  svg.innerHTML = `
    <defs>
      <!-- DAF Balance Gradient -->
      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary, #3b82f6)" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="var(--color-primary, #3b82f6)" stop-opacity="0.00"/>
      </linearGradient>
      <!-- Cumulative Grants Gradient -->
      <linearGradient id="grantsGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-accent, #10b981)" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="var(--color-accent, #10b981)" stop-opacity="0.00"/>
      </linearGradient>
      <!-- Drop Shadow for tooltips/lines -->
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
  `;

  // Draw Grid Lines (Y-Axis)
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = (yMax / yTicks) * i;
    const y = margin.top + graphHeight - (yVal / yMax) * graphHeight;

    // Gridline
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', margin.left);
    line.setAttribute('y1', y);
    line.setAttribute('x2', margin.left + graphWidth);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.06)');
    line.setAttribute('stroke-width', '1');
    if (i === 0) {
      line.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
    }
    svg.appendChild(line);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', margin.left - 10);
    text.setAttribute('y', y + 4);
    text.setAttribute('fill', 'var(--color-text-muted, #94a3b8)');
    text.setAttribute('font-size', '10px');
    text.setAttribute('font-family', 'var(--font-sans, sans-serif)');
    text.setAttribute('text-anchor', 'end');
    text.textContent = formatCurrencyCompact(yVal);
    svg.appendChild(text);
  }

  // Draw X-Axis Labels (Years)
  const xTicks = Math.min(data.length - 1, 6);
  const skip = Math.ceil((data.length - 1) / xTicks);
  for (let i = 0; i < data.length; i += skip) {
    const d = data[i];
    const x = margin.left + (i / (data.length - 1)) * graphWidth;

    // Tick label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', margin.top + graphHeight + 20);
    text.setAttribute('fill', 'var(--color-text-muted, #94a3b8)');
    text.setAttribute('font-size', '10px');
    text.setAttribute('font-family', 'var(--font-sans, sans-serif)');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = d.year === 0 ? 'Start' : `Yr ${d.year}`;
    svg.appendChild(text);
  }

  // Calculate points
  const pointsBalance = [];
  const pointsGrants = [];
  data.forEach((d, i) => {
    const x = margin.left + (i / (data.length - 1)) * graphWidth;
    const yBal = margin.top + graphHeight - (d.endBalance / yMax) * graphHeight;
    const yGrants = margin.top + graphHeight - (d.cumulativeGrants / yMax) * graphHeight;
    pointsBalance.push({ x, y: yBal });
    pointsGrants.push({ x, y: yGrants });
  });

  // Helper to generate SVG Path commands
  const getPathD = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const getAreaPathD = (pts) => {
    if (pts.length === 0) return '';
    const baseD = getPathD(pts);
    return `${baseD} L ${pts[pts.length - 1].x.toFixed(1)} ${(margin.top + graphHeight).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(margin.top + graphHeight).toFixed(1)} Z`;
  };

  // Draw Cumulative Grants Area (Draw this first so DAF balance line lays on top)
  const grantsArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  grantsArea.setAttribute('d', getAreaPathD(pointsGrants));
  grantsArea.setAttribute('fill', 'url(#grantsGrad)');
  svg.appendChild(grantsArea);

  // Draw DAF Balance Area
  const balanceArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  balanceArea.setAttribute('d', getAreaPathD(pointsBalance));
  balanceArea.setAttribute('fill', 'url(#balanceGrad)');
  svg.appendChild(balanceArea);

  // Draw Cumulative Grants Line
  const grantsLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  grantsLine.setAttribute('d', getPathD(pointsGrants));
  grantsLine.setAttribute('fill', 'none');
  grantsLine.setAttribute('stroke', 'var(--color-accent, #10b981)');
  grantsLine.setAttribute('stroke-width', '3');
  grantsLine.setAttribute('stroke-linecap', 'round');
  grantsLine.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(grantsLine);

  // Draw DAF Balance Line
  const balanceLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  balanceLine.setAttribute('d', getPathD(pointsBalance));
  balanceLine.setAttribute('fill', 'none');
  balanceLine.setAttribute('stroke', 'var(--color-primary, #3b82f6)');
  balanceLine.setAttribute('stroke-width', '3');
  balanceLine.setAttribute('stroke-linecap', 'round');
  balanceLine.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(balanceLine);

  // Interactive Hover Group (Elements that will show/hide on hover)
  const hoverGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  hoverGroup.setAttribute('style', 'display: none;');
  
  // Vertical guide line
  const guideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  guideLine.setAttribute('y1', margin.top);
  guideLine.setAttribute('y2', margin.top + graphHeight);
  guideLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
  guideLine.setAttribute('stroke-dasharray', '4 4');
  guideLine.setAttribute('stroke-width', '1.5');
  hoverGroup.appendChild(guideLine);

  // DAF Balance Dot
  const balDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  balDot.setAttribute('r', '6');
  balDot.setAttribute('fill', 'var(--color-primary, #3b82f6)');
  balDot.setAttribute('stroke', '#ffffff');
  balDot.setAttribute('stroke-width', '2');
  hoverGroup.appendChild(balDot);

  // Grants Dot
  const grantsDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  grantsDot.setAttribute('r', '6');
  grantsDot.setAttribute('fill', 'var(--color-accent, #10b981)');
  grantsDot.setAttribute('stroke', '#ffffff');
  grantsDot.setAttribute('stroke-width', '2');
  hoverGroup.appendChild(grantsDot);

  svg.appendChild(hoverGroup);

  // Transparent overlay rect for mouse tracking
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  overlay.setAttribute('x', margin.left);
  overlay.setAttribute('y', margin.top);
  overlay.setAttribute('width', graphWidth);
  overlay.setAttribute('height', graphHeight);
  overlay.setAttribute('fill', 'transparent');
  overlay.setAttribute('style', 'cursor: crosshair;');

  // Mouse event handlers
  const handleMouseMove = (e) => {
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    
    // Convert clientX to SVG coordinates relative to margins
    const scaleFactor = width / rect.width;
    const svgX = clientX * scaleFactor;
    
    // Bound check
    if (svgX < margin.left || svgX > margin.left + graphWidth) {
      handleMouseLeave();
      return;
    }

    // Find closest year
    const percentX = (svgX - margin.left) / graphWidth;
    const floatYear = percentX * (data.length - 1);
    const yearIndex = Math.round(floatYear);
    
    if (yearIndex >= 0 && yearIndex < data.length) {
      const yearData = data[yearIndex];
      const ptsBal = pointsBalance[yearIndex];
      const ptsGr = pointsGrants[yearIndex];

      // Position indicators
      guideLine.setAttribute('x1', ptsBal.x);
      guideLine.setAttribute('x2', ptsBal.x);
      
      balDot.setAttribute('cx', ptsBal.x);
      balDot.setAttribute('cy', ptsBal.y);
      
      grantsDot.setAttribute('cx', ptsGr.x);
      grantsDot.setAttribute('cy', ptsGr.y);

      hoverGroup.setAttribute('style', 'display: block;');

      // Trigger tooltip callback
      if (onHover) {
        // Calculate coordinate for tooltip position
        // Map to client page coordinates
        const tooltipX = rect.left + (ptsBal.x / scaleFactor);
        const tooltipY = rect.top + (Math.min(ptsBal.y, ptsGr.y) / scaleFactor) - 10;
        onHover(yearData, tooltipX, tooltipY);
      }
    }
  };

  const handleMouseLeave = () => {
    hoverGroup.setAttribute('style', 'display: none;');
    if (onLeave) onLeave();
  };

  overlay.addEventListener('mousemove', handleMouseMove);
  overlay.addEventListener('mouseleave', handleMouseLeave);
  svg.appendChild(overlay);

  container.appendChild(svg);
}

/**
 * Renders a premium responsive SVG Donut Chart
 * @param {string} containerId ID of the parent element
 * @param {Array<Object>} items Array of { label, percent, color }
 */
export function renderDonutChart(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const rect = container.getBoundingClientRect();
  const width = rect.width || 300;
  const height = rect.height || 220;

  const size = Math.min(width, height) - 20;
  const radius = size / 2.8;
  const strokeWidth = radius * 0.35;
  const centerX = width / 2;
  const centerY = height / 2;
  const circumference = 2 * Math.PI * radius;

  // Filter out 0% items
  const activeItems = items.filter(item => item.percent > 0);
  if (activeItems.length === 0) {
    container.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--color-text-muted);">No Allocations Yet</div>';
    return;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Base background ring
  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', centerX);
  bgCircle.setAttribute('cy', centerY);
  bgCircle.setAttribute('r', radius);
  bgCircle.setAttribute('fill', 'transparent');
  bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
  bgCircle.setAttribute('stroke-width', strokeWidth);
  svg.appendChild(bgCircle);

  let accumulatedPercent = 0;

  // Draw segments
  activeItems.forEach(item => {
    const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    segment.setAttribute('cx', centerX);
    segment.setAttribute('cy', centerY);
    segment.setAttribute('r', radius);
    segment.setAttribute('fill', 'transparent');
    segment.setAttribute('stroke', item.color);
    segment.setAttribute('stroke-width', strokeWidth);
    
    // Dasharray size
    const segmentLength = (item.percent / 100) * circumference;
    segment.setAttribute('stroke-dasharray', `${segmentLength} ${circumference}`);
    
    // Offset
    const offset = -(accumulatedPercent / 100) * circumference;
    segment.setAttribute('stroke-dashoffset', offset);
    
    // Start at top (rotate -90deg around center)
    segment.setAttribute('transform', `rotate(-90 ${centerX} ${centerY})`);
    segment.setAttribute('style', 'transition: stroke-dashoffset 0.5s ease, stroke-dasharray 0.5s ease;');
    
    // Tooltip / Interactive effects
    segment.setAttribute('class', 'donut-segment');
    segment.setAttribute('cursor', 'pointer');
    
    // Create text center overlay on hover
    segment.addEventListener('mouseenter', () => {
      segment.setAttribute('stroke-width', strokeWidth + 4);
      centerTextValue.textContent = `${item.percent.toFixed(0)}%`;
      centerTextLabel.textContent = item.label;
      centerTextLabel.setAttribute('fill', item.color);
    });

    segment.addEventListener('mouseleave', () => {
      segment.setAttribute('stroke-width', strokeWidth);
      resetCenterText();
    });

    svg.appendChild(segment);
    accumulatedPercent += item.percent;
  });

  // Add Center text elements
  const centerTextGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  centerTextGroup.setAttribute('text-anchor', 'middle');

  const centerTextValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerTextValue.setAttribute('x', centerX);
  centerTextValue.setAttribute('y', centerY + 4);
  centerTextValue.setAttribute('fill', '#ffffff');
  centerTextValue.setAttribute('font-size', '16px');
  centerTextValue.setAttribute('font-weight', 'bold');
  centerTextValue.setAttribute('font-family', 'var(--font-sans, sans-serif)');
  centerTextGroup.appendChild(centerTextValue);

  const centerTextLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerTextLabel.setAttribute('x', centerX);
  centerTextLabel.setAttribute('y', centerY + 18);
  centerTextLabel.setAttribute('fill', 'var(--color-text-muted, #94a3b8)');
  centerTextLabel.setAttribute('font-size', '9px');
  centerTextLabel.setAttribute('font-weight', '500');
  centerTextLabel.setAttribute('font-family', 'var(--font-sans, sans-serif)');
  centerTextGroup.appendChild(centerTextLabel);

  svg.appendChild(centerTextGroup);

  function resetCenterText() {
    // Show total or first item
    const totalAllocated = activeItems.reduce((acc, curr) => acc + curr.percent, 0);
    centerTextValue.textContent = `${totalAllocated.toFixed(0)}%`;
    centerTextLabel.textContent = 'Allocated';
    centerTextLabel.setAttribute('fill', 'var(--color-text-muted, #94a3b8)');
  }

  resetCenterText();
  container.appendChild(svg);
}
