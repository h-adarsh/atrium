import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const shouldBeDark = saved === 'dark';

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextIsDark = !isDark;

    const applyTheme = () => {
      if (nextIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDark(true);
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDark(false);
      }
    };

    // If browser doesn't support View Transitions or user prefers reduced motion
    const doc = document as any;
    if (
      !doc.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      applyTheme();
      return;
    }

    // Coordinates of the click or center of the button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => {
      applyTheme();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      doc.documentElement.animate(
        {
          clipPath
        },
        {
          duration: 400,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#ffffff] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] transition shadow-none group ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 overflow-hidden">
        {/* Sun Icon: Displays in Dark Mode to switch to Light mode */}
        <Sun
          className={`w-4 h-4 text-amber-400 absolute inset-0 transition-all duration-300 ease-in-out ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0 pointer-events-none'
          }`}
        />
        {/* Moon Icon: Displays in Light Mode to switch to Dark mode */}
        <Moon
          className={`w-4 h-4 text-zinc-600 absolute inset-0 transition-all duration-300 ease-in-out ${
            isDark ? 'rotate-90 scale-0 opacity-0 pointer-events-none' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </div>
    </button>
  );
};
