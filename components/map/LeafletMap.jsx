"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { typeMeta, formatScore, distanceKm, formatDistance, MILAN_CENTER } from "@/lib/utils";

// Icona pin personalizzata con l'emoji del tipo di spazio.
function placeIcon(type) {
  const meta = typeMeta(type);
  return L.divIcon({
    className: "sam-pin",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:#1F4D3D;border:2px solid #FBF8F2;
      box-shadow:0 2px 6px rgba(0,0,0,.3);">
      <span style="transform:rotate(45deg);font-size:15px;">${meta.emoji}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
}

// Ricentra la mappa quando cambia la posizione dell'utente.
function Recenter({ pos }) {
  const map = useMap();
  if (pos) map.flyTo(pos, 14, { duration: 0.8 });
  return null;
}

export default function LeafletMap({ spaces = [], userPos = null }) {
  return (
    <MapContainer
      center={userPos || MILAN_CENTER}
      zoom={userPos ? 14 : 12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userPos && <Recenter pos={userPos} />}

      {/* Marker posizione utente */}
      {userPos && (
        <CircleMarker
          center={userPos}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2b6cff", fillOpacity: 1 }}
        >
          <Popup>La tua posizione</Popup>
        </CircleMarker>
      )}

      {/* Marker dei posti */}
      {spaces
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => {
          const meta = typeMeta(s.type);
          const score = formatScore(s.studyScore);
          const dist = userPos ? distanceKm(userPos, [s.lat, s.lng]) : null;
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={placeIcon(s.type)}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: "#1F4D3D" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#6b746e", margin: "2px 0 6px" }}>
                    {meta.emoji} {meta.label}
                    {s.zone ? ` · ${s.zone}` : ""}
                    {score != null ? ` · ★ ${score}/100` : ""}
                    {dist != null ? ` · ${formatDistance(dist)} da te` : ""}
                  </div>
                  <Link href={`/spaces/${s.id}`} style={{ color: "#1F4D3D", fontWeight: 600, fontSize: 13 }}>
                    Vedi dettagli →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
