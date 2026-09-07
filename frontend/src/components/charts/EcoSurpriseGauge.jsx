import React from 'react';

const EcoSurpriseGauge = ({ value = 50 }) => {
  // Clamp value between 0 and 100
  const clamped = Math.min(100, Math.max(0, value));

  // Map value to angle (0° = 12 o'clock)
  // 0 → -150°, 40 → -33.33°, 50 → 0°, 60 → 33.33°, 100 → 150°
  let angle;
  if (clamped <= 40) {
    angle = -150 + (clamped / 40) * (116.67); // -150 to -33.33 (116.67 diff)
  } else if (clamped <= 50) {
    angle = -33.33 + ((clamped - 40) / 10) * 33.33; // -33.33 to 0
  } else if (clamped <= 60) {
    angle = 0 + ((clamped - 50) / 10) * 33.33; // 0 to 33.33
  } else {
    angle = 33.33 + ((clamped - 60) / 40) * (116.67); // 33.33 to 150 (116.67 diff)
  }

  // Gauge dimensions (same as SentimentGauge)
  const size = 200;
  const center = size / 2;
  const outerRadius = 85;
  const bezelWidth = 6;
  const innerRadius = outerRadius - bezelWidth - 4;
  const bandWidth = 16;
  const bandRadius = innerRadius - bandWidth / 2;

  const pointOnCircle = (cx, cy, radius, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  // Zone boundaries (degrees)
  const redStart = -150;
  const redEnd = -33.33;
  const blueStart = 33.33;
  const blueEnd = 150;

  const createArcPath = (startDeg, endDeg, radius) => {
    const start = pointOnCircle(center, center, radius, startDeg);
    const end = pointOnCircle(center, center, radius, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // Tick marks (every 10°, major every 30°)
  const tickMarks = [];
  for (let deg = -150; deg <= 150; deg += 10) {
    const isMajor = deg % 30 === 0;
    const length = isMajor ? 10 : 5;
    const outerTick = outerRadius - bezelWidth - 2;
    const innerTick = outerTick - length;
    const p1 = pointOnCircle(center, center, outerTick, deg);
    const p2 = pointOnCircle(center, center, innerTick, deg);
    tickMarks.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, isMajor });
  }

  // Needle
  const needleLength = 76;
  const needleTail = 5;
  const tip = pointOnCircle(center, center, needleLength, angle);
  const base1 = pointOnCircle(center, center, -needleTail, angle + 90);
  const base2 = pointOnCircle(center, center, -needleTail, angle - 90);
  const needlePoints = `${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`;

  // Format value with one decimal
  const displayValue = clamped.toFixed(1);

  return (
    <div className="flex justify-center items-center" style={{ background: 'transparent' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer bezel */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="#c0c0c0"
          strokeWidth={bezelWidth}
          opacity={0.9}
        />

        {/* Inner face – white */}
        <circle cx={center} cy={center} r={innerRadius} fill="#ffffff" />

        {/* Red zone (Bear) */}
        <path
          d={createArcPath(redStart, redEnd, bandRadius)}
          fill="none"
          stroke="#dc2626"
          strokeWidth={bandWidth}
          strokeLinecap="butt"
        />

        {/* Blue zone (Bull) */}
        <path
          d={createArcPath(blueStart, blueEnd, bandRadius)}
          fill="none"
          stroke="#2563eb"
          strokeWidth={bandWidth}
          strokeLinecap="butt"
        />

        {/* Tick marks */}
        {tickMarks.map((tick, idx) => (
          <line
            key={idx}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="#000"
            strokeWidth={tick.isMajor ? 2 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* Value at 6 o'clock */}
        <text x={center} y={size - 40} textAnchor="middle" fontSize="17" fontWeight="bold" fill="#000">
          {displayValue}%
        </text>

        {/* Needle */}
        <polygon points={needlePoints} fill="#ff6b35" stroke="#cc5500" strokeWidth="1" />

        {/* Hub */}
        <circle cx={center} cy={center} r={12} fill="#1e40af" stroke="#ffffff" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default EcoSurpriseGauge;