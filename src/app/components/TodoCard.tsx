import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { TodoItem } from '@/app/components/TodoItem';
import { Plus, ChevronDown, Maximize2, Minimize2, Trash2 } from 'lucide-react';
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
}

const CARD_STYLES = {
  allgemein: {
    bg: 'bg-[#eaf7ff]',
    border: 'border-[#4390bf]',
    headerText: 'text-[#002d5a]',
    inputBg: 'bg-[#f7fcff]',
    emptyText: 'text-[#6699cc]',
  },
  daily: {
    bg: 'bg-[#e5faec]',
    border: 'border-[#3fbf74]',
    headerText: 'text-[#053c14]',
    inputBg: 'bg-[#f1fef5]',
    emptyText: 'text-[#66cc99]',
  },
  weekly: {
    bg: 'bg-[#fae5f7]',
    border: 'border-[#bf3f9f]',
    headerText: 'text-[#5a0044]',
    inputBg: 'bg-[#fcf1fa]',
    emptyText: 'text-[#cc66aa]',
  },
  erledigt: {
    bg: 'bg-[#efefef]',
    border: 'border-[#999da1]',
    headerText: 'text-[#333333]',
    inputBg: 'bg-[#f7f7f7]',
    emptyText: 'text-[#999da1]',
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
    <div className="flex flex-col gap-[12px] w-full">
      <p className={`font-['Source_Sans_Pro',sans-serif] text-[14px] font-semibold ${styles.headerText}`}>
        {PRIORITY_LABELS[priority]}
      </p>
      
      <div 
        ref={drop}
        className={`flex flex-col gap-[12px] min-h-[60px] rounded-lg transition-all duration-200 ${
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
}: TodoCardProps) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('niedrig');
  const [isCollapsed, setIsCollapsed] = useState(isCompletedCard);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const styles = CARD_STYLES[category];

  // Group todos by priority
  const hochTodos = todos.filter(t => t.priority === 'hoch');
  const mittelTodos = todos.filter(t => t.priority === 'mittel');
  const niedrigTodos = todos.filter(t => t.priority === 'niedrig');

  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        className={`w-[48px] flex-none h-full rounded-[24px] border ${styles.bg} ${styles.border} overflow-hidden flex items-center justify-center transition-all cursor-pointer hover:opacity-90`}
        onClick={() => setIsCollapsed(false)}
        title="Card aufklappen"
      >
        <div className="flex items-center justify-center h-full w-full relative">
          <div className="-rotate-90 flex-none whitespace-nowrap">
            <div className="flex items-center gap-4 px-6 py-2">
              <h2 className={`font-['Source_Sans_Pro',sans-serif] font-semibold text-[18px] ${styles.headerText}`}>
                {title}
              </h2>
              <button 
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(false);
                }}
              >
                <Minimize2 className={`size-5 ${isCompletedCard ? 'text-[#3c0d3c]' : 'text-[#0246a1]'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[280px] h-full rounded-[24px] border ${styles.bg} ${styles.border} overflow-hidden flex flex-col transition-all ${
        showDropIndicator ? 'ring-4 ring-blue-400 ring-offset-2' : ''
      }`}
    >
      {/* Header */}
      <div className="pb-[8px] pt-[24px] px-[24px]">
        <div className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsCollapsed(true)}
        >
          <h2 className={`font-['Source_Sans_Pro',sans-serif] font-semibold text-[18px] ${styles.headerText}`}>
            {title}
          </h2>
          <div className="flex items-center gap-1">
            {isCompletedCard && onClearCompleted && (
              <button 
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCompleted();
                }}
                title="Alle erledigten löschen"
              >
                <Trash2 className="size-5 text-[#d2001e]" />
              </button>
            )}
            <button 
              className="p-1.5 rounded hover:bg-black/5 transition-colors"
              onClick={() => setIsCollapsed(true)}
              title="Card zuklappen"
            >
              <Maximize2 className={`size-5 ${isCompletedCard ? 'text-[#3c0d3c]' : 'text-[#0246a1]'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Todo Items List - Grouped by Priority */}
      <div className="flex-1 px-[24px] py-[8px] flex flex-col gap-[12px] overflow-y-auto">
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

      {/* Input Section - Only for non-completed cards */}
      {!isCompletedCard && onAddTodo && (
        <div className={`${styles.inputBg} p-[24px]`}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
            {/* Text Input */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-['Source_Sans_Pro',sans-serif] text-[14px] text-[#666a6e] flex items-center gap-0.5">
                Neue Aufgabe
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-white border border-[#999da1] rounded-[4px] px-[8px] py-[6px] min-h-[32px] text-[16px] font-['Source_Sans_Pro',sans-serif] focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder=""
                ref={inputRef}
              />
            </div>

            {/* Datum and Prio row */}
            <div className="flex gap-[8px] w-full">
              {/* Datum Input */}
              <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                <label className="font-['Source_Sans_Pro',sans-serif] text-[14px] text-[#666a6e]">
                  Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white border border-[#999da1] rounded-[4px] px-[8px] py-[6px] min-h-[32px] text-[16px] font-['Source_Sans_Pro',sans-serif] w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Prio Dropdown */}
              <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                <label className="font-['Source_Sans_Pro',sans-serif] text-[14px] text-[#666a6e]">
                  Prio
                </label>
                <div className="relative w-full">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
                    className="bg-white border border-[#999da1] rounded-[4px] px-[8px] py-[6px] min-h-[32px] text-[16px] font-['Source_Sans_Pro',sans-serif] w-full appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="hoch">Hoch</option>
                    <option value="mittel">Mittel</option>
                    <option value="niedrig">Niedrig</option>
                  </select>
                  <ChevronDown className="absolute right-[4px] top-1/2 -translate-y-1/2 size-6 text-[#666a6e] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!text.trim()}
              className="bg-[#436384] text-white rounded-[4px] px-[10px] py-[6px] font-['Source_Sans_Pro',sans-serif] text-[14px] flex items-center justify-center gap-[6px] hover:bg-[#355070] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-5" />
              Hinzufügen
            </button>
          </form>
        </div>
      )}
    </div>
  );
}