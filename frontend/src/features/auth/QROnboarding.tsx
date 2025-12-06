import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Scan, CheckCircle, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { generateId } from '@/utils/storage';
import { toast } from 'sonner';

interface QROnboardingProps {
  mode: 'create' | 'scan';
}

export const QROnboarding = ({ mode }: QROnboardingProps) => {
  const [token, setToken] = useState('');
  const [scanned, setScanned] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { setDeptCode, setUser, deptCode } = useAppStore();

  const generatedCode = deptCode || 'TEAM-' + generateId().slice(0, 6).toUpperCase();
  const qrValue = `teamvote://join/${generatedCode}`;

  const handleScan = () => {
    // Simulate QR scan
    setScanned(true);
    setTimeout(() => {
      setDeptCode(generatedCode);
      setUser({
        id: generateId(),
        name: name || 'Team Member',
        dept_code: generatedCode,
        hobbies: [],
        history: { liked_categories: [] },
        super_likes_remaining: 1,
      });
      navigate('/dashboard');
    }, 1500);
  };

  const handleTokenSubmit = () => {
    if (token.length >= 4) {
      setDeptCode(token.toUpperCase());
      setUser({
        id: generateId(),
        name: name || 'Team Member',
        dept_code: token.toUpperCase(),
        hobbies: [],
        history: { liked_categories: [] },
        super_likes_remaining: 1,
      });
      navigate('/dashboard');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code kopiert!');
  };

  if (mode === 'create') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card variant="elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">QR-Code für dein Team</CardTitle>
            <CardDescription>
              Teile diesen Code, damit andere beitreten können
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-background rounded-2xl"
              >
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin
                  className="rounded-xl"
                />
              </motion.div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
              <code className="flex-1 text-center font-mono text-lg font-bold tracking-wider">
                {generatedCode}
              </code>
              <Button variant="ghost" size="icon" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyCode}>
                <Copy className="w-4 h-4" />
                Kopieren
              </Button>
              <Button variant="gradient" className="flex-1">
                <Share2 className="w-4 h-4" />
                Teilen
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card variant="elevated">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <Scan className="w-8 h-8 text-primary" />
          </motion.div>
          <CardTitle className="text-2xl">QR-Code scannen</CardTitle>
          <CardDescription>
            Scanne den QR-Code oder gib den Token manuell ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!scanned ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dein Name</label>
                <Input
                  placeholder="Max Mustermann"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="aspect-square max-h-64 mx-auto bg-secondary/50 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer"
                onClick={handleScan}
              >
                <div className="text-center p-6">
                  <Scan className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Tippe hier, um den QR-Code zu scannen
                  </p>
                </div>
              </motion.div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">oder Token eingeben</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="TEAM-XXXX"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button onClick={handleTokenSubmit} disabled={token.length < 4}>
                  Beitreten
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-20 h-20 mx-auto text-success mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Erfolgreich gescannt!</h3>
              <p className="text-muted-foreground">Du wirst weitergeleitet...</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
