import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  isPremium?: boolean;
  isUserPremium?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function DashboardCard({
  to,
  icon: Icon,
  title,
  subtitle,
  isPremium = false,
  isUserPremium = false,
  onClick,
}: DashboardCardProps) {
  const showLocked = isPremium && !isUserPremium;

  return (
    <Link
      to={showLocked ? "#" : to}
      onClick={onClick}
      className={cn(
        "bg-card hover:bg-card/80 rounded-2xl p-4 sm:p-5 transition-colors relative flex flex-col items-center justify-center text-center min-h-[120px] sm:min-h-[140px]",
        showLocked && "opacity-60"
      )}
    >
      {showLocked && (
        <Lock className="w-4 h-4 text-muted-foreground absolute top-3 right-3" />
      )}
      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-accent mb-2" />
      <h3 className="font-semibold text-xs sm:text-sm leading-tight break-words px-1 mb-1">{title}</h3>
      <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle || 'Gratuito'}</p>
    </Link>
  );
}
