// SVG Illustrations for VVL Enterprises Finance App

// Empty state for customers
export function EmptyCustomersIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-40 h-32 mx-auto"
    >
      <circle cx="100" cy="80" r="60" fill="currentColor" fillOpacity="0.05" />
      <circle cx="100" cy="80" r="40" fill="currentColor" fillOpacity="0.08" />
      
      {/* User icons */}
      <g transform="translate(70, 50)">
        <circle cx="30" cy="20" r="15" fill="currentColor" fillOpacity="0.15" />
        <circle cx="30" cy="15" r="8" fill="currentColor" fillOpacity="0.25" />
        <path
          d="M15 35 Q20 28 30 28 Q40 28 45 35"
          fill="currentColor"
          fillOpacity="0.25"
        />
      </g>
      
      {/* Plus sign */}
      <g transform="translate(85, 95)">
        <circle cx="15" cy="15" r="12" fill="currentColor" fillOpacity="0.2" />
        <path
          d="M15 10 L15 20 M10 15 L20 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
      
      {/* Decorative dots */}
      <circle cx="50" cy="40" r="3" fill="currentColor" fillOpacity="0.2" />
      <circle cx="150" cy="50" r="2" fill="currentColor" fillOpacity="0.15" />
      <circle cx="45" cy="120" r="2.5" fill="currentColor" fillOpacity="0.18" />
      <circle cx="155" cy="110" r="3" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

// Empty state for payments
export function EmptyPaymentsIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-40 h-32 mx-auto"
    >
      <circle cx="100" cy="80" r="60" fill="currentColor" fillOpacity="0.05" />
      
      {/* Credit card */}
      <g transform="translate(55, 50)">
        <rect x="0" y="0" width="90" height="55" rx="8" fill="currentColor" fillOpacity="0.12" />
        <rect x="0" y="12" width="90" height="12" fill="currentColor" fillOpacity="0.15" />
        <rect x="10" y="35" width="30" height="8" rx="2" fill="currentColor" fillOpacity="0.2" />
        <circle cx="75" cy="40" r="8" fill="currentColor" fillOpacity="0.15" />
        <circle cx="68" cy="40" r="8" fill="currentColor" fillOpacity="0.1" />
      </g>
      
      {/* Rupee symbol */}
      <g transform="translate(85, 95)">
        <circle cx="15" cy="15" r="15" fill="currentColor" fillOpacity="0.15" />
        <text x="15" y="21" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold" opacity="0.4">₹</text>
      </g>
      
      {/* Decorative elements */}
      <circle cx="40" cy="35" r="2" fill="currentColor" fillOpacity="0.15" />
      <circle cx="160" cy="45" r="3" fill="currentColor" fillOpacity="0.2" />
      <circle cx="35" cy="125" r="2.5" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

// Success illustration
export function SuccessIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-24 h-24 mx-auto"
    >
      <circle cx="60" cy="60" r="50" fill="currentColor" fillOpacity="0.1" />
      <circle cx="60" cy="60" r="35" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M40 60 L55 75 L80 45"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

// Dashboard welcome illustration
export function DashboardIllustration() {
  return (
    <svg
      viewBox="0 0 300 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-xs mx-auto"
    >
      {/* Background shapes */}
      <circle cx="50" cy="60" r="40" fill="currentColor" fillOpacity="0.05" />
      <circle cx="250" cy="60" r="40" fill="currentColor" fillOpacity="0.05" />
      
      {/* Chart bars */}
      <rect x="80" y="70" width="20" height="40" rx="3" fill="currentColor" fillOpacity="0.2" />
      <rect x="110" y="50" width="20" height="60" rx="3" fill="currentColor" fillOpacity="0.3" />
      <rect x="140" y="30" width="20" height="80" rx="3" fill="currentColor" fillOpacity="0.4" />
      <rect x="170" y="45" width="20" height="65" rx="3" fill="currentColor" fillOpacity="0.35" />
      <rect x="200" y="55" width="20" height="55" rx="3" fill="currentColor" fillOpacity="0.25" />
      
      {/* Trend line */}
      <path
        d="M85 65 L115 45 L145 25 L175 38 L205 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      
      {/* Dots on line */}
      <circle cx="85" cy="65" r="4" fill="currentColor" fillOpacity="0.5" />
      <circle cx="145" cy="25" r="5" fill="currentColor" fillOpacity="0.6" />
      <circle cx="205" cy="50" r="4" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

// No data illustration
export function NoDataIllustration() {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-32 h-28 mx-auto"
    >
      <circle cx="80" cy="70" r="50" fill="currentColor" fillOpacity="0.05" />
      
      {/* Folder */}
      <g transform="translate(45, 40)">
        <path
          d="M0 20 L0 55 Q0 60 5 60 L65 60 Q70 60 70 55 L70 20 Q70 15 65 15 L40 15 L35 10 L5 10 Q0 10 0 15 Z"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path
          d="M5 25 L65 25"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.15"
        />
      </g>
      
      {/* Question mark */}
      <g transform="translate(68, 55)">
        <text x="12" y="25" textAnchor="middle" fill="currentColor" fontSize="24" fontWeight="bold" opacity="0.25">?</text>
      </g>
    </svg>
  );
}

// Reports illustration
export function ReportsIllustration() {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-48 h-24 mx-auto"
    >
      {/* Pie chart */}
      <g transform="translate(30, 15)">
        <circle cx="35" cy="35" r="30" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M35 35 L35 5 A30 30 0 0 1 60 50 Z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path
          d="M35 35 L60 50 A30 30 0 0 1 10 50 Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
      </g>
      
      {/* Bar chart */}
      <g transform="translate(110, 20)">
        <rect x="0" y="40" width="15" height="25" rx="2" fill="currentColor" fillOpacity="0.2" />
        <rect x="20" y="25" width="15" height="40" rx="2" fill="currentColor" fillOpacity="0.3" />
        <rect x="40" y="10" width="15" height="55" rx="2" fill="currentColor" fillOpacity="0.4" />
        <rect x="60" y="30" width="15" height="35" rx="2" fill="currentColor" fillOpacity="0.25" />
      </g>
    </svg>
  );
}
