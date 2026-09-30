// Campus universitari per il filtro "Vicino a…" della home. Coordinate
// dell'ingresso principale, arrotondate: servono solo a ordinare gli spazi per
// distanza, non a dare indicazioni stradali.
export const CAMPUSES = [
  { id: "bocconi", name: "Bocconi", lat: 45.4505, lng: 9.1897 },
  { id: "polimi-leonardo", name: "Polimi Leonardo", lat: 45.4781, lng: 9.2272 },
  { id: "polimi-bovisa", name: "Polimi Bovisa", lat: 45.5025, lng: 9.1563 },
  { id: "statale-centro", name: "Statale Centro", lat: 45.4602, lng: 9.1942 },
  { id: "statale-citta-studi", name: "Statale Città Studi", lat: 45.4757, lng: 9.2323 },
  { id: "cattolica", name: "Cattolica", lat: 45.4623, lng: 9.1771 },
  { id: "bicocca", name: "Bicocca", lat: 45.5137, lng: 9.2112 },
  { id: "iulm", name: "IULM", lat: 45.4494, lng: 9.1521 },
];

// Minuti a piedi da una distanza in linea d'aria: 5 km/h, con un 25% in più
// perché le strade non vanno dritte (≈ 15 min/km).
export function walkingMinutes(km) {
  return Math.max(1, Math.round(km * 15));
}
