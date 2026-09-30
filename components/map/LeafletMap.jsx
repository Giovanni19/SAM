"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, CircleMarker, Circle, ZoomControl, AttributionControl, useMap,
} from "react-leaflet";
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

// Riquadro giallo con 🎓 e il nome del campus sotto.
function campusIcon(label) {
  return L.divIcon({
    className: "sam-campus",
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;
        border-radius:12px;background:#F2B441;border:2px solid #fff;
        box-shadow:0 3px 10px rgba(0,0,0,.25);font-size:19px;line-height:1;">🎓</div>
      <span style="white-space:nowrap;background:#1F4D3D;color:#FBF8F2;font:800 11px/1.4 var(--font-nunito),sans-serif;
        padding:2px 8px;border-radius:999px;">${label}</span>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

// Vola su un punto tenendo conto di cosa copre la mappa (pannello a sinistra
// su desktop, pannello dal basso su telefono): il punto finisce al centro
// della parte di mappa ancora visibile, non sotto il pannello.
function flyWithInset(map, latlng, zoom, inset, duration) {
  const { left = 0, bottom = 0 } = inset || {};
  const point = map.project(latlng, zoom).add([-left / 2, bottom / 2]);
  map.flyTo(map.unproject(point, zoom), zoom, { duration });
}

// Vola sul punto solo quando cambia (non a ogni render: la mappa si
// ridisegna spesso, per esempio mentre si trascina il pannello).
function FlyTo({ lat, lng, zoom, inset, duration }) {
  const map = useMap();
  const insetRef = useRef(inset);
  insetRef.current = inset;
  useEffect(() => {
    if (lat == null || lng == null) return;
    flyWithInset(map, [lat, lng], zoom ?? Math.max(map.getZoom(), 15), insetRef.current, duration);
  }, [map, lat, lng, zoom, duration]);
  return null;
}

/**
 * @param refPoint  Punto di riferimento opzionale (campus o posizione utente):
 *                  {lat, lng, label, kind: "campus" | "me"}. Disegna il marker,
 *                  un cerchio di ~15 minuti a piedi e ci vola sopra.
 * @param inset     {left, bottom} in px coperti da pannelli sopra la mappa.
 * @param zoomPosition  Angolo dei tasti +/−, o null per nasconderli (pinch).
 */
export default function LeafletMap({
  spaces = [],
  userPos = null,
  selectedId = null,
  onSelect,
  refPoint = null,
  inset = null,
  zoomPosition = "topleft",
  attributionPosition = "bottomright",
}) {
  const points = spaces.filter((s) => s.lat != null && s.lng != null);
  const selected = points.find((s) => s.id === selectedId) || null;

  return (
    <MapContainer
      center={userPos || MILAN_CENTER}
      zoom={userPos ? 14 : 12}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={`https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
      />
      {zoomPosition && <ZoomControl key={`zoom-${zoomPosition}`} position={zoomPosition} />}
      <AttributionControl key={`attr-${attributionPosition}`} position={attributionPosition} />

      {userPos && <FlyTo lat={userPos[0]} lng={userPos[1]} zoom={14} inset={inset} duration={0.8} />}
      {refPoint && <FlyTo lat={refPoint.lat} lng={refPoint.lng} zoom={14} inset={inset} duration={0.8} />}
      {selected && <FlyTo lat={selected.lat} lng={selected.lng} inset={inset} duration={0.6} />}

      {/* Marker posizione utente */}
      {userPos && (
        <CircleMarker
          center={userPos}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2b6cff", fillOpacity: 1 }}
        />
      )}

      {/* Punto di riferimento: cerchio di 1 km (~15 min a piedi) + marker */}
      {refPoint && (
        <Circle
          center={[refPoint.lat, refPoint.lng]}
          radius={1000}
          interactive={false}
          pathOptions={{ color: "#D69628", weight: 2, dashArray: "6 6", fillColor: "#F2B441", fillOpacity: 0.1 }}
        />
      )}
      {refPoint?.kind === "me" && (
        <CircleMarker
          center={[refPoint.lat, refPoint.lng]}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2b6cff", fillOpacity: 1 }}
        />
      )}
      {refPoint?.kind === "campus" && (
        <Marker
          position={[refPoint.lat, refPoint.lng]}
          icon={campusIcon(refPoint.label)}
          interactive={false}
          zIndexOffset={500}
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
