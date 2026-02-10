import { useTheme } from '@/contexts/ThemeContext';
import logoLight from '@/assets/logo-light.jpg';
import logoDark from '@/assets/logo-dark.jpg';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

export function AppLogo({ size = 'md', className }: AppLogoProps) {
  const { theme } = useTheme();
  const logo = theme === 'dark' ? logoDark : logoLight;

  return (
    <img
      src={logo}
      alt="VVL Enterprises"
      className={cn('object-contain rounded-xl', sizeMap[size], className)}
    />
  );
}
