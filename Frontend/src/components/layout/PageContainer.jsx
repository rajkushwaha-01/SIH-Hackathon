import React from 'react';
import { cn } from '../../utils/cn';

export default function PageContainer({ children, className = '', fluid = false }) {
  return (
    <div
      className={cn(
        'w-full px-4 md:px-8 py-6',
        fluid ? 'max-w-full' : 'max-w-[1600px] mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
