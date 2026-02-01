import React, { useState } from 'react';
import { Calendar, Send } from 'lucide-react';
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
    <div className="flex gap-[8px] items-start w-full">
      {/* Calendar Button */}
      <div className="relative shrink-0 size-[32px]">
        <input
          id="mobile-date-input"
          type="date"
          value={newTodoDate}
          onChange={(e) => setNewTodoDate(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer size-full"
          title="Datum auswählen"
        />
        <div className="flex items-center justify-center p-[2px] rounded-[2px] size-full pointer-events-none">
          <Calendar className="size-5 text-[#0064c8]" />
        </div>
      </div>

      {/* Text Input */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder=""
          className="bg-white w-full min-h-[32px] px-[8px] py-[4px] border border-[#999da1] rounded-[4px] 
                   font-['Source_Sans_Pro',sans-serif] text-[14px]
                   focus:outline-none focus:border-[#0064c8] focus:ring-1 focus:ring-[#0064c8]"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSubmit}
        disabled={!newTodoText.trim()}
        className="flex items-center justify-center p-[6px] rounded-[4px] shrink-0
                 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Hinzufügen"
      >
        <Send className="size-5 text-[#0064c8]" />
      </button>
    </div>
  );
}