import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Scan, CheckCircle, Copy, Share2, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";
import { generateId } from "@/utils/storage";
import { toast } from "sonner";

interface QROnboardingProps {
  mode: 'create' | 'scan';
}

export const QROnboarding = ({ mode }: QROnboardingProps) => {
  const [token, setToken] = useState('');
  const [scanned, setScanned] = useState(false);
  const [name, setName] = useState('');
  const [cameraSupported, setCameraSupported] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setDeptCode, setUser, deptCode } = useAppStore();

  const generatedCode = deptCode || 'TEAM-' + generateId().slice(0, 6).toUpperCase();
  const appOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://event-horizon.sp23.online';
  const qrValue = `${appOrigin}/qr-scan?code=${generatedCode}`;

  const normalizeDeptCode = (code: string) => {
    const trimmed = code.trim();
    // Try parsing full URLs (e.g., https://.../qr-scan?code=IN-1234)
    try {
      const url = new URL(trimmed);
      const paramCode = url.searchParams.get('code');
      if (paramCode) {
        return paramCode.toUpperCase();
      }
    } catch {
      /* not a URL */
    }
    const upper = trimmed.toUpperCase();
    if (upper.includes('TEAMVOTE://JOIN/')) {
      return upper.split('TEAMVOTE://JOIN/')[1] || upper;
    }
    if (upper.startsWith('TEAMVOTE://')) {
      return upper.replace('TEAMVOTE://', '');
    }
    if (upper.includes('/')) {
      const parts = upper.split('/');
      return parts[parts.length - 1] || upper;
    }
    return upper;
  };

  const parsedDeepLink = useMemo(() => {
    const code = token || searchParams.get('code') || '';
    if (!code) return null;
    return normalizeDeptCode(code);
  }, [token, searchParams]);

  const joinWithCode = (code: string) => {
    const normalized = normalizeDeptCode(code);
    setDeptCode(normalized);
    setUser({
      id: generateId(),
      name: name || 'Team Member',
      dept_code: normalized,
      hobbies: [],
      history: { liked_categories: [] },
      super_likes_remaining: 1,
    });
    navigate('/dashboard');
  };

  const handleScan = () => {
    // Simulate QR scan
    setScanned(true);
    setTimeout(() => {
      joinWithCode(generatedCode);
    }, 1500);
  };

  const handleTokenSubmit = () => {
    const code = parsedDeepLink;
    if (code && code.length >= 4) {
      joinWithCode(code);
    }
  };

  // Auto-join via ?code=TEAM-XXXX
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && code.length >= 4) {
      setToken(code);
      setTimeout(() => {
        const parsed = normalizeDeptCode(code);
        if (parsed) {
          joinWithCode(parsed);
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Check camera support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(true);
    }
  }, []);

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

              {cameraSupported ? (
                <div className="rounded-2xl overflow-hidden border border-border bg-secondary/30">
                  <QrScanner
                    constraints={{ facingMode: 'environment' }}
                    containerStyle={{ width: '100%', height: '260px' }}
                    videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onDecode={(result) => {
                      if (result) {
                        setScanned(true);
                        const normalized = normalizeDeptCode(result);
                        setToken(normalized);
                        joinWithCode(normalized);
                      }
                    }}
                    onError={(error) => {
                      console.error('QR scan error', error);
                      toast.error('Kamera/Scan fehlgeschlagen. Bitte Code manuell eingeben.');
                    }}
                  />
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="aspect-square max-h-64 mx-auto bg-secondary/50 rounded-2xl border-2 border-dashed border-border flex items-center justify-center"
                  onClick={handleScan}
                >
                  <div className="text-center p-6">
                    <Scan className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Tippe hier, um den QR-Code zu scannen
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Falls deine Kamera blockiert ist: Code unten manuell einfügen.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deep-Link: teamvote://join/TEAM-XXXX
                    </p>
                  </div>
                </motion.div>
              )}

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

              {!cameraSupported && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CameraOff className="w-4 h-4" />
                  Kamera-Support erfordert https oder localhost. Nutze den Code/Link oben.
                </div>
              )}
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
