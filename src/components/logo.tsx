import React from 'react';
import Image from 'next/image';

const Logo = ({ size = 'text-3xl' }: { size?: string }) => {
  return (
    <div className={`flex items-center gap-2 font-bold text-foreground`}>
      <Image
        src="/logo.png" // You need to place logo.png in your /public directory
        alt="GroZen Logo"
        width={32}    // Adjust width as needed for your logo.png
        height={32}   // Adjust height as needed for your logo.png
        data-ai-hint="fitness logo"
      />
      <span className={`${size}`}>GroZen</span>
    </div>
  );
};

export default Logo;
