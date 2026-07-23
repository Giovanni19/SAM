import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import { isStudySpace, displayType } from "@/lib/utils";
import SpaceDetail from "@/components/SpaceDetail";

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // SAM non mostra i coworking puri: i loro dettagli vivono sotto /work/spaces.
  return spaces.filter(isStudySpace).map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }) {
  const space = await getSpaceById(params.id);
  return { title: space ? `${space.name} — SAM` : "Spazio non trovato — SAM" };
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
