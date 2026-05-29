import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: Props) {
  return (
    <div className={`page-content h-full ${className}`}>
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}
