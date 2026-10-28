import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Coffee, Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';
import { cn } from '../utils';

interface ThemeSelectorProps {
  variant?: 'compact' | 'expanded';
  className?: string;
}

const themeIcons: Record<Theme, LucideIcon> = {
  dark: Moon,
  light: Sun,
  cream: Coffee,
};

export default function ThemeSelector({ variant = 'compact', className }: ThemeSelectorProps) {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const CurrentIcon = themeIcons[theme] || Moon;
  const currentOption = availableThemes.find((t) => t.id === theme) || availableThemes[0];

  if (variant === 'expanded') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3', className)}>
        {availableThemes.map((option) => {
          const Icon = themeIcons[option.id];
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={cn(
                'group relative flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'border-primary-500 bg-primary-500/10 shadow-sm ring-1 ring-primary-500/40'
                  : 'border-surface-300 bg-surface-100 hover:border-surface-400 hover:bg-surface-200'
              )}
            >
              {/* Header: Icon & checkmark */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300"
                  style={{ backgroundColor: option.previewBg }}
                >
                  <Icon
                    className="h-4.5 w-4.5"
                    style={{ color: option.previewColor }}
                  />
                </div>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-primary-500 uppercase tracking-wide bg-primary-500/15 px-2 py-0.5 rounded-full border border-primary-500/25">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>

              {/* Title & description */}
              <div className="mt-1">
                <h4 className="text-sm font-bold text-surface-900 group-hover:text-primary-500 transition-colors">
                  {option.label} Theme
                </h4>
                <p className="mt-1 text-xs text-surface-700 leading-relaxed">
                  {option.description}
                </p>
              </div>

              {/* Color swatch previews */}
              <div className="mt-4 pt-3 border-t border-surface-300 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-surface-600">
                  Palette:
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-surface-400 shadow-xs"
                    style={{ backgroundColor: option.previewBg }}
                    title="Surface background"
                  />
                  <div
                    className="h-3.5 w-3.5 rounded-full shadow-xs"
                    style={{ backgroundColor: option.previewColor }}
                    title="Brand green"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant (For Navbar and Topbars)
  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Select theme, current theme: ${currentOption.label}`}
        title={`Theme: ${currentOption.label}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-300 bg-surface-100 hover:bg-surface-200 text-surface-800 hover:text-surface-900 text-xs font-medium transition-colors cursor-pointer shadow-xs"
      >
        <CurrentIcon className="h-4 w-4 text-primary-500" />
        <span className="hidden sm:inline-block font-semibold capitalize">
          {currentOption.label}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-surface-600 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-surface-300 bg-surface-100 p-1.5 shadow-xl z-50 animate-page-enter">
          <div className="px-2 py-1 text-[10px] font-bold text-surface-600 uppercase tracking-wider">
            Choose Theme
          </div>
          <div className="space-y-1 mt-1">
            {availableThemes.map((option) => {
              const Icon = themeIcons[option.id];
              const isSelected = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
                    isSelected
                      ? 'bg-primary-500/15 text-primary-500 font-semibold'
                      : 'text-surface-800 hover:bg-surface-200 hover:text-surface-900'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-surface-400"
                      style={{ backgroundColor: option.previewBg }}
                    />
                    <Icon className="h-3.5 w-3.5" style={{ color: option.previewColor }} />
                    <span>{option.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
