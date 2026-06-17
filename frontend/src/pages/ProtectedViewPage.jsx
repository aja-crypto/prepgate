import { useParams } from 'react-router-dom';
import SecureDocumentViewer from '../components/common/SecureDocumentViewer';

export default function ProtectedViewPage() {
  const { id } = useParams();
  return <SecureDocumentViewer pdfId={id} onClose={() => window.history.back()} />;
}
