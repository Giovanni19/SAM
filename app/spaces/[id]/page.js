import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import { isStudySpace, displayType, spaceMetaDescription } from "@/lib/utils";
import SpaceDetail from "@/components/SpaceDetail";

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // SAM non mostra i coworking puri: i loro dettagli vivono sotto /work/spaces.
  return spaces.filter(isStudySpace).map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) return { title: "Spazio non trovato — SAM" };

  const title = `${space.name} — SAM`;
  const description = spaceMetaDescription(space);

  return {
    title,
    description,
    alternates: { canonical: `/spaces/${space.id}` },
    openGraph: {
      title,
      description,
      url: `/spaces/${space.id}`,
      type: "website",
      // Next.js non eredita l'opengraph-image.js del layout quando la pagina
      // definisce il proprio `openGraph`: serve un fallback esplicito.
      images: [space.image || "/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [space.image || "/opengraph-image"],
    },
  };
}

export default async function SpaceDetailPage({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) notFound();
  // I coworking puri appartengono a SAM for Work: reindirizza, così i vecchi
  // link continuano a funzionare. I posti con più categorie restano qui.
  if (!isStudySpace(space)) redirect(`/work/spaces/${space.id}`);

  return (
    <SpaceDetail
      space={{ ...space, type: displayType(space, "study") }}
      backHref="/spaces"
      backLabel="← Tutti gli spazi"
    />
  );
}
