import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-8 rounded-full transition-all duration-300",
        "bg-muted border border-border",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Track background */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-300",
          theme === 'dark' ? 'bg-primary/20' : 'bg-warning/20'
        )}
      />

      {/* Sliding circle with icon */}
      <div
        className={cn(
          "absolute top-1 w-6 h-6 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-300 ease-in-out",
          "shadow-sm",
          theme === 'dark'
            ? 'left-7 bg-primary text-primary-foreground'
            : 'left-1 bg-warning text-warning-foreground'
        )}
      >
        {theme === 'dark' ? (
          <Moon className="w-3.5 h-3.5" />
        ) : (
          <Sun className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  );
}
