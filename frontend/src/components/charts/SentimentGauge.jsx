import React from 'react';

const SentimentGauge = ({ value = 0, min = -18, max = 18 }) => {
  // Clamp value
  const clamped = Math.min(max, Math.max(min, value));

  // Map score to angle (0° = 12 o'clock, positive clockwise)
  const angle = (clamped / 18) * 120;

  // Gauge dimensions
  const size = 300;
  const center = size / 2;
  const outerRadius = 130;
  const bezelWidth = 8;
  const innerRadius = outerRadius - bezelWidth - 4;
  const bandWidth = 20;
  const bandRadius = innerRadius - bandWidth / 2;

  // Helper to get point on circle (0° = 12 o'clock, positive clockwise)
  const pointOnCircle = (cx, cy, radius, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  // Zone boundaries (in degrees from 12 o'clock)
  const redStart = -150;
  const redEnd = -33.33;
  const blueStart = 33.33;
  const blueEnd = 150;

  // Arc path helper
  const createArcPath = (startDeg, endDeg, radius) => {
    const start = pointOnCircle(center, center, radius, startDeg);
    const end = pointOnCircle(center, center, radius, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // Generate tick marks
  const tickMarks = [];
  for (let deg = -150; deg <= 150; deg += 10) {
    const isMajor = deg % 30 === 0;
    const length = isMajor ? 12 : 6;
    const outerTick = outerRadius - bezelWidth - 2;
    const innerTick = outerTick - length;
    const p1 = pointOnCircle(center, center, outerTick, deg);
    const p2 = pointOnCircle(center, center, innerTick, deg);
    tickMarks.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, isMajor });
  }

  // Needle
  const needleLength = 100;
  const needleTail = 5;
  const tip = pointOnCircle(center, center, needleLength, angle);
  const base1 = pointOnCircle(center, center, -needleTail, angle + 90);
  const base2 = pointOnCircle(center, center, -needleTail, angle - 90);
  const needlePoints = `${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`;

  return (
    <div className="flex justify-center items-center p-2" style={{ background: 'transparent' }}>
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

        {/* Inner face */}
        <circle cx={center} cy={center} r={innerRadius} fill="#ffffff" />

        {/* Red zone */}
        <path
          d={createArcPath(redStart, redEnd, bandRadius)}
          fill="none"
          stroke="#dc2626"
          strokeWidth={bandWidth}
          strokeLinecap="butt"
        />

        {/* Blue zone */}
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

        {/* Score at 6 o'clock – moved up 5px: now y = size - 65 */}
        <text x={center} y={size - 65} textAnchor="middle" fontSize="31" fontWeight="bold" fill="#000">
          {clamped}
        </text>

        {/* Needle */}
        <polygon points={needlePoints} fill="#ff6b35" stroke="#cc5500" strokeWidth="1" />

        {/* Hub */}
        <circle cx={center} cy={center} r={16} fill="#1e40af" stroke="#ffffff" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default SentimentGauge;