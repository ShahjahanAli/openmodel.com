import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'image' | 'svg';
  src?: string;
  alt?: string;
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  type = 'image',
  src = '/images/OpenModel_Logo.png',
  alt = 'OpenModel Logo'
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  if (type === 'image') {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Fallback to SVG if image fails or type is 'svg'
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#gradient)"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-600"
        />
        
        {/* AI Brain/Neural Network Pattern */}
        <g className="text-white">
          {/* Central nodes */}
          <circle cx="35" cy="40" r="3" fill="currentColor" />
          <circle cx="50" cy="35" r="4" fill="currentColor" />
          <circle cx="65" cy="40" r="3" fill="currentColor" />
          <circle cx="50" cy="55" r="3" fill="currentColor" />
          <circle cx="35" cy="65" r="3" fill="currentColor" />
          <circle cx="65" cy="65" r="3" fill="currentColor" />
          
          {/* Connection lines */}
          <line x1="35" y1="40" x2="50" y2="35" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="35" x2="65" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="35" y1="40" x2="50" y2="55" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="35" x2="50" y2="55" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="65" y1="40" x2="50" y2="55" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="35" y1="40" x2="35" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="55" x2="35" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="50" y1="55" x2="65" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="65" y1="40" x2="65" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        </g>
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
