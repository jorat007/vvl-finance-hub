import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Lock, Loader2, Shield, TrendingUp, Users } from 'lucide-react';
import { z } from 'zod';
import { AppLogo } from '@/components/AppLogo';

const loginSchema = z.object({
  mobile: z.string().min(10, 'Mobile number must be 10 digits').max(10, 'Mobile number must be 10 digits').regex(/^\d+$/, 'Only digits allowed'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// SVG Illustration Component
function FinanceIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-xs mx-auto"
    >
      {/* Background circles */}
      <circle cx="200" cy="150" r="120" fill="currentColor" fillOpacity="0.05" />
      <circle cx="200" cy="150" r="90" fill="currentColor" fillOpacity="0.08" />
      <circle cx="200" cy="150" r="60" fill="currentColor" fillOpacity="0.1" />
      
      {/* Chart bars */}
      <rect x="120" y="180" width="30" height="60" rx="4" fill="currentColor" fillOpacity="0.3" />
      <rect x="160" y="140" width="30" height="100" rx="4" fill="currentColor" fillOpacity="0.5" />
      <rect x="200" y="100" width="30" height="140" rx="4" fill="currentColor" fillOpacity="0.7" />
      <rect x="240" y="120" width="30" height="120" rx="4" fill="currentColor" fillOpacity="0.9" />
      
      {/* Rupee symbol */}
      <g transform="translate(180, 50)">
        <circle cx="20" cy="20" r="25" fill="currentColor" fillOpacity="0.2" />
        <text x="20" y="28" textAnchor="middle" fill="currentColor" fontSize="24" fontWeight="bold">₹</text>
      </g>
      
      {/* Trend line */}
      <path
        d="M100 200 Q150 180 180 190 T260 120 T320 100"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="8 4"
        opacity="0.6"
      />
      
      {/* Arrow up */}
      <g transform="translate(300, 80)">
        <circle cx="15" cy="15" r="20" fill="currentColor" fillOpacity="0.15" />
        <path d="M15 25 L15 8 M8 15 L15 8 L22 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ mobile?: string; password?: string }>({});
  
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
          description: 'Invalid mobile number or password. Please try again.',
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
  <div className="min-h-screen bg-background relative overflow-hidden">
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ================= LEFT SIDE – LOGIN ================= */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="flex justify-center mb-8">
            <AppLogo className="w-32 h-32 shadow-2xl shadow-primary/40" />
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">
            VVL Enterprises
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Finance Management System
          </p>

          <div className="bg-card rounded-2xl p-6 border shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Mobile */}
              <div>
                <Label>Mobile Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label>Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Contact admin if you don’t have an account
          </p>
        </div>
      </div>

      {/* ================= RIGHT SIDE – WHY THIS APP ================= */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 to-success/10 p-12 items-center">
        <div className="max-w-lg mx-auto space-y-8">

          <h2 className="text-3xl font-bold">
            From Notebook to Complete Financial Control
          </h2>

          <p className="text-muted-foreground text-lg">
            Stop manual errors. Track every rupee. Manage loans, staff and collections in real time.
          </p>

          {/* Feature Blocks */}
          <div className="grid grid-cols-2 gap-6 mt-8">

            <div className="bg-card p-5 rounded-xl shadow-sm border space-y-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Real-Time Collections</h3>
              <p className="text-sm text-muted-foreground">
                Instantly know today’s target, collected and pending amounts.
              </p>
            </div>

            <div className="bg-card p-5 rounded-xl shadow-sm border space-y-3">
              <Users className="w-8 h-8 text-success" />
              <h3 className="font-semibold">Staff Control</h3>
              <p className="text-sm text-muted-foreground">
                Admin → Manager → Staff hierarchy with full visibility.
              </p>
            </div>

            <div className="bg-card p-5 rounded-xl shadow-sm border space-y-3">
              <Shield className="w-8 h-8 text-warning" />
              <h3 className="font-semibold">Secure & Transparent</h3>
              <p className="text-sm text-muted-foreground">
                Role-based access, audit trail, and safe KYC storage.
              </p>
            </div>

            <div className="bg-card p-5 rounded-xl shadow-sm border space-y-3">
              <Lock className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Smart Loan Management</h3>
              <p className="text-sm text-muted-foreground">
                Unique Loan IDs, ledger tracking and multi-loan lifecycle support.
              </p>
            </div>

          </div>

          <div className="pt-6">
            <p className="text-lg font-medium text-primary">
              Never lose track of collections again.
            </p>
          </div>

        </div>
      </div>

    </div>
  </div>
);

}
