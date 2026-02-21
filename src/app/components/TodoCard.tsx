import React, { useState, useRef, useCallback } from 'react';
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
  onAddTodo?: (text: string, date?: string, priority?: TodoPriority) => void;
  /**
   * Einheitlicher Flat-Reorder-Handler:
   * category, dragId, dragFlatIndex, hoverFlatIndex, newPriority
   */
  onReorderTodo?: (
    category: TodoCategory,
    dragId: string,
    dragFlatIndex: number,
    hoverFlatIndex: number,
    newPriority: TodoPriority,
  ) => void;
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
    inputBg: 'bg-[#f7fcff]',
  },
};

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
};

// ---------------------------------------------------------------------------
// EmptyDropZone – Drop-Zone für leere Priority-Sections
// Reagiert per hover (sofort, wie TodoItem), damit das Verhalten einheitlich ist.
// ---------------------------------------------------------------------------
function EmptyDropZone({
  category,
  priority,
  startIndex,
  onFlatReorder,
}: {
  category: string;
  priority: string;
  startIndex: number;
  onFlatReorder?: (
    dragId: string,
    dragIndex: number,
    hoverIndex: number,
    newPriority: string,
  ) => void;
}) {
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    canDrop: (item) => item.category === category,
    hover: (item: DragItem) => {
      // Bereits in dieser Priorität → kein Re-Trigger
      if (item.priority === priority) return;
      if (!onFlatReorder) return;

      onFlatReorder(item.id, item.index, startIndex, priority);
      // Tracking aktualisieren
      item.priority = priority;
      item.index = startIndex;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop}
      className={`py-[12px] px-[12px] rounded-lg border-2 border-dashed transition-all min-h-[52px] flex items-center justify-center ${
        isOver ? 'border-gray-300 bg-gray-50/30' : 'border-transparent'
      }`}
    >
      <p className="font-['Source_Sans_Pro',sans-serif] text-[14px] text-center text-[#999da1]">
        Keine To-Dos vorhanden
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PrioritySection – rein visueller Container, keine eigene Drop-Zone mehr.
// Die Drop-Logik liegt vollständig in TodoItem (und EmptyDropZone).
// ---------------------------------------------------------------------------
function PrioritySection({
  priority,
  todos,
  startIndex,
  category,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  onFlatReorder,
  isCompletedCard,
}: {
  priority: TodoPriority;
  todos: Todo[];
  startIndex: number;
  category: TodoCategory | 'erledigt';
  onToggleComplete: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, newText: string) => void;
  onFlatReorder?: (
    dragId: string,
    dragIndex: number,
    hoverIndex: number,
    newPriority: string,
  ) => void;
  isCompletedCard: boolean;
}) {
  return (
    <div className="flex flex-col gap-[6px] w-full">
      <p className="font-['Source_Sans_Pro',sans-serif] text-[12px] text-[#666a6e]">
        {PRIORITY_LABELS[priority]}
      </p>

      <div className="flex flex-col gap-[6px]">
        {todos.length === 0 ? (
          // Leere Section: Drop-Zone, damit man Items hierher ziehen kann
          !isCompletedCard ? (
            <EmptyDropZone
              category={String(category)}
              priority={priority}
              startIndex={startIndex}
              onFlatReorder={onFlatReorder}
            />
          ) : (
            <div className="py-[12px] px-[12px]">
              <p className="font-['Source_Sans_Pro',sans-serif] text-[14px] text-center text-[#999da1]">
                Keine To-Dos vorhanden
              </p>
            </div>
          )
        ) : (
          todos.map((todo, i) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={startIndex + i} // globaler Flat-Index
              onToggleComplete={onToggleComplete}
              onDelete={onDeleteTodo}
              onEdit={onEditTodo}
              onReorder={
                onFlatReorder
                  ? (dragId, di, hi, np) => onFlatReorder(dragId, di, hi, np ?? priority)
                  : undefined
              }
              disableDrag={isCompletedCard}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TodoCard
// ---------------------------------------------------------------------------
export function TodoCard({
  title,
  category,
  todos,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  onMoveTodo,
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

  // Karten-Level Drop-Zone – nur für Cross-Card-Moves
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
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const showDropIndicator = isOver && canDrop;
  const styles = CARD_STYLES.allgemein;

  // Sort: Items mit Datum zuerst (nach Datum), dann ohne Datum
  const sortByDate = (list: Todo[]) => {
    const withDate = [...list.filter((t) => t.date)].sort(
      (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime(),
    );
    const withoutDate = list.filter((t) => !t.date);
    return [...withDate, ...withoutDate];
  };

  // Gruppierung nach Priorität + Datumsort innerhalb jeder Gruppe
  const hochTodos = sortByDate(todos.filter((t) => t.priority === 'hoch'));
  const mittelTodos = sortByDate(todos.filter((t) => t.priority === 'mittel'));
  const niedrigTodos = sortByDate(todos.filter((t) => t.priority === 'niedrig'));

  // Flat-Indizes: hoch startet bei 0, mittel bei hochTodos.length, usw.
  const mittelStart = hochTodos.length;
  const niedrigStart = hochTodos.length + mittelTodos.length;

  // Einheitlicher Flat-Reorder-Wrapper
  const handleFlatReorder = useCallback(
    (dragId: string, dragFlatIndex: number, hoverFlatIndex: number, newPriority: string) => {
      if (onReorderTodo && category !== 'erledigt') {
        onReorderTodo(
          category as TodoCategory,
          dragId,
          dragFlatIndex,
          hoverFlatIndex,
          newPriority as TodoPriority,
        );
      }
    },
    [category, onReorderTodo],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && onAddTodo) {
      onAddTodo(text.trim(), date || undefined, priority);
      setText('');
      setDate('');
      inputRef.current?.focus();
    }
  };

  return (
    <div
      ref={drop}
      className={`flex-1 ${isMobileView ? 'min-w-full' : 'min-w-[280px]'} h-full ${
        isMobileView ? '' : 'rounded-[4px] border'
      } ${styles.bg} ${isMobileView ? '' : styles.border} overflow-hidden flex flex-col transition-all ${
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
            {isArchiveView && onClearCompleted && (
              <button
                className="flex items-center justify-center p-[6px] rounded-[4px] shrink-0 size-[24px] hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (
                    window.confirm(
                      'Möchten Sie wirklich alle erledigten Aufgaben dauerhaft löschen?',
                    )
                  ) {
                    onClearCompleted();
                  }
                }}
                aria-label="Alle erledigten löschen"
                title="Alle erledigten Aufgaben dauerhaft löschen"
              >
                <Trash2 className="size-5 text-red-600" />
              </button>
            )}
            {onToggleArchive && category === 'allgemein' && (
              <button
                className={`flex items-center justify-center p-[6px] rounded-[4px] shrink-0 size-[24px] hover:bg-black/5 transition-colors ${
                  isArchiveView ? 'bg-black/10' : ''
                }`}
                onClick={onToggleArchive}
                aria-label={isArchiveView ? 'Zurück zu Allgemein' : 'Archiv anzeigen'}
                title={isArchiveView ? 'Zurück zu Allgemein' : 'Archiv anzeigen'}
              >
                <Archive
                  className={`size-5 ${isArchiveView ? 'text-[#666a6e]' : 'text-[#0246a1]'}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Todo-Liste – nach Priorität gruppiert, flat indiziert */}
      <div
        className={`flex-1 min-h-0 px-[16px] ${
          isMobileView ? 'pt-[8px] pb-[16px]' : 'py-[8px]'
        } flex flex-col gap-[12px] overflow-y-auto`}
      >
        <PrioritySection
          priority="hoch"
          todos={hochTodos}
          startIndex={0}
          category={category}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
          onFlatReorder={!isCompletedCard ? handleFlatReorder : undefined}
          isCompletedCard={isCompletedCard}
        />

        <PrioritySection
          priority="mittel"
          todos={mittelTodos}
          startIndex={mittelStart}
          category={category}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
          onFlatReorder={!isCompletedCard ? handleFlatReorder : undefined}
          isCompletedCard={isCompletedCard}
        />

        <PrioritySection
          priority="niedrig"
          todos={niedrigTodos}
          startIndex={niedrigStart}
          category={category}
          onToggleComplete={onToggleComplete}
          onDeleteTodo={onDeleteTodo}
          onEditTodo={onEditTodo}
          onFlatReorder={!isCompletedCard ? handleFlatReorder : undefined}
          isCompletedCard={isCompletedCard}
        />
      </div>

      {/* Input-Bereich */}
      {!isCompletedCard && onAddTodo && !isMobileView && (
        <div className={`${styles.inputBg} p-[16px]`}>
          <form onSubmit={handleSubmit} className="flex gap-[8px] items-center">
            {/* Datum-Button */}
            <div
              className="relative size-[40px] shrink-0 cursor-pointer"
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                  dateInputRef.current?.click();
                }
              }}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-20"
                title={date || 'Datum auswählen'}
              />
              <div className="absolute inset-0 bg-white border border-[#999da1] rounded-[4px] hover:bg-gray-50 transition-colors flex items-center justify-center pointer-events-none">
                <svg
                  className="size-5 text-[#666a6e]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {date && (
                <div className="absolute top-[2px] right-[2px] size-[8px] bg-blue-500 rounded-full border-2 border-white pointer-events-none" />
              )}
            </div>

            {/* Priorität-Button */}
            <button
              type="button"
              onClick={() => {
                if (priority === 'niedrig') setPriority('hoch');
                else if (priority === 'hoch') setPriority('mittel');
                else setPriority('niedrig');
              }}
              className={`border rounded-[4px] px-[12px] py-[8px] size-[40px] text-[16px] font-['Source_Sans_Pro',sans-serif] font-semibold transition-colors shrink-0 flex items-center justify-center ${
                priority === 'hoch'
                  ? 'bg-[#CD8787] border-[#CD8787] text-white hover:bg-[#b87070]'
                  : priority === 'mittel'
                    ? 'bg-[#F2AB98] border-[#F2AB98] text-white hover:bg-[#e09080]'
                    : 'bg-[#96C57A] border-[#96C57A] text-white hover:bg-[#7eb063]'
              }`}
              title="Priorität wechseln"
            >
              {priority === 'hoch' ? '1' : priority === 'mittel' ? '2' : '3'}
            </button>

            {/* Text-Input */}
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