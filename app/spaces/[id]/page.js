import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import SpaceDetail from "@/components/SpaceDetail";

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // SAM non mostra i coworking: i loro dettagli vivono sotto /work/spaces.
  return spaces.filter((s) => s.type !== "Coworking").map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }) {
  const space = await getSpaceById(params.id);
  return { title: space ? `${space.name} — SAM` : "Spazio non trovato — SAM" };
}

export default async function SpaceDetailPage({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) notFound();
  // I coworking appartengono a SAM for Work: reindirizza, così i vecchi link
  // continuano a funzionare e le due sezioni restano separate.
  if (space.type === "Coworking") redirect(`/work/spaces/${space.id}`);

  return <SpaceDetail space={space} backHref="/spaces" backLabel="← Tutti gli spazi" />;
}
