import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface ExpiryAlertProps {
  expiryDate: string;
  className?: string;
}

const ExpiryAlert: React.FC<ExpiryAlertProps> = ({ expiryDate, className = '' }) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const timeDiff = expiry.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // Determine alert level
  const getAlertConfig = () => {
    if (daysDiff < 0) {
      return {
        variant: 'destructive' as const,
        text: 'Expired',
        icon: AlertTriangle,
        className: 'bg-destructive text-destructive-foreground animate-pulse'
      };
    } else if (daysDiff <= 7) {
      return {
        variant: 'destructive' as const,
        text: `Expires in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
        icon: AlertTriangle,
        className: 'bg-destructive text-destructive-foreground'
      };
    } else if (daysDiff <= 30) {
      return {
        variant: 'secondary' as const,
        text: `Expires in ${daysDiff} days`,
        icon: Clock,
        className: 'bg-warning text-warning-foreground'
      };
    } else {
      return {
        variant: 'secondary' as const,
        text: `Expires ${expiry.toLocaleDateString()}`,
        icon: CheckCircle,
        className: 'bg-success/20 text-success-foreground'
      };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} inline-flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  );
};

export default ExpiryAlert;