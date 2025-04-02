
import { useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedElementProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
  threshold?: number;
  delay?: number;
}

export function AnimatedElement({ 
  children, 
  className, 
  once = true,
  threshold = 0.1,
  delay = 0
}: AnimatedElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (ref.current) {
                ref.current.classList.add('active');
              }
            }, delay);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.classList.remove('active');
          }
        });
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [once, threshold, delay]);
  
  return (
    <div ref={ref} className={cn('reveal', className)}>
      {children}
    </div>
  );
}
