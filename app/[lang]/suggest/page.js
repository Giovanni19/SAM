import SuggestForm from "@/components/SuggestForm";
import { getDictionary, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  return { title: getDictionary(params.lang).suggest.metaTitle };
}

export default function SuggestPage({ params }) {
  const t = getDictionary(params.lang);

  return (
    <div className="container-sam max-w-2xl py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.suggest.title}</h1>
      <p className="mt-2 text-sm text-sam-brown/90">{t.suggest.subtitle}</p>
      <div className="mt-6">
        <SuggestForm />
      </div>
    </div>
  );
}
