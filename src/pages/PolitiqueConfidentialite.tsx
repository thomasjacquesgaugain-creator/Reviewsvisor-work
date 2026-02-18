import { LegalDocViewer } from "@/components/LegalDocViewer";

export default function PolitiqueConfidentialite() {
  return (
    <LegalDocViewer
      docSlug="politique-confidentialite"
      pdfFilename="politique-confidentialite.pdf"
      pdfDownloadName="politique-confidentialite.pdf"
    />
  );
}
