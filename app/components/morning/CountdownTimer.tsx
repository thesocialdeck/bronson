import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  eventName: string;
  eventTime: string;
  person: string;
}

export function CountdownTimer({ eventName, eventTime, person }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    isUrgent: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const [eventHours, eventMinutes] = eventTime.split(':').map(Number);

      const eventDate = new Date();
      eventDate.setHours(eventHours, eventMinutes, 0, 0);

      const diff = eventDate.getTime() - now.getTime();
      const minutes = Math.floor(diff / 1000 / 60);

      if (minutes <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      setTimeLeft({
        hours,
        minutes: remainingMinutes,
        isUrgent: minutes <= 30,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [eventTime]);

  if (!timeLeft) {
    return null;
  }

  const urgencyColor = timeLeft.isUrgent ? 'from-red-500 to-orange-500' : 'from-purple-500 to-pink-500';
  const textColor = timeLeft.isUrgent ? 'text-red-700' : 'text-purple-700';

  return (
    <div className={`bg-gradient-to-r ${urgencyColor} rounded-2xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {timeLeft.isUrgent ? (
            <AlertCircle className="w-6 h-6 animate-pulse" />
          ) : (
            <Clock className="w-6 h-6" />
          )}
          <div>
            <p className="text-sm opacity-90">{person}'s {eventName}</p>
            <p className="text-xs opacity-75">{eventTime}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {timeLeft.hours > 0 && `${timeLeft.hours}h `}
            {timeLeft.minutes}m
          </div>
          <p className="text-xs opacity-90">
            {timeLeft.isUrgent ? 'Leave soon!' : 'until departure'}
          </p>
        </div>
      </div>
    </div>
  );
}
