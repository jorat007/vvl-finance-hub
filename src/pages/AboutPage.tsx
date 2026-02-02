import { MainLayout } from '@/components/MainLayout';
import { Building2, Code, Heart, ExternalLink, Shield, Users, TrendingUp, Zap } from 'lucide-react';

// Decorative SVG
function AboutIllustration() {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto"
    >
      {/* Background elements */}
      <circle cx="80" cy="100" r="60" fill="currentColor" fillOpacity="0.05" />
      <circle cx="320" cy="100" r="60" fill="currentColor" fillOpacity="0.05" />
      <circle cx="200" cy="100" r="80" fill="currentColor" fillOpacity="0.08" />
      
      {/* Connection lines */}
      <path
        d="M100 100 Q150 70 200 100 Q250 130 300 100"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        opacity="0.3"
      />
      
      {/* Left icon - Building */}
      <g transform="translate(55, 75)">
        <rect x="0" y="10" width="50" height="40" rx="4" fill="currentColor" fillOpacity="0.2" />
        <rect x="8" y="20" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.4" />
        <rect x="22" y="20" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.4" />
        <rect x="8" y="34" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.4" />
        <rect x="22" y="34" width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.4" />
        <rect x="36" y="20" width="6" height="24" rx="1" fill="currentColor" fillOpacity="0.4" />
      </g>
      
      {/* Center icon - Heart/Handshake */}
      <g transform="translate(175, 75)">
        <circle cx="25" cy="25" r="30" fill="currentColor" fillOpacity="0.15" />
        <path
          d="M25 45 L10 30 Q5 25 10 18 Q15 10 25 20 Q35 10 40 18 Q45 25 40 30 Z"
          fill="currentColor"
          fillOpacity="0.5"
        />
      </g>
      
      {/* Right icon - Code */}
      <g transform="translate(295, 75)">
        <rect x="0" y="10" width="50" height="35" rx="4" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 20 L8 27 L12 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <path d="M38 20 L42 27 L38 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <path d="M28 18 L22 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
      
      {/* Stars/sparkles */}
      <circle cx="150" cy="50" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="250" cy="40" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="100" cy="150" r="2.5" fill="currentColor" fillOpacity="0.35" />
      <circle cx="300" cy="160" r="3" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

export default function AboutPage() {
  const features = [
    { icon: Users, label: 'Customer Management', desc: 'Track and manage customer accounts' },
    { icon: TrendingUp, label: 'Collection Tracking', desc: 'Monitor daily & monthly collections' },
    { icon: Shield, label: 'Role-Based Access', desc: 'Secure admin and agent roles' },
    { icon: Zap, label: 'Real-time Reports', desc: 'Instant insights and analytics' },
  ];

  return (
    <MainLayout title="About">
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* App Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <span className="text-2xl font-bold text-primary-foreground">VVL</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">VVL Enterprises</h1>
          <p className="text-muted-foreground text-sm mt-1">Finance Management System</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Version 2.0 • Phase II</p>
        </div>

        {/* Illustration */}
        <div className="text-primary py-4">
          <AboutIllustration />
        </div>

        {/* Owner Info */}
        <div className="form-section">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Project Owner</p>
              <h3 className="text-lg font-bold text-foreground">Elavarasan Thiyagarajan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                VVL Enterprises • TN-02-0194510
              </p>
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="form-section">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center flex-shrink-0">
              <Code className="w-7 h-7 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Developed By</p>
              <h3 className="text-lg font-bold text-foreground">JORAT Serv</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enterprise Solutions & Digital Services
              </p>
              <a
                href="https://joratserv.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
              >
                Visit Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Key Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <feature.icon className="w-6 h-6 text-primary mb-2" />
                <p className="font-medium text-sm text-foreground">{feature.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-border">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> in India
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            © {new Date().getFullYear()} VVL Enterprises. All rights reserved.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
