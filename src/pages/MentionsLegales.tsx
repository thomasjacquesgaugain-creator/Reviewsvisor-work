import { LegalDocViewer } from "@/components/LegalDocViewer";

export default function MentionsLegales() {
  return (
    <LegalDocViewer
      docSlug="mentions-legales"
      pdfFilename="mentions-legales.pdf"
      pdfDownloadName="mentions-legales.pdf"
    />
  );
}
