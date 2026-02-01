import React from 'react';
import { TodoCategory } from '@/types/todo';

interface MobileTabBarProps {
  activeCategory: TodoCategory | 'erledigt';
  onCategoryChange: (category: TodoCategory | 'erledigt') => void;
}

const CARD_CONFIGS: { category: TodoCategory | 'erledigt'; label: string; isCompleted?: boolean }[] = [
  { category: 'allgemein', label: 'Allgemein' },
  { category: 'daily', label: 'Daily' },
  { category: 'weekly', label: 'Weekly' },
  { category: 'erledigt', label: 'Erledigt', isCompleted: true },
];

export function MobileTabBar({ activeCategory, onCategoryChange }: MobileTabBarProps) {
  return (
    <div className="flex gap-[8px] w-full px-[16px] py-[12px]">
      {CARD_CONFIGS.map(({ category, label, isCompleted }) => {
        const isActive = activeCategory === category;
        
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`
              flex-1 px-[12px] py-[8px] rounded-[8px] 
              font-['Source_Sans_Pro',sans-serif] font-semibold text-[14px]
              transition-all border-2
              ${
                isActive
                  ? isCompleted
                    ? 'bg-[#f3e5f3] border-[#3c0d3c] text-[#3c0d3c]'
                    : 'bg-[#e5f1ff] border-[#0246a1] text-[#0246a1]'
                  : 'bg-white border-[#e0e0e0] text-[#666a6e]'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}