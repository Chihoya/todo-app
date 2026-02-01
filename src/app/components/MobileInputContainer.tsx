import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { TodoCategory, TodoPriority } from '@/types/todo';

interface MobileInputContainerProps {
  activeCategory: TodoCategory;
  onAddTodo: (category: TodoCategory, text: string, date?: string, priority?: TodoPriority) => void;
}

export function MobileInputContainer({ activeCategory, onAddTodo }: MobileInputContainerProps) {
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDate, setNewTodoDate] = useState('');

  const handleSubmit = () => {
    if (newTodoText.trim()) {
      // Priority is always 'niedrig' by default in mobile view
      onAddTodo(activeCategory, newTodoText.trim(), newTodoDate || undefined, 'niedrig');
      setNewTodoText('');
      setNewTodoDate('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border-t-2 border-[#e0e0e0] p-[16px] w-full">
      <div className="flex gap-[8px] items-center">
        {/* Date Picker Icon Button */}
        <div className="relative shrink-0">
          <input
            id="mobile-date-input"
            type="date"
            value={newTodoDate}
            onChange={(e) => setNewTodoDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-[32px] h-[32px]"
            title="Datum auswählen"
          />
          <button
            type="button"
            className="flex items-center justify-center p-[6px] rounded-[4px] shrink-0 hover:bg-gray-100 transition-colors pointer-events-none"
            aria-label="Datum auswählen"
          >
            <Calendar className="size-5 text-[#0064c8]" />
          </button>
        </div>

        {/* Text Input Field */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Aufgabe eingeben..."
            className="w-full px-[8px] py-[6px] border border-[#999da1] rounded-[4px] 
                     font-['Source_Sans_Pro',sans-serif] text-[14px]
                     focus:outline-none focus:border-[#0064c8] focus:ring-1 focus:ring-[#0064c8]
                     bg-white"
          />
        </div>

        {/* Submit Icon Button */}
        <button
          onClick={handleSubmit}
          disabled={!newTodoText.trim()}
          className="flex items-center justify-center p-[6px] rounded-[4px] shrink-0
                   hover:bg-gray-100 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Hinzufügen"
        >
          <svg className="size-5 text-[#0064c8]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3l14 7-14 7V3z" />
          </svg>
        </button>
      </div>
    </div>
  );
}