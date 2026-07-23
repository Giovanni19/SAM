// Gestione del consenso cookie (Google Consent Mode v2). La scelta dell'utente
// è salvata in localStorage e applicata a gtag ad ogni caricamento pagina.
export const STORAGE_KEY = "sam:cookie-consent";

export function getStoredConsent() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

function pushConsentUpdate(status) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push([
    "consent",
    "update",
    {
      ad_storage: status,
      ad_user_data: status,
      ad_personalization: status,
      analytics_storage: status,
    },
  ]);
}

export function setConsent(status) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, status);
  pushConsentUpdate(status);
}

// Riapplica la scelta salvata: serve perché GTM riparte da 'denied' di default
// ad ogni page load, prima che questo script giri.
export function applyStoredConsent() {
  const stored = getStoredConsent();
  if (stored) pushConsentUpdate(stored);
  return stored;
}
