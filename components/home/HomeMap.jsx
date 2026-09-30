"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { typeMeta, getAmenities, distanceKm, getTypes } from "@/lib/utils";
import { CAMPUSES, walkingMinutes } from "@/lib/campuses";
import SpaceImage from "@/components/SpaceImage";
import OpenNowBadge from "@/components/OpenNowBadge";
import { useFavorites } from "@/lib/useFavorites";
import { useAuthPrompt } from "@/components/AuthPrompt";
import { useI18n } from "@/components/I18nProvider";

// Leaflet usa `window`: la mappa si carica solo lato client. La lista invece
// è renderizzata anche sul server, così Google legge nomi e zone degli spazi.
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-sam-cream/60" />,
});

// Telefono: il pannello si aggancia a tre altezze. Da aperto lascia scoperti
// i filtri in alto, così si può cambiare campus senza richiuderlo.
const PEEK_PX = 132;
const TOP_CONTROLS_PX = 124;
// Desktop: larghezza del pannello laterale + margine, per centrare la mappa
// nella parte che resta visibile.
const DESKTOP_PANEL_PX = 440;
const NEXT_SHEET = { peek: "half", half: "full", full: "peek" };

export default function HomeMap({ spaces, featuredIds = [] }) {
  const { t, href } = useI18n();
  const { isLoggedIn } = useFavorites();
  const { show } = useAuthPrompt();

  const [refId, setRefId] = useState("");
  const [userPos, setUserPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [type, setType] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [rootH, setRootH] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sheet, setSheet] = useState("half");
  const [dragH, setDragH] = useState(null);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setRootH(entry.contentRect.height));
    ro.observe(rootRef.current);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => setIsDesktop(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  // Selezionando un pin l'anteprima compare in cima alla lista: riportiamola in vista.
  useEffect(() => {
    if (selectedId) listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedId]);

  const snaps = rootH
    ? { peek: PEEK_PX, half: Math.round(rootH * 0.5), full: Math.max(PEEK_PX, rootH - TOP_CONTROLS_PX) }
    : null;
  const sheetPx = dragH ?? snaps?.[sheet] ?? null;

  const ref = useMemo(() => {
    if (refId === "me") {
      return userPos ? { lat: userPos[0], lng: userPos[1], label: t.home.youAreHere, kind: "me" } : null;
    }
    const campus = CAMPUSES.find((c) => c.id === refId);
    return campus ? { lat: campus.lat, lng: campus.lng, label: campus.name, kind: "campus" } : null;
  }, [refId, userPos, t]);

  const types = useMemo(() => getTypes(spaces), [spaces]);

  // Con un punto di riferimento: dal più vicino. Senza: prima la vetrina
  // della settimana (vedi lib/featured.js), poi gli altri in ordine di nome.
  const list = useMemo(() => {
    const byType = type ? spaces.filter((s) => s.type === type) : spaces;
    if (ref) {
      return byType
        .map((s) => ({ ...s, dist: distanceKm([ref.lat, ref.lng], [s.lat, s.lng]) }))
        .sort((a, b) => a.dist - b.dist);
    }
    const rank = new Map(featuredIds.map((id, i) => [id, i]));
    return [...byType].sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9));
  }, [spaces, type, ref, featuredIds]);

  const selected = list.find((s) => s.id === selectedId) || null;

  const distanceLabel = (s) => {
    if (s.dist == null) return null;
    const min = walkingMinutes(s.dist);
    return min <= 30 ? t.home.walk(min) : t.home.far(s.dist.toFixed(1));
  };

  // Con un campus scelto contiamo solo quelli dentro il cerchio della mappa
  // (1 km ≈ 15 minuti a piedi); la lista sotto continua con i più lontani.
  const countLabel = ref
    ? t.home.countNear(
        list.filter((s) => walkingMinutes(s.dist) <= 15).length,
        ref.kind === "me" ? t.home.you : ref.label
      )
    : t.home.count(list.length);

  function onRefChange(value) {
    // "Vicino a…" è riservato agli utenti registrati.
    if (value && !isLoggedIn) {
      show(t.home.loginForNear);
      return;
    }
    setSelectedId(null);
    if (value !== "me") {
      setRefId(value);
      setGeoStatus("idle");
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setRefId("me");
        setGeoStatus("idle");
      },
      (err) => setGeoStatus(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onTypeChange(value) {
    if (value && !isLoggedIn) {
      show(t.authPrompt.filters);
      return;
    }
    setSelectedId(null);
    setType(value);
  }

  function selectPin(id) {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next) setSheet("half");
  }

  // Trascinamento del pannello (solo telefono). Un tocco senza trascinare
  // lo fa scorrere alla posizione successiva, come la tastiera (onClick).
  const drag = useRef(null);
  const suppressClick = useRef(false);

  function onHandleDown(e) {
    suppressClick.current = false;
    if (!snaps) return;
    drag.current = { y: e.clientY, h: sheetPx, last: null, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandleMove(e) {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 5) d.moved = true;
    if (!d.moved) return;
    d.last = Math.min(snaps.full, Math.max(snaps.peek, d.h + dy));
    setDragH(d.last);
  }
  function onHandleUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    const h = d.last ?? d.h;
    const nearest = Object.keys(snaps).reduce((best, k) =>
      Math.abs(snaps[k] - h) < Math.abs(snaps[best] - h) ? k : best
    );
    setSheet(nearest);
    setDragH(null);
  }
  function onHandleClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setSheet((s) => NEXT_SHEET[s]);
  }

  const controls = (floating) => (
    <Controls
      floating={floating}
      refId={refId}
      onRefChange={onRefChange}
      geoStatus={geoStatus}
      type={type}
      types={types}
      onTypeChange={onTypeChange}
      isLoggedIn={isLoggedIn}
    />
  );

  return (
    <div ref={rootRef} className="relative isolate h-[calc(100dvh-4rem-1px)] overflow-hidden">
      <div className="sam-home-map absolute inset-0">
        <LeafletMap
          spaces={list}
          selectedId={selectedId}
          onSelect={selectPin}
          refPoint={ref}
          inset={isDesktop ? { left: DESKTOP_PANEL_PX } : { bottom: snaps?.half ?? 0 }}
          zoomPosition={isDesktop ? "topright" : null}
          attributionPosition="topright"
        />
      </div>

      {/* Telefono: filtri sospesi sopra la mappa */}
      <div className="absolute inset-x-3 top-3 z-[1001] md:hidden">{controls(true)}</div>

      {/* Telefono: pannello dal basso · Desktop: pannello laterale */}
      <section
        aria-label={countLabel}
        className={`absolute inset-x-0 bottom-0 z-[1002] flex h-[var(--sheet-h)] flex-col rounded-t-3xl bg-sam-paper shadow-[0_-8px_28px_-6px_rgba(0,0,0,0.22)] md:inset-x-auto md:bottom-5 md:left-5 md:top-5 md:h-auto md:w-[400px] md:rounded-3xl md:shadow-card-hover ${
          dragH == null ? "transition-[height] duration-300 ease-out" : ""
        }`}
        style={{ "--sheet-h": sheetPx != null ? `${sheetPx}px` : "50%" }}
      >
        <button
          type="button"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          onClick={onHandleClick}
          aria-label={sheet === "full" ? t.home.collapseList : t.home.expandList}
          aria-expanded={sheet !== "peek"}
          className="flex w-full shrink-0 touch-none flex-col items-center gap-2 px-5 pb-3 pt-2.5 md:hidden"
        >
          <span className="h-1.5 w-11 rounded-full bg-sam-brown/20" />
          <span className="flex w-full items-baseline justify-between gap-3">
            <span className="font-display text-base font-bold text-sam-green">{countLabel}</span>
            <span aria-hidden className="text-sm font-bold text-sam-muted">
              {sheet === "full" ? "↓" : "↑"}
            </span>
          </span>
        </button>

        <div className="sr-only md:not-sr-only md:shrink-0 md:px-5 md:pt-5">
          <h1 className="font-display text-xl font-bold leading-tight text-sam-green">{t.home.title}</h1>
          <p className="mt-1 text-xs text-sam-muted">{t.home.subtitle(spaces.length)}</p>
        </div>
        <div className="hidden shrink-0 border-b border-sam-cream px-5 pb-3 pt-4 md:block">
          {controls(false)}
          <p className="mt-3 font-display text-sm font-semibold text-sam-green">{countLabel}</p>
        </div>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1 md:px-5 md:pt-3"
        >
          {selected && (
            <SelectedPreview
              space={selected}
              distanceLabel={distanceLabel(selected)}
              onClose={() => setSelectedId(null)}
            />
          )}

          <ul className="space-y-2">
            {list.map((s) => (
              <SpaceRow key={s.id} space={s} distanceLabel={distanceLabel(s)} />
            ))}
          </ul>

          <div className="mt-5 space-y-3 border-t border-sam-cream pt-4 text-sm">
            <Link href={href("/suggest")} className="btn-outline w-full">
              {t.suggest.cta}
            </Link>
            <Link href={href("/spaces")} className="block font-semibold text-sam-green hover:underline">
              {t.home.allWithFilters}
            </Link>
            <Link href={href("/work")} className="block font-semibold text-sam-work hover:underline">
              {t.home.crossCta}
            </Link>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-sam-muted">
              <a href="mailto:info@studyareasmilan.it" className="hover:text-sam-green">info@studyareasmilan.it</a>
              <Link href={href("/privacy")} className="hover:text-sam-green">{t.footer.privacyShort}</Link>
              <Link href={href("/cookie")} className="hover:text-sam-green">{t.footer.cookieShort}</Link>
              <span>© {new Date().getFullYear()} SAM — Study Areas Milan</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Controls({ floating, refId, onRefChange, geoStatus, type, types, onTypeChange, isLoggedIn }) {
  const { t } = useI18n();
  const geoMsg = { loading: t.map.locating, denied: t.map.denied, error: t.map.error }[geoStatus];

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`flex h-12 items-center gap-2 rounded-full bg-white pl-4 pr-2 focus-within:ring-2 focus-within:ring-sam-yellow ${
          floating ? "shadow-card-hover" : "border-2 border-sam-green"
        }`}
      >
        <span className="whitespace-nowrap text-sm font-bold text-sam-green">{t.home.nearLabel}</span>
        <select
          value={refId}
          onChange={(e) => onRefChange(e.target.value)}
          className="h-11 min-w-0 flex-1 cursor-pointer bg-transparent text-[15px] font-semibold text-sam-brown focus:outline-none"
        >
          <option value="">{t.home.allMilan}</option>
          <option value="me">{t.home.myPosition}</option>
          <optgroup label={t.home.campuses}>
            {CAMPUSES.map((c) => (
              <option key={c.id} value={c.id}>
                🎓 {c.name}
              </option>
            ))}
          </optgroup>
        </select>
        {!isLoggedIn && (
          <span className="shrink-0 rounded-full bg-sam-cream px-2 py-1 text-[11px] font-bold text-sam-brown">
            🔒 {t.home.membersOnly}
          </span>
        )}
      </label>

      {geoMsg && (
        <p className={`rounded-xl bg-white px-3 py-2 text-xs font-semibold ${geoStatus === "loading" ? "text-sam-green" : "text-sam-coral"} ${floating ? "shadow-card" : ""}`}>
          {geoMsg}
        </p>
      )}

      <div className={`flex gap-2 ${floating ? "-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "flex-wrap"}`}>
        {["", ...types].map((value) => {
          const active = type === value;
          const meta = value ? typeMeta(value, t) : null;
          return (
            <button
              key={value || "all"}
              type="button"
              onClick={() => onTypeChange(value)}
              aria-pressed={active}
              className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-[13px] font-bold transition ${
                active
                  ? "border-sam-green bg-sam-green text-sam-paper"
                  : "border-sam-cream bg-white text-sam-brown hover:border-sam-green/40"
              } ${floating ? "shadow-card" : ""}`}
            >
              {meta ? `${meta.emoji} ${meta.label}` : t.home.allTypes}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Thumb({ space, className }) {
  const meta = typeMeta(space.type);
  const fallback = (
    <div className={`flex shrink-0 items-center justify-center rounded-xl bg-sam-cream text-2xl ${className}`}>
      {meta.emoji}
    </div>
  );
  return (
    <SpaceImage
      src={space.image}
      alt=""
      loading="lazy"
      className={`shrink-0 rounded-xl object-cover ${className}`}
      fallback={fallback}
    />
  );
}

function DistanceChip({ label }) {
  return (
    <span className="rounded-full bg-sam-yellow/25 px-2 py-0.5 text-[11px] font-bold text-sam-green">{label}</span>
  );
}

function SpaceRow({ space, distanceLabel }) {
  const { t, href } = useI18n();
  const amenity = getAmenities(space, t)[0];

  return (
    <li>
      <Link
        href={href(`/spaces/${space.id}`)}
        className="flex items-center gap-3 rounded-2xl border border-sam-cream bg-white p-2.5 transition hover:border-sam-green/40 hover:shadow-card"
      >
        <Thumb space={space} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-display text-[15px] font-semibold text-sam-green">{space.name}</span>
            {space.rating != null && (
              <span className="shrink-0 text-xs font-bold text-sam-brown">★ {space.rating}</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-sam-muted">
            <span className="truncate">{space.zone}</span>
            <OpenNowBadge hours={space.hours} size="sm" />
          </div>
          {(distanceLabel || amenity) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {distanceLabel && <DistanceChip label={distanceLabel} />}
              {amenity && (
                <span className="rounded-full bg-sam-cream px-2 py-0.5 text-[11px] text-sam-brown">
                  {amenity.icon} {amenity.label}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function SelectedPreview({ space, distanceLabel, onClose }) {
  const { t, href } = useI18n();
  const meta = typeMeta(space.type, t);
  const amenities = getAmenities(space, t).slice(0, 3);

  return (
    <div className="mb-3 rounded-2xl border-2 border-sam-green bg-white p-3">
      <div className="flex gap-3">
        <Thumb space={space} className="h-20 w-20" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-base font-bold leading-tight text-sam-green">{space.name}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.map.closePreview}
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sam-muted hover:bg-sam-cream"
            >
              ✕
            </button>
          </div>
          <p className="mt-0.5 text-xs text-sam-muted">
            {meta.emoji} {meta.label} · {space.zone}
            {space.rating != null && ` · ★ ${space.rating}`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <OpenNowBadge hours={space.hours} size="sm" />
            {distanceLabel && <DistanceChip label={distanceLabel} />}
          </div>
        </div>
      </div>

      {space.accessNote && (
        <p className="mt-2 rounded-xl border border-sam-yellow/60 bg-sam-yellow/15 p-2 text-xs font-medium text-sam-brown">
          ⚠️ <span className="font-semibold">{t.detail.warning}</span>
          {space.accessNote}
        </p>
      )}

      {amenities.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-sam-brown/80">
          {amenities.map((a) => (
            <li key={a.key}>
              {a.icon} {a.label}
            </li>
          ))}
        </ul>
      )}

      <Link href={href(`/spaces/${space.id}`)} className="btn-primary mt-3 w-full">
        {t.map.viewDetails}
      </Link>
    </div>
  );
}
