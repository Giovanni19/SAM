import "@/styles/globals.css";
import { Poppins, Nunito } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  title: "SAM — Study Areas Milano",
  description:
    "Trova i migliori spazi studio, caffetterie, biblioteche e coworking a Milano dove studiare e lavorare.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={`${poppins.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
