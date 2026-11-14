import React from "react";

export interface TechnicalCalloutsProps {
  explodeProgress: number;
  powerOn?: boolean;
}

export const TechnicalCallouts: React.FC<TechnicalCalloutsProps> = ({
  explodeProgress,
  powerOn = true,
}) => {
  // Hanya tampilkan ketika mode bedah mulai terbuka
  const isVisible = explodeProgress > 0.05;
  const opacity = Math.min(1, (explodeProgress - 0.05) / 0.35);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        opacity,
        transition: "opacity 0.2s ease-out",
      }}
    >
      {/* 1. Header Metadata Mode Bedah (Pojok Kiri Atas) */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 48,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#18181B",
            color: "#FFFFFF",
            padding: "6px 14px",
            borderRadius: 9999,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.08em",
            width: "fit-content",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: powerOn ? "#22C55E" : "#EF4444",
              display: "inline-block",
              boxShadow: powerOn ? "0 0 8px #22C55E" : "none",
            }}
          />
          SCHEMATIC BREAKDOWN • 4-GANG POWER STRIP
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            color: "#18181B",
            letterSpacing: "-0.02em",
          }}
        >
          Anatomi Prosedural Stop Kontak
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: "#52525B",
          }}
        >
          Mode Bedah 3D CSG: Tutup polikarbonat terangkat, mengekspos rel kuningan internal.
        </p>
      </div>

      {/* 2. Kartu Spesifikasi Rel Konduktor Kuningan (Kanan Atas) */}
      <div
        style={{
          position: "absolute",
          top: 48,
          right: 48,
          width: 320,
          backgroundColor: "rgba(24, 24, 27, 0.94)",
          color: "#FFFFFF",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: "#A1A1AA",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            KOMPONEN KONDUKTOR
          </span>
          <span
            style={{
              backgroundColor: "#FACC15",
              color: "#18181B",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            H62 BRASS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: "#D49B28",
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Rel Fasa (Live L)</span>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#E4E4E7",
              }}
            >
              250V ~ 10A Max
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: "#3B82F6",
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Rel Netral (N)</span>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#E4E4E7",
              }}
            >
              0V Return Path
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: "#22C55E",
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Rel Arde (Earth PE)</span>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#E4E4E7",
              }}
            >
              Ground Shock Proof
            </span>
          </div>
        </div>
      </div>

      {/* 3. Kartu Penjelasan Mekanisme Jepit & Bodi CSG (Kiri Bawah) */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
          width: 360,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          color: "#18181B",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
          border: "1px solid #E4E4E7",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#FEF08A",
            color: "#854D0E",
            fontSize: 11,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 8,
          }}
        >
          FITUR TEKNIS PROSEDURAL
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          Konstruksi CSG & Penjepit Pegas Daun Ganda
        </div>
        <div style={{ fontSize: 12, color: "#52525B", lineHeight: 1.5 }}>
          Bodi RoundedBox dipotong 4 silinder CSG berkedalaman presisi. Di dalamnya terpasang
          sepasang plat penjepit elastis kuningan per soket untuk mencegah kelonggaran dan
          loncatan bunga api (*arcing*).
        </div>
      </div>

      {/* 4. Telemetri Ketinggian Lift Mode Bedah (Kanan Bawah) */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 12,
          backgroundColor: "#18181B",
          color: "#FFFFFF",
          padding: "12px 20px",
          borderRadius: 9999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
        }}
      >
        <span style={{ color: "#A1A1AA" }}>ELEVASI TUTUP:</span>
        <span style={{ color: "#FACC15", fontWeight: 800 }}>
          {(explodeProgress * 4.2).toFixed(2)} unit
        </span>
        <span style={{ color: "#52525B" }}>|</span>
        <span style={{ color: "#A1A1AA" }}>OPASITAS:</span>
        <span style={{ color: "#38BDF8", fontWeight: 800 }}>
          {((1 - explodeProgress * (1 - 0.28)) * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
