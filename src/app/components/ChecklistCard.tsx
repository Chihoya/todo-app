import React, { useState, useRef } from 'react';
import { TodoItem } from '@/app/components/TodoItem';
import { Plus, RotateCcw } from 'lucide-react';
import { Todo } from '@/types/todo';

interface ChecklistCardProps {
  title: string;
  todos: Todo[];
  onToggleComplete: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, newText: string) => void;
  onAddTodo?: (text: string) => void;
  onResetAll?: () => void;
  isMobileView?: boolean;
}

const CARD_STYLES = {
  bg: 'bg-[#FAF4F2]',
  border: 'border-[#E8C9BF]',
  headerText: 'text-[#002d5a]',
  inputBg: 'bg-[#f7fcff]',
  emptyText: 'text-[#999da1]',
  iconColor: 'text-[#0246a1]',
};

export function ChecklistCard({
  title,
  todos,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  onAddTodo,
  onResetAll,
  isMobileView = false,
}: ChecklistCardProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && onAddTodo) {
      onAddTodo(text.trim());
      setText('');
      inputRef.current?.focus();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onResetAll) {
      onResetAll();
    }
  };

  const styles = CARD_STYLES;

  return (
    <div
      className={`flex-1 ${isMobileView ? 'min-w-full' : 'min-w-[280px]'} h-full ${isMobileView ? '' : 'rounded-[4px] border'} ${styles.bg} ${isMobileView ? '' : styles.border} overflow-hidden flex flex-col transition-all`}
    >
      {/* Header */}
      <div className={`${isMobileView ? 'pt-[16px]' : 'pt-[24px]'} pb-[8px] px-[16px]`}>
        <div className="flex items-center justify-between gap-[8px]">
          <p className="font-['Source_Sans_Pro',sans-serif] font-semibold text-[18px] text-[#002d5a]">
            {title}
          </p>
          {/* Reset Button */}
          {onResetAll && (
            <button 
              className="flex items-center justify-center p-[6px] rounded-[4px] shrink-0 size-[24px] hover:bg-black/5 transition-colors"
              onClick={handleReset}
              aria-label="Alle zurücksetzen"
              title="Alle Checkpunkte zurücksetzen"
            >
              <RotateCcw className={`size-5 ${styles.iconColor}`} />
            </button>
          )}
        </div>
      </div>

      {/* Todo Items List */}
      <div className={`flex-1 min-h-0 px-[16px] py-[8px] flex flex-col gap-[6px] overflow-y-auto`}>
        {todos.length === 0 ? (
          <div className="py-[16px] px-[12px] rounded-lg border-2 border-dashed border-transparent">
            <p className={`font-['Source_Sans_Pro',sans-serif] text-[14px] text-center text-[#999da1]`}>
              Keine Checkpunkte vorhanden
            </p>
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={0}
              onToggleComplete={onToggleComplete}
              onDelete={onDeleteTodo}
              onEdit={onEditTodo}
              disableDrag={true}
            />
          ))
        )}
      </div>

      {/* Input Section - Einheitlich für Desktop & Mobile */}
      {onAddTodo && !isMobileView && (
        <div className={`${styles.inputBg} p-[16px]`}>
          <form onSubmit={handleSubmit} className="flex items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-white border border-[#999da1] rounded-[4px] pl-[12px] pr-[44px] py-[8px] min-h-[40px] text-[16px] font-['Source_Sans_Pro',sans-serif] focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                placeholder="Neuen Checkpunkt hinzufügen..."
                ref={inputRef}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="absolute right-[4px] top-1/2 -translate-y-1/2 bg-[#436384] text-white rounded-[4px] p-[6px] hover:bg-[#355070] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Hinzufügen"
              >
                <Plus className="size-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}