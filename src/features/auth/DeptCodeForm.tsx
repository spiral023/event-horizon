import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { generateId } from '@/utils/storage';

export const DeptCodeForm = () => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setDeptCode, setUser } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Bitte gib einen Abteilungscode ein');
      return;
    }
    
    if (!name.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }

    setDeptCode(code.toUpperCase());
    setUser({
      id: generateId(),
      name: name.trim(),
      dept_code: code.toUpperCase(),
      hobbies: [],
      history: { liked_categories: [] },
      super_likes_remaining: 1,
    });
    
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <CardTitle className="text-2xl">Team beitreten</CardTitle>
          <CardDescription>
            Gib deinen Abteilungscode ein oder scanne den QR-Code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Dein Name
              </label>
              <Input
                id="name"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-foreground">
                Abteilungscode
              </label>
              <Input
                id="code"
                placeholder="IN-VIA-1234"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                className="font-mono tracking-wider"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" variant="gradient" size="lg" className="w-full">
              Beitreten
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate('/qr-scan')}
          >
            <QrCode className="w-5 h-5" />
            QR-Code scannen
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
