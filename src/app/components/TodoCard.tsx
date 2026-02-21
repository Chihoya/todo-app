import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { TodoItem } from '@/app/components/TodoItem';
import { Plus, Archive, Trash2 } from 'lucide-react';
import { Todo, TodoCategory, TodoPriority } from '@/types/todo';

const ITEM_TYPE = 'TODO_ITEM';

interface DragItem {
  id: string;
  index: number;
  category: string;
  priority: string;
}

interface TodoCardProps {
  title: string;
  category: TodoCategory | 'erledigt';
  todos: Todo[];
  onToggleComplete: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, newText: string) => void;
  onMoveTodo?: (id: string, newCategory: TodoCategory) => void;
  onUpdatePriority?: (id: string, newPriority: TodoPriority) => void;
  onAddTodo?: (text: string, date?: string, priority?: TodoPriority) => void;
  onReorderTodo?: (category: TodoCategory, priority: TodoPriority, dragIndex: number, hoverIndex: number) => void;
  onClearCompleted?: () => void;
  isCompletedCard?: boolean;
  isMobileView?: boolean;
  isArchiveView?: boolean;
  onToggleArchive?: () => void;
}

const CARD_STYLES = {
  allgemein: {
    bg: 'bg-[#FBFBFB]',
    border: 'border-[#C2C2C2]',
    headerText: 'text-[#002d5a]',
    inputBg: 'bg-[#f7fcff]',
    emptyText: 'text-[#6699cc]',
  },
};

const PRIORITY_LABELS = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
};

// Priority Section Component
function PrioritySection({
  priority,
  todos,
  category,
  styles,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  onReorder,
  onUpdatePriority,
  isCompletedCard,
}: {
  priority: TodoPriority;
  todos: Todo[];
  category: TodoCategory | 'erledigt';
  styles: any;
  onToggleComplete: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, newText: string) => void;
  onReorder?: (priority: TodoPriority, dragIndex: number, hoverIndex: number) => void;
  onUpdatePriority?: (id: string, newPriority: TodoPriority) => void;
  isCompletedCard: boolean;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ITEM_TYPE,
    canDrop: (item: DragItem) => {
      if (isCompletedCard) return false;
      return item.category === category && item.priority !== priority;
    },
    drop: (item: DragItem) => {
      if (onUpdatePriority && !isCompletedCard) {
        onUpdatePriority(item.id, priority);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const showDropIndicator = isOver && canDrop;

  return (
    <div className="flex flex-col gap-[6px] w-full">
      <p className={`font-['Source_Sans_Pro',sans-serif] text-[12px] text-[#666a6e]`}>
        {PRIORITY_LABELS[priority]}
      </p>
      
      <div 
        ref={drop}
        className={`flex flex-col gap-[6px] min-h-[60px] rounded-lg transition-all duration-200 ${
          showDropIndicator ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50' : ''
        }`}
      >
        {todos.length === 0 ? (
          <div className={`py-[16px] px-[12px] rounded-lg border-2 border-dashed transition-all ${
            showDropIndicator ? 'border-blue-400 bg-blue-50' : 'border-transparent'
          }`}>
            <p className={`font-['Source_Sans_Pro',sans-serif] text-[14px] text-center ${
              showDropIndicator ? 'text-blue-600' : 'text-[#999da1]'
            }`}>
              {showDropIndicator ? 'Hier ablegen' : 'Keine To-Dos vorhanden'}
            </p>
          </div>
        ) : (
          todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggleComplete={onToggleComplete}
              onDelete={onDeleteTodo}
              onEdit={onEditTodo}
              onReorder={onReorder ? (dragIndex, hoverIndex) => onReorder(priority, dragIndex, hoverIndex) : undefined}
              disableDrag={isCompletedCard}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function TodoCard({
  title,
  category,
  todos,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  onMoveTodo,
  onUpdatePriority,
  onAddTodo,
  onReorderTodo,
  onClearCompleted,
  isCompletedCard = false,
  isMobileView = false,
  isArchiveView = false,
  onToggleArchive,
}: TodoCardProps) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('niedrig');
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Drop zone for moving items between cards
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ITEM_TYPE,
    canDrop: (item: DragItem) => {
      if (isCompletedCard) return false;
      return item.category !== category;
    },
    drop: (item: DragItem) => {
      if (onMoveTodo && !isCompletedCard && category !== 'erledigt') {
        onMoveTodo(item.id, category as TodoCategory);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && onAddTodo) {
      onAddTodo(text.trim(), date || undefined, priority);
      setText('');
      setDate('');
      inputRef.current?.focus();
    }
  };

  const showDropIndicator = isOver && canDrop;
  const styles = CARD_STYLES.allgemein;

  // Sort function: items with date first, sorted by date, then items without date
  const sortTodosByDate = (todoList: Todo[]) => {
    const withDate = todoList.filter(t => t.date).sort((a, b) => {
      const dateA = new Date(a.date!).getTime();
      const dateB = new Date(b.date!).getTime();
      return dateA - dateB;
    });
    const withoutDate = todoList.filter(t => !t.date);
    return [...withDate, ...withoutDate];
  };

  // Group todos by priority and sort by date
  const hochTodos = sortTodosByDate(todos.filter(t => t.priority === 'hoch'));
  const mittelTodos = sortTodosByDate(todos.filter(t => t.priority === 'mittel'));
  const niedrigTodos = sortTodosByDate(todos.filter(t => t.priority === 'niedrig'));

  return (
    <div
      ref={drop}
      className={`flex-1 ${isMobileView ? 'min-w-full' : 'min-w-[280px]'} h-full ${isMobileView ? '' : 'rounded-[4px] border'} ${styles.bg} ${isMobileView ? '' : styles.border} overflow-hidden flex flex-col transition-all ${
        showDropIndicator ? 'ring-4 ring-blue-400 ring-offset-2' : ''
      }`}
    >
      {/* Header */}
      <div className={`${isMobileView ? 'pt-[16px]' : 'pt-[24px]'} pb-[8px] px-[16px]`}>
        <div className="flex items-center justify-between gap-[8px]">
          <p className="font-['Source_Sans_Pro',sans-serif] font-semibold text-[18px] text-[#002d5a]">
            {title}
          </p>
          <div className="flex items-center gap-[4px]">
            {/* Delete All Completed Button - Only in Archive View */}
            {isArchiveView && onClearCompleted && (
              <button 
                className="flex items-center justify-center p-[6px] rounded-[4px] shrink-0 size-[24px] hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (window.confirm('Möchten Sie wirklich alle erledigten Aufgaben dauerhaft löschen?')) {
                    onClearCompleted();
                  }
                }}
                aria-label="Alle erledigten löschen"
                title="Alle erledigten Aufgaben dauerhaft löschen"
              >
                <Trash2 className="size-5 text-red-600" />
              </button>
            )}
            {/* Archive Toggle Button - Only for Allgemein card */}
            {onToggleArchive && category === 'allgemein' && (
              <button 
                className={`flex items-center justify-center p-[6px] rounded-[4px] shrink-0 size-[24px] hover:bg-black/5 transition-colors ${
                  isArchiveView ? 'bg-black/10' : ''
                }`}
                onClick={onToggleArchive}
                aria-label={isArchiveView ? "Zurück zu Allgemein" : "Archiv anzeigen"}
                title={isArchiveView ? "Zurück zu Allgemein" : "Archiv anzeigen"}
              >
                <Archive className={`size-5 ${isArchiveView ? 'text-[#666a6e]' : 'text-[#0246a1]'}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Todo Items List - Grouped by Priority */}
      <div className={`flex-1 min-h-0 px-[16px] ${isMobileView ? 'pt-[8px] pb-[16px]' : 'py-[8px]'} flex flex-col gap-[12px] overflow-y-auto`}>
        <PrioritySection
          priority="hoch"
          todos={hochTodos}
          category={category}
          styles={styles}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
          onReorder={onReorderTodo ? (priority, dragIndex, hoverIndex) => onReorderTodo(category as TodoCategory, priority, dragIndex, hoverIndex) : undefined}
          onUpdatePriority={onUpdatePriority}
          isCompletedCard={isCompletedCard}
        />

        <PrioritySection
          priority="mittel"
          todos={mittelTodos}
          category={category}
          styles={styles}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
          onReorder={onReorderTodo ? (priority, dragIndex, hoverIndex) => onReorderTodo(category as TodoCategory, priority, dragIndex, hoverIndex) : undefined}
          onUpdatePriority={onUpdatePriority}
          isCompletedCard={isCompletedCard}
        />

        <PrioritySection
          priority="niedrig"
          todos={niedrigTodos}
          category={category}
          styles={styles}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
          onReorder={onReorderTodo ? (priority, dragIndex, hoverIndex) => onReorderTodo(category as TodoCategory, priority, dragIndex, hoverIndex) : undefined}
          onUpdatePriority={onUpdatePriority}
          isCompletedCard={isCompletedCard}
        />
      </div>

      {/* Input Section - Einheitlich für Desktop & Mobile */}
      {!isCompletedCard && onAddTodo && !isMobileView && (
        <div className={`${styles.inputBg} p-[16px]`}>
          <form onSubmit={handleSubmit} className="flex gap-[8px] items-center">
            {/* Date Button with Transparent Overlay */}
            <div className="relative size-[40px] shrink-0">
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title={date || "Datum auswählen"}
              />
              <div className="absolute inset-0 bg-white border border-[#999da1] rounded-[4px] hover:bg-gray-50 transition-colors flex items-center justify-center pointer-events-none">
                <svg className="size-5 text-[#666a6e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {/* Blue Indicator Dot */}
              {date && (
                <div className="absolute top-[2px] right-[2px] size-[8px] bg-blue-500 rounded-full border-2 border-white pointer-events-none z-15" />
              )}
            </div>

            {/* Priority Button */}
            <button
              type="button"
              onClick={() => {
                if (priority === 'niedrig') setPriority('hoch');
                else if (priority === 'hoch') setPriority('mittel');
                else setPriority('niedrig');
              }}
              className={`border rounded-[4px] px-[12px] py-[8px] size-[40px] text-[16px] font-['Source_Sans_Pro',sans-serif] font-semibold transition-colors shrink-0 flex items-center justify-center ${
                priority === 'hoch' 
                  ? 'bg-[#ff4444] border-[#ff4444] text-white hover:bg-[#dd3333]' 
                  : priority === 'mittel'
                  ? 'bg-[#ffaa00] border-[#ffaa00] text-white hover:bg-[#dd9900]'
                  : 'bg-[#44aa44] border-[#44aa44] text-white hover:bg-[#338833]'
              }`}
              title="Priorität wechseln"
            >
              {priority === 'hoch' ? '1' : priority === 'mittel' ? '2' : '3'}
            </button>

            {/* Text Input with Submit Button */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-white border border-[#999da1] rounded-[4px] pl-[12px] pr-[44px] py-[8px] h-[40px] text-[16px] font-['Source_Sans_Pro',sans-serif] focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                placeholder="Neue Aufgabe hinzufügen..."
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