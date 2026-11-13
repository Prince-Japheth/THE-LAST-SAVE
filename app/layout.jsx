import "./globals.css";
import "./upgrade.css";
import "./halloween.css";
import "./haunting.css";
import "./grand.css";
import "./engine.css";
import RecordingCursor from "../components/RecordingCursor";
export const metadata = {
  title: "THE LAST SAVE — The Haunted Archive",
  description:
    "A local-first archaeology lab for forgotten digital artifacts. Decode PCX, dBASE, RTF and ANSI files without uploading them.",
  authors: [{ name: "Japheth", url: "https://yafetport.vercel.app/" }],
  creator: "Japheth",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "THE LAST SAVE — The Haunted Archive",
    description:
      "A local-first archaeology lab for forgotten digital artifacts. Decode PCX, dBASE, RTF and ANSI files without uploading them.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "THE LAST SAVE — The Haunted Archive",
    description:
      "A local-first archaeology lab for forgotten digital artifacts. Decode PCX, dBASE, RTF and ANSI files without uploading them.",
  },
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}<RecordingCursor/></body>
    </html>
  );
}
