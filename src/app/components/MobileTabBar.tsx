import React from 'react';
import { TodoCategory } from '@/types/todo';

interface MobileTabBarProps {
  activeCategory: TodoCategory | 'dailyChecklist';
  onCategoryChange: (category: TodoCategory | 'dailyChecklist') => void;
}

const TABS = [
  { category: 'allgemein' as const, label: 'Allgemein' },
  { category: 'dailyChecklist' as const, label: 'Checkliste' },
];

export function MobileTabBar({ activeCategory, onCategoryChange }: MobileTabBarProps) {
  return (
    <div className="flex gap-[11px] w-full">
      {TABS.map(({ category, label }) => {
        const isActive = activeCategory === category;
        
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className="bg-[#e6f2ff] flex-1 min-h-px relative rounded-[24px]"
          >
            {isActive && (
              <div aria-hidden="true" className="absolute border border-[#0246a1] border-solid inset-[-1px] pointer-events-none rounded-[25px]" />
            )}
            <div className="flex items-center justify-center px-[8px] py-[5px]">
              <p className={`font-['Source_Sans_Pro',sans-serif] text-[14px] leading-normal ${
                isActive ? 'text-[#0246a1]' : 'text-[#1a1d20]'
              }`}>
                {label}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}