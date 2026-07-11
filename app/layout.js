import "@/styles/globals.css";
import { Poppins, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoritesProvider from "@/components/FavoritesProvider";
import AuthPromptProvider from "@/components/AuthPrompt";

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
        <FavoritesProvider>
          <AuthPromptProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthPromptProvider>
        </FavoritesProvider>
        <Analytics />
      </body>
    </html>
  );
}
