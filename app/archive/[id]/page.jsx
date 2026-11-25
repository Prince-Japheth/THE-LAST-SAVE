import Laboratory from "../../../components/Laboratory";

export function generateStaticParams() {
  return [
    { id: "SIGNAL.PCX" },
    { id: "STARLOG.DBF" },
    { id: "LETTER.RTF" },
    { id: "NIGHT.ANS" },
    { id: "README.TXT" },
  ];
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id || "");
  return {
    title: `${decoded} — Haunted Archive · THE LAST SAVE`,
    description: `Inspect and recover artifact ${decoded} in the 1996 Mira Observatory Archive.`,
  };
}

export default async function ArchiveItemPage({ params }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id || "");
  return <Laboratory initialArtifact={decoded} />;
}
