import { ImageResponse } from "next/og";

export const alt = "SAM — Study Areas Milan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Immagine OG di default (convenzione file di Next.js): usata per la home e
// per ogni pagina che non la sovrascrive con una propria foto (vedi
// generateMetadata in app/spaces/[id] e app/work/spaces/[id]).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "#1F4D3D",
          backgroundImage: "linear-gradient(135deg, #1F4D3D 0%, #4a6358 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120 }}>☕📚💻</div>
        <div style={{ fontSize: 88, fontWeight: 700, color: "#FBF8F2" }}>SAM</div>
        <div style={{ fontSize: 36, color: "#F4E9D7" }}>
          Dove studiare e lavorare a Milano
        </div>
      </div>
    ),
    { ...size }
  );
}
