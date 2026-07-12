import PremiumPdfViewer from '../common/PremiumPdfViewer';

export default function PYQPdfViewer({ subject, pdfUrl, startPage, endPage, onBack }) {
  return (
    <PremiumPdfViewer
      url={pdfUrl}
      fileName={`${subject?.label || 'PYQ'} (Pages ${startPage}–${endPage})`}
      onClose={onBack}
    />
  );
}
