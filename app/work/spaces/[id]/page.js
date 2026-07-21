import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import SpaceDetail from "@/components/SpaceDetail";

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // Solo i coworking hanno un dettaglio in SAM for Work.
  return spaces.filter((s) => s.type === "Coworking").map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }) {
  const space = await getSpaceById(params.id);
  return { title: space ? `${space.name} — SAM for Work` : "Coworking non trovato — SAM for Work" };
}

export default async function WorkSpaceDetailPage({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) notFound();
  // I posti da studio appartengono a SAM: reindirizza per tenere separate le sezioni.
  if (space.type !== "Coworking") redirect(`/spaces/${space.id}`);

  return (
    <div className="theme-work">
      <SpaceDetail
        space={space}
        backHref="/work/spaces"
        backLabel="← Tutti i coworking"
        amenitiesTitle="Com'è per lavorare"
      />
    </div>
  );
}
