import React from 'react';
import { Pill, Heart, Stethoscope, Syringe, Thermometer, Tablets, Microscope, Activity } from 'lucide-react';

const FloatingMedicalIcons = () => {
  const icons = [
    { Icon: Pill, delay: '0s', position: 'top-10 left-10' },
    { Icon: Heart, delay: '0.5s', position: 'top-20 right-20' },
    { Icon: Stethoscope, delay: '1s', position: 'bottom-32 left-16' },
    { Icon: Syringe, delay: '1.5s', position: 'bottom-40 right-12' },
    { Icon: Thermometer, delay: '2s', position: 'top-32 left-1/3' },
    { Icon: Tablets, delay: '2.5s', position: 'bottom-20 right-1/3' },
    { Icon: Microscope, delay: '3s', position: 'top-40 right-1/4' },
    { Icon: Activity, delay: '3.5s', position: 'bottom-16 left-1/4' }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, delay, position }, index) => (
        <div
          key={index}
          className={`absolute ${position} opacity-20 animate-float`}
          style={{
            animationDelay: delay,
            animationDuration: '6s'
          }}
        >
          <Icon className="w-8 h-8 text-primary" />
        </div>
      ))}
    </div>
  );
};

export default FloatingMedicalIcons;