import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { CATEGORIES } from '../types';
import { OTHER, getSkillOptions } from '../data/categorySkills';

interface CategorySkillFieldsProps {
  category: string;
  skill: string;
  onChange: (value: { category: string; skill: string }) => void;
  categoryError?: string;
  skillError?: string;
  /** e.g. "Skill Needed" (jobs) or "Service Type" (services) */
  skillLabel: string;
  customLabel?: string;
}

interface DropdownProps {
  value: string;
  placeholder: string;
  options: readonly string[];
  disabled?: boolean;
  onSelect: (option: string) => void;
}

function Dropdown({ value, placeholder, options, disabled, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-surface-400 bg-surface-0 px-3.5 py-2.5 text-sm text-surface-900 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? 'text-surface-900' : 'text-surface-600'}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-surface-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="absolute z-10 mt-1.5 max-h-56 w-full overflow-auto rounded-lg border border-surface-400 bg-surface-0 py-1 shadow-lg">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                className={`block w-full px-3.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-200 ${
                  value === option ? 'bg-primary-500/10 font-medium text-primary-400' : 'text-surface-900'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Category dropdown + a second dropdown whose options depend on the chosen
 * category. Both end with "Other", which reveals a text box for a custom value.
 *
 * The parent form only ever receives two plain strings: `category` and `skill`
 * (for a custom skill, `skill` is the text the user typed).
 */
export default function CategorySkillFields({
  category,
  skill,
  onChange,
  categoryError,
  skillError,
  skillLabel,
  customLabel,
}: CategorySkillFieldsProps) {
  const [otherPicked, setOtherPicked] = useState(false);
  const [custom, setCustom] = useState('');

  // New category (or form reset) => start the skill choice over
  useEffect(() => {
    setOtherPicked(false);
    setCustom('');
  }, [category]);

  const categoryIsOther = category === OTHER;
  const showCustomInput = categoryIsOther || otherPicked;
  const skillOptions = category && !categoryIsOther ? getSkillOptions(category) : [];
  const dropdownValue = otherPicked ? OTHER : skill;

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-800">Category</label>
        <Dropdown
          value={category}
          placeholder="Select a category"
          options={CATEGORIES}
          onSelect={(next) => onChange({ category: next, skill: '' })}
        />
        {categoryError && <p className="mt-1.5 text-xs text-red-400">{categoryError}</p>}
      </div>

      {!categoryIsOther && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-800">{skillLabel}</label>
          <Dropdown
            value={dropdownValue}
            placeholder={category ? `Select ${skillLabel.toLowerCase()}` : 'Select a category first'}
            options={skillOptions}
            disabled={!category}
            onSelect={(option) => {
              if (option === OTHER) {
                setOtherPicked(true);
                setCustom('');
                onChange({ category, skill: '' });
              } else {
                setOtherPicked(false);
                onChange({ category, skill: option });
              }
            }}
          />
          {!showCustomInput && skillError && <p className="mt-1.5 text-xs text-red-400">{skillError}</p>}
        </div>
      )}

      {showCustomInput && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-800">
            {customLabel ?? `Describe your ${skillLabel.toLowerCase()}`}
          </label>
          <input
            type="text"
            value={custom}
            maxLength={80}
            autoFocus={!categoryIsOther}
            placeholder="e.g. Pottery lessons"
            onChange={(e) => {
              setCustom(e.target.value);
              onChange({ category, skill: e.target.value.trim() });
            }}
            className="w-full rounded-lg border border-surface-400 bg-surface-0 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-600 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {skillError && <p className="mt-1.5 text-xs text-red-400">{skillError}</p>}
        </div>
      )}
    </div>
  );
}
