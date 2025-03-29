'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });

  const calculateTimeRemaining = (): TimeRemaining => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
      };
    }
    
    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds
    };
  };

  useEffect(() => {
    // Cálculo inicial
    setTimeRemaining(calculateTimeRemaining());
    
    // Atualizar a cada segundo
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Se o contador chegar a zero, parar o intervalo
      if (remaining.totalSeconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(timer);
  }, [targetDate]);

  // Função para formatar números com zero à esquerda se necessário
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="flex flex-col">
        <div className="rounded-md bg-white px-3 py-2 text-2xl font-bold text-primary-600 shadow-sm">
          {formatNumber(timeRemaining.days)}
        </div>
        <span className="mt-1 text-xs text-primary-600">Dias</span>
      </div>
      
      <div className="flex flex-col">
        <div className="rounded-md bg-white px-3 py-2 text-2xl font-bold text-primary-600 shadow-sm">
          {formatNumber(timeRemaining.hours)}
        </div>
        <span className="mt-1 text-xs text-primary-600">Horas</span>
      </div>
      
      <div className="flex flex-col">
        <div className="rounded-md bg-white px-3 py-2 text-2xl font-bold text-primary-600 shadow-sm">
          {formatNumber(timeRemaining.minutes)}
        </div>
        <span className="mt-1 text-xs text-primary-600">Minutos</span>
      </div>
      
      <div className="flex flex-col">
        <div className="rounded-md bg-white px-3 py-2 text-2xl font-bold text-primary-600 shadow-sm">
          {formatNumber(timeRemaining.seconds)}
        </div>
        <span className="mt-1 text-xs text-primary-600">Segundos</span>
      </div>
    </div>
  );
} 