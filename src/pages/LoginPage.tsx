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
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-300">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(ellipse at top, hsl(217 91% 30% / 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, hsl(142 71% 30% / 0.3) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at top, hsl(217 91% 60% / 0.2) 0%, transparent 50%), radial-gradient(ellipse at bottom right, hsl(142 71% 45% / 0.15) 0%, transparent 50%)'
        }}
      />
 
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Section */}
        <div className="flex-shrink-0 pt-12 pb-6 px-6 text-center">
          {/* Logo 
          <div className="relative inline-block mb-6">
            <AppLogo size="xl" className="shadow-lg shadow-primary/30" />
          </div>
*/}
          <h1 className="text-2xl font-bold text-foreground mb-1">
            VVL Enterprises
          </h1>
          <p className="text-sm text-muted-foreground mb-1">Finance Management System</p>
          <p className="text-xs text-muted-foreground/70">TN-02-0194510</p>
        </div>

        {/* Illustration */}
        <div className="px-6 text-primary">
            <AppLogo size="xl" className="shadow-lg shadow-primary/30" />
         {/* <FinanceIllustration />*/}
        </div>

        {/* Features badges */}
        <div className="flex justify-center gap-3 px-6 py-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            Collections
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            Customers
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            Secure
          </div>
        </div>

        {/* Login Form Card */}
        <div className="flex-1 px-6 pb-8">
          <div className="max-w-sm mx-auto">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-1">Welcome Back</h2>
              <p className="text-sm text-muted-foreground mb-6">Sign in to continue</p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Enter 10 digit number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="touch-input pl-12 bg-muted/30"
                      maxLength={10}
                      disabled={loading}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="text-destructive text-xs">{errors.mobile}</p>
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
                      className="touch-input pl-12 bg-muted/30"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs">{errors.password}</p>
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
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Contact admin if you don't have an account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
