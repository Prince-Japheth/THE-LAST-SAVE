import Laboratory from "../../components/Laboratory";

export const metadata = {
  title: "Field Notes · THE LAST SAVE",
  description:
    "Field guide to the digital afterlife: technical specs, file provenance, and retro archaeology notes.",
};

export default function NotesPage() {
  return <Laboratory initialNotes={true} />;
}
