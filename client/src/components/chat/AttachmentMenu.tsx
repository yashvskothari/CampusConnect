import { useEffect, useRef } from 'react';
import {
  Image,
  Headphones,
  FileText,
  FileDown,
  FileCode,
} from 'lucide-react';
import { type AttachmentCategoryKey } from '../../utils/attachments';

interface AttachmentMenuProps {
  onSelectCategory: (category: AttachmentCategoryKey) => void;
  onClose: () => void;
}

interface CategoryItem {
  key: AttachmentCategoryKey;
  label: string;
  sublabel: string;
  icon: typeof Image;
  colorClass: string;
  bgClass: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    key: 'photos',
    label: 'Photos',
    sublabel: 'PNG, JPG, WEBP, GIF',
    icon: Image,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15 group-hover:bg-blue-500/25',
  },
  {
    key: 'audio',
    label: 'Audio',
    sublabel: 'MP3, WAV, OGG, M4A',
    icon: Headphones,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15 group-hover:bg-amber-500/25',
  },
  {
    key: 'word',
    label: 'Word',
    sublabel: 'DOCX, DOC files',
    icon: FileText,
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-500/15 group-hover:bg-sky-500/25',
  },
  {
    key: 'pdf',
    label: 'PDF',
    sublabel: 'PDF documents',
    icon: FileDown,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/15 group-hover:bg-rose-500/25',
  },
  {
    key: 'md',
    label: 'MD Files',
    sublabel: 'Markdown documents',
    icon: FileCode,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
  },
];

export default function AttachmentMenu({ onSelectCategory, onClose }: AttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Clicks on the paperclip toggle button itself should not immediately close this listener
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !target.closest('[data-attachment-toggle]')
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Choose attachment category"
      className="
        absolute bottom-full left-3 mb-2.5 z-30
        w-60 overflow-hidden
        rounded-2xl border border-surface-300
        bg-surface-100/95 backdrop-blur-md
        p-1.5 shadow-2xl
        animate-in fade-in slide-in-from-bottom-2 duration-150
      "
    >
      <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-600 border-b border-surface-300/60 mb-1">
        Attach File
      </div>

      <div className="space-y-0.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              role="menuitem"
              onClick={() => onSelectCategory(cat.key)}
              className="
                group flex w-full items-center gap-3
                rounded-xl px-2.5 py-2
                text-left transition-colors duration-150
                hover:bg-surface-200 cursor-pointer
              "
            >
              <div
                className={`
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-full transition-colors duration-150
                  ${cat.bgClass} ${cat.colorClass}
                `}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-900 group-hover:text-white transition-colors">
                  {cat.label}
                </p>
                <p className="text-[11px] text-surface-600 truncate">
                  {cat.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
