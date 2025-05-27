import React from 'react';

const Logo = ({ size = 'text-3xl' }: { size?: string }) => {
  return (
    <div className={`flex items-center gap-2 font-bold ${size} text-foreground`}>
      <svg
        viewBox="0 0 64 64"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent h-8 w-8" // Default size, can be overridden by parent's size prop if needed
        aria-hidden="true"
        data-ai-hint="fitness bicep logo"
      >
        {/* Simplified Bicep Path */}
        <path d="M33.4,17.7c-2.8-0.2-5.6,0.4-8,1.8c-2.9,1.7-4.9,4.8-5.4,8.1c-0.5,3.4,0.8,6.6,3.1,8.9c1.5,1.4,3.3,2.4,5.4,2.8
	c-0.2,2.1-0.5,4.1-1.1,6.1c-0.8,2.7-1.2,5.3-1.2,7.5c0,1.1,0.9,2,2,2h0c1.1,0,2-0.9,2-2c0-1.8,0.3-3.9,0.9-6.3
	c0.6-2.1,1.1-4.1,1.5-6.1c0.1,0,0.2,0,0.3,0c2.8,0,5.4-1.3,7.2-3.7c2.3-2.9,3-6.7,2-10.2C42.2,20.8,38.7,18,33.4,17.7z
	M25.2,34.9c-1.6-1.5-2.5-3.7-2.2-5.9c0.3-2.3,1.7-4.3,3.7-5.3c1.6-0.9,3.5-1.2,5.3-1c2.3,0.2,4.3,1.4,5.6,3.3
	c1.3,1.8,1.8,4.2,1.2,6.4c-0.6,2.2-2.3,4-4.4,4.8C32.3,38,29.6,37.6,27.4,36.2C26.6,35.8,25.8,35.4,25.2,34.9z" />
        {/* Three Ovals/Pills */}
        <rect x="10" y="50" width="13" height="7" rx="3.5" />
        <rect x="27" y="50" width="13" height="7" rx="3.5" />
        <rect x="44" y="50" width="13" height="7" rx="3.5" />
      </svg>
      <span>GroZen</span>
    </div>
  );
};

export default Logo;
