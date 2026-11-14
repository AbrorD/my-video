import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontMono, fontSans, HeaderBadge, InfoPill, MainHeadline } from "../components/Typography";

export const Scene3Pressure: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for main gauge
  const sprGauge = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  // Spring for data card
  const sprCard = spring({
    frame: frame - 40,
    fps,
    config: { damping: 13, stiffness: 115 },
  });

  // Needle sweep from 0 to 75 kPa (angle -120 deg to +50 deg)
  const needleAngle = interpolate(frame, [10, 70], [-120, 50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Outward pressure arrow pulse
  const pulse = (Math.sin(frame * 0.18) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        padding: "160px 70px 0 70px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Header */}
      <div style={{ width: "100%", textAlign: "left" }}>
        <HeaderBadge category="FISIKA TEKANAN KABIN • 35.000 KAKI" delay={2} />
        <MainHeadline
          title="Beda Tekanan: Kabin Mengembang"
          highlightText="Beda Tekanan"
          highlightColor="#0284C7"
          delay={5}
          fontSize={64}
        />
        <div style={{ marginTop: "16px" }}>
          <InfoPill
            text="SIKLUS TEKANAN TINGGI (PRESSURIZATION)"
            bg="rgba(2, 132, 199, 0.12)"
            color="#0284C7"
            border="1.5px solid #0284C7"
            delay={8}
          />
        </div>
      </div>

      {/* Center Instrument: Circular Pressure Differential Gauge (Inspired by reference frame_05.png) */}
      <div
        style={{
          marginTop: "40px",
          width: "100%",
          maxWidth: "880px",
          backgroundColor: "#FFFFFF",
          border: "1.5px solid rgba(2, 132, 199, 0.18)",
          borderRadius: "28px",
          padding: "28px",
          boxShadow: "0 16px 40px rgba(2, 132, 199, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: "40px",
          opacity: interpolate(sprGauge, [0, 1], [0, 1]),
          transform: `scale(${interpolate(sprGauge, [0, 1], [0.88, 1])})`,
        }}
      >
        {/* Circular Gauge Instrument Dial */}
        <div style={{ width: "260px", height: "260px", flexShrink: 0, position: "relative" }}>
          <svg width="260" height="260" viewBox="0 0 260 260">
            {/* Dark Instrument Bezel */}
            <circle cx="130" cy="130" r="120" fill="#18181B" stroke="#3F3F46" strokeWidth="6" />

            {/* Scale Arc Track (Green to Blue to Red) */}
            <path
              d="M 50 200 A 95 95 0 1 1 210 200"
              fill="none"
              stroke="#3F3F46"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Active Pressure Arc */}
            <path
              d="M 50 200 A 95 95 0 0 1 195 95"
              fill="none"
              stroke="#0284C7"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Tick Marks */}
            {[0, 20, 40, 60, 80, 100].map((val, idx) => {
              const angle = -120 + idx * 48;
              const rad = (angle * Math.PI) / 180;
              const x1 = 130 + 82 * Math.cos(rad);
              const y1 = 130 + 82 * Math.sin(rad);
              const x2 = 130 + 94 * Math.cos(rad);
              const y2 = 130 + 94 * Math.sin(rad);
              return (
                <line
                  key={`tick-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />
              );
            })}

            {/* Metric Labels on Dial */}
            <text x="50" y="225" fill="#A1A1AA" fontFamily={fontMono} fontSize="14" fontWeight="700">
              0
            </text>
            <text x="60" y="90" fill="#A1A1AA" fontFamily={fontMono} fontSize="14" fontWeight="700">
              40
            </text>
            <text x="175" y="90" fill="#A1A1AA" fontFamily={fontMono} fontSize="14" fontWeight="700">
              80
            </text>
            <text x="180" y="225" fill="#EF4444" fontFamily={fontMono} fontSize="14" fontWeight="700">
              100
            </text>

            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 130, 130)`}>
              <line x1="130" y1="130" x2="130" y2="45" stroke="#FACC15" strokeWidth="6" strokeLinecap="round" />
              <line x1="130" y1="130" x2="130" y2="45" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Center Cap */}
            <circle cx="130" cy="130" r="16" fill="#FFFFFF" stroke="#18181B" strokeWidth="4" />
            <circle cx="130" cy="130" r="6" fill="#18181B" />
          </svg>
        </div>

        {/* Gauge Information & Readouts */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#71717A",
              textTransform: "uppercase",
            }}
          >
            TEKANAN UDARA KABIN
          </div>

          <div
            style={{
              fontFamily: fontSans,
              fontSize: "52px",
              fontWeight: 800,
              color: "#0284C7",
              marginTop: "4px",
              lineHeight: 1,
            }}
          >
            75,0 kPa
          </div>

          <div
            style={{
              marginTop: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: fontSans,
              fontSize: "20px",
              color: "#52525B",
              fontWeight: 600,
            }}
          >
            <span>Luar: 20 kPa</span>
            <span style={{ color: "#D4D4D8" }}>•</span>
            <span style={{ color: "#EF4444", fontWeight: 800 }}>
              Selisih: +55 kPa (Dorong Keluar)
            </span>
          </div>
        </div>
      </div>

      {/* Fuselage Expansion Schematic Diagram */}
      <div
        style={{
          marginTop: "30px",
          width: "100%",
          maxWidth: "880px",
          backgroundColor: "#FFFFFF",
          border: "1.5px solid rgba(24, 24, 27, 0.08)",
          borderRadius: "24px",
          padding: "24px 30px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.06)",
          opacity: interpolate(sprCard, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(sprCard, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#71717A",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          SIMULASI EFEK BALON PADA KETINGGIAN 35.000 FT
        </div>

        {/* Fuselage with expanding outward arrows */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
          {/* Schematic Graphic */}
          <svg width="340" height="120" viewBox="0 0 340 120" fill="none">
            {/* Plane cylinder cross-section */}
            <rect
              x="20"
              y="15"
              width="300"
              height="90"
              rx="45"
              fill="#F8FAFC"
              stroke="#0284C7"
              strokeWidth="3"
            />
            {/* Outward arrows */}
            <g
              transform={`scale(${1 + pulse * 0.08})`}
              style={{ transformOrigin: "170px 60px" }}
            >
              {/* Up arrow */}
              <line x1="170" y1="36" x2="170" y2="10" stroke="#0284C7" strokeWidth="4" />
              {/* Down arrow */}
              <line x1="170" y1="84" x2="170" y2="110" stroke="#0284C7" strokeWidth="4" />
              {/* Left arrow */}
              <line x1="80" y1="60" x2="40" y2="60" stroke="#0284C7" strokeWidth="4" />
              {/* Right arrow */}
              <line x1="260" y1="60" x2="300" y2="60" stroke="#0284C7" strokeWidth="4" />
            </g>
            <rect x="85" y="42" width="170" height="36" rx="8" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.5" />
            <text x="170" y="66" textAnchor="middle" fill="#0284C7" fontFamily={fontSans} fontSize="17" fontWeight="800">
              TEKANAN DALAM
            </text>
          </svg>

          {/* Explanation Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontSans, fontSize: "22px", fontWeight: 700, color: "#18181B", lineHeight: 1.3 }}>
              Dinding pesawat terus ditekan dari dalam seperti balon yang dipompa.
            </div>
            <div style={{ fontFamily: fontSans, fontSize: "17px", color: "#71717A", marginTop: "6px" }}>
              Setiap bukaan seperti jendela menahan beban tarik yang luar biasa.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
