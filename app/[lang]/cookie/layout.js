export const metadata = {
  title: "Cookie policy — SAM",
  description: "Quali cookie usa SAM — Study Areas Milan e perché.",
};

import { LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default function CookieLayout({ children }) {
  return children;
}
