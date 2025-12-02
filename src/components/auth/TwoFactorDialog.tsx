import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { QrCode, Shield } from 'lucide-react';

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TwoFactorDialog = ({ open, onOpenChange }: TwoFactorDialogProps) => {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleEnable2FA = () => {
    setStep('qr');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (verificationCode === '123456' || verificationCode.length === 6) {
      const user2FA = {
        enabled: true,
        enabledAt: new Date().toISOString(),
        backupCodes: [
          'XXXX-XXXX-XXXX',
          'YYYY-YYYY-YYYY',
          'ZZZZ-ZZZZ-ZZZZ'
        ]
      };
      
      localStorage.setItem('user2FA', JSON.stringify(user2FA));
      
      toast({
        title: '2FA Enabled Successfully!',
        description: 'Your account is now protected with two-factor authentication.',
      });
      
      setStep('intro');
      setVerificationCode('');
      onOpenChange(false);
    } else {
      toast({
        title: 'Invalid Code',
        description: 'Please check your code and try again.',
        variant: 'destructive'
      });
    }
    
    setIsVerifying(false);
  };

  const handleDisable2FA = () => {
    localStorage.removeItem('user2FA');
    toast({
      title: '2FA Disabled',
      description: 'Two-factor authentication has been disabled for your account.',
    });
    onOpenChange(false);
  };

  const is2FAEnabled = localStorage.getItem('user2FA');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-4">
            <DialogDescription>
              {is2FAEnabled 
                ? 'Two-factor authentication is currently enabled for your account.'
                : 'Add an extra layer of security to your account by enabling two-factor authentication.'}
            </DialogDescription>
            
            {!is2FAEnabled ? (
              <>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">How it works:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Scan a QR code with your authenticator app</li>
                    <li>Enter the 6-digit code to verify</li>
                    <li>You'll need this code each time you sign in</li>
                  </ul>
                </div>
                
                <Button onClick={handleEnable2FA} className="w-full">
                  Enable 2FA
                </Button>
              </>
            ) : (
              <Button onClick={handleDisable2FA} variant="destructive" className="w-full">
                Disable 2FA
              </Button>
            )}
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-4">
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
            
            <div className="flex justify-center p-8 bg-white rounded-lg">
              <div className="w-48 h-48 flex items-center justify-center border-4 border-primary rounded-lg">
                <QrCode className="w-32 h-32 text-gray-900" />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Manual entry key: JBSW Y3DP EHPK 3PXP
            </p>
            
            <Button onClick={() => setStep('verify')} className="w-full">
              I've Scanned the Code
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <DialogDescription>
              Enter the 6-digit verification code from your authenticator app
            </DialogDescription>
            
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isVerifying || verificationCode.length !== 6}>
              {isVerifying ? 'Verifying...' : 'Verify & Enable'}
            </Button>
            
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('qr')}>
              Back to QR Code
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
