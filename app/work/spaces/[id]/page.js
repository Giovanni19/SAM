import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import { isCoworking, displayType, spaceMetaDescription } from "@/lib/utils";
import SpaceDetail from "@/components/SpaceDetail";

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // I coworking hanno un dettaglio in SAM for Work, anche se hanno anche altre categorie.
  return spaces.filter(isCoworking).map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) return { title: "Coworking non trovato — SAM for Work" };

  const title = `${space.name} — SAM for Work`;
  const description = spaceMetaDescription({ ...space, type: "Coworking" });

  return {
    title,
    description,
    alternates: { canonical: `/work/spaces/${space.id}` },
    openGraph: {
      title,
      description,
      url: `/work/spaces/${space.id}`,
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

export default async function WorkSpaceDetailPage({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) notFound();
  // I posti che non sono coworking appartengono solo a SAM: reindirizza per
  // tenere separate le sezioni.
  if (!isCoworking(space)) redirect(`/spaces/${space.id}`);

  return (
    <div className="theme-work">
      <SpaceDetail
        space={{ ...space, type: displayType(space, "work") }}
        backHref="/work/spaces"
        backLabel="← Tutti i coworking"
        amenitiesTitle="Com'è per lavorare"
      />
    </div>
  );
}
