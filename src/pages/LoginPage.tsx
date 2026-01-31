import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Lock, Building2, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  mobile: z.string().min(10, 'Mobile number must be 10 digits').max(10, 'Mobile number must be 10 digits').regex(/^\d+$/, 'Only digits allowed'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ mobile?: string; password?: string }>({});
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = loginSchema.safeParse({ mobile, password });
    if (!result.success) {
      const fieldErrors: { mobile?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'mobile') fieldErrors.mobile = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(mobile, password);
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message === 'Invalid login credentials' 
            ? 'Invalid mobile number or password. Please try again.'
            : error.message,
        });
      } else {
        toast({
          title: 'Welcome!',
          description: 'You have been logged in successfully.',
        });
        navigate('/dashboard');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div 
        className="flex-shrink-0 pt-16 pb-20 px-6 text-center"
        style={{ background: 'var(--gradient-primary)' }}
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">CRM</h1>
        <p className="text-white/80 mt-2 text-sm">VVL Enterprises | TN-02-0194510</p>
      </div>

      {/* Login Form */}
      <div className="flex-1 bg-background -mt-8 rounded-t-3xl px-6 pt-8">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium">
                Mobile Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10 digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="touch-input pl-12"
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              {errors.mobile && (
                <p className="text-destructive text-sm">{errors.mobile}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="touch-input pl-12"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="touch-button touch-button-primary w-full mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Contact admin if you don't have an account
          </p>
        </div>
      </div>
    </div>
  );
}
