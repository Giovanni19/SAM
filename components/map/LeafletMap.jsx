"use client";

import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { typeMeta, MILAN_CENTER } from "@/lib/utils";

// Pallino bianco con bordo verde brand e l'emoji del tipo al centro.
// `dim` = altri posti quando uno è selezionato; `active` = quello selezionato.
function placeIcon(type, { dim = false, active = false } = {}) {
  const meta = typeMeta(type);
  const size = active ? 34 : 28;
  return L.divIcon({
    className: "sam-dot",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${active ? "#1F4D3D" : "#FBF8F2"};
      border:2.5px solid #1F4D3D;
      box-shadow:0 1px 4px rgba(0,0,0,.25);
      font-size:${active ? 17 : 14}px;line-height:1;
      opacity:${dim ? 0.35 : 1};
      ${active ? "transform:scale(1.05);" : ""}">
      ${meta.emoji}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Ricentra la mappa quando cambia la posizione dell'utente.
function Recenter({ pos }) {
  const map = useMap();
  if (pos) map.flyTo(pos, 14, { duration: 0.8 });
  return null;
}

// Centra dolcemente sul posto selezionato.
function FlyToSelected({ space }) {
  const map = useMap();
  if (space?.lat != null && space?.lng != null) {
    map.flyTo([space.lat, space.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }
  return null;
}

export default function LeafletMap({ spaces = [], userPos = null, selectedId = null, onSelect }) {
  const points = spaces.filter((s) => s.lat != null && s.lng != null);
  const selected = points.find((s) => s.id === selectedId) || null;

  return (
    <MapContainer
      center={userPos || MILAN_CENTER}
      zoom={userPos ? 14 : 12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {userPos && <Recenter pos={userPos} />}
      {selected && <FlyToSelected space={selected} />}

      {/* Marker posizione utente */}
      {userPos && (
        <CircleMarker
          center={userPos}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2b6cff", fillOpacity: 1 }}
        />
      )}

      {/* Marker dei posti — quando uno è selezionato, gli altri sbiadiscono */}
      {points.map((s) => {
        const active = s.id === selectedId;
        const dim = selectedId != null && !active;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            zIndexOffset={active ? 1000 : 0}
            icon={placeIcon(s.type, { dim, active })}
            eventHandlers={{ click: () => onSelect?.(s.id) }}
          />
        );
      })}
    </MapContainer>
  );
}
