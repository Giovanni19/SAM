import "@/styles/globals.css";
import { Poppins, Nunito } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoritesProvider from "@/components/FavoritesProvider";
import AuthPromptProvider from "@/components/AuthPrompt";
import CookieConsentBanner from "@/components/CookieConsentBanner";

const GTM_ID = "GTM-5FKRTS5L";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://www.studyareasmilan.it"),
  title: "SAM — Study Areas Milan",
  description:
    "Trova i migliori spazi studio, caffetterie, biblioteche e coworking a Milano dove studiare e lavorare.",
};

// Ottimizzazione per dispositivo (telefono / iPad / desktop):
//  - width=device-width + initialScale: scala corretta su ogni schermo
//  - viewportFit "cover": il contenuto arriva ai bordi sugli iPhone col notch,
//    poi .container-sam usa le safe-area per non finirci sotto (vedi globals.css)
//  - themeColor: colora la barra del browser mobile in tinta con lo sfondo
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF8F2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={`${poppins.variable} ${nunito.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {/* Consent Mode v2: tutti i segnali partono 'denied'. GTM (sotto) legge
            questo stato subito dopo l'init, quindi nessun tag di analytics/
            marketing può scattare finché l'utente non accetta dal banner.
            strategy="beforeInteractive" fa iniettare entrambi da Next.js in
            <head>, in ordine, prima che la pagina diventi interattiva. */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});`}
        </Script>
        <Script id="gtm" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <FavoritesProvider>
          <AuthPromptProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthPromptProvider>
        </FavoritesProvider>
        <CookieConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
