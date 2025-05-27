import React from 'react';
import { Leaf } from 'lucide-react';

const Logo = ({ size = 'text-3xl' }: { size?: string }) => {
  return (
    <div className={`flex items-center gap-2 font-bold ${size} text-foreground`}>
      <Leaf className="text-accent h-8 w-8" strokeWidth={2} />
      <span>GroZen</span>
    </div>
  );
};

export default Logo;
