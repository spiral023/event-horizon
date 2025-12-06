import { QROnboarding } from '@/features/auth/QROnboarding';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRScan = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <QROnboarding mode="scan" />
    </div>
  );
};

export default QRScan;
