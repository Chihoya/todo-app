import React from 'react';
import { useDrag, useDrop, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Checkbox } from '@/app/components/ui/checkbox';
import { GripVertical, Pen, X } from 'lucide-react';
import { Todo } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  /**
   * Unified reorder callback.
   * dragId       – ID des gezogenen Items (robuste Nachschlage-Basis)
   * dragIndex    – Flat-Index des gezogenen Items (Tracking)
   * hoverIndex   – Flat-Index dieses (Ziel-)Items
   * newPriority  – Priorität dieses Ziel-Items (optional, für Checklist-Kompatibilität)
   */
  onReorder?: (dragId: string, dragIndex: number, hoverIndex: number, newPriority?: string) => void;
  onEdit: (id: string, newText: string) => void;
  disableDrag?: boolean;
}

const ITEM_TYPE = 'TODO_ITEM';

interface DragItem {
  id: string;
  index: number;
  category: string;
  priority: string;
}

export const TodoItem = React.memo(function TodoItem({
  todo,
  index,
  onToggleComplete,
  onDelete,
  onReorder,
  onEdit,
  disableDrag = false,
}: TodoItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const dragHandleRef = React.useRef<HTMLDivElement>(null);
  const editInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [hasDragged, setHasDragged] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(todo.text);

  // Drag source – nur vom Grip-Handle
  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>(
    {
      type: ITEM_TYPE,
      item: () => ({ id: todo.id, index, category: todo.category, priority: todo.priority }),
      canDrag: !disableDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: () => {
        setTimeout(() => setHasDragged(false), 100);
      },
    },
    [todo.id, index, todo.category, todo.priority, disableDrag],
  );

  // Drop-Target – akzeptiert ALLE Items derselben Kategorie (kein Priority-Check)
  const [, drop] = useDrop<DragItem, void, Record<string, never>>(
    {
      accept: ITEM_TYPE,
      canDrop: (item) => {
        if (disableDrag) return false;
        // Gleiche Kategorie, nicht sich selbst – Priorität spielt keine Rolle mehr
        return item.category === todo.category && item.id !== todo.id;
      },
      hover: (item: DragItem) => {
        if (!ref.current || !onReorder || disableDrag) return;
        if (item.id === todo.id) return;
        if (item.category !== todo.category) return;

        setHasDragged(true);

        const hoverIndex = index;

        // Kein Re-Trigger wenn bereits an dieser Position mit gleicher Priorität
        if (item.index === hoverIndex && item.priority === todo.priority) return;

        // Einheitlicher Aufruf – egal ob gleiche oder andere Priorität
        onReorder(item.id, item.index, hoverIndex, todo.priority);

        // Tracking aktualisieren
        item.index = hoverIndex;
        item.priority = todo.priority;
      },
    },
    [index, todo.id, todo.category, todo.priority, disableDrag, onReorder],
  );

  // Drop an gesamtes Item, Drag nur am Handle
  drop(ref);
  drag(dragHandleRef);

  // Browser-Default-Preview unterdrücken
  React.useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Globaler Drag-Layer: überlebt Remounts beim Prioritätswechsel.
  // isDragging (lokal) wird nach Remount false – isDraggingGlobal bleibt true.
  const isDraggingGlobal = useDragLayer((monitor) =>
    monitor.isDragging() && (monitor.getItem() as DragItem | null)?.id === todo.id,
  );

  const showDragging = isDragging || isDraggingGlobal;

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (!hasDragged) {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[data-drag-handle]')
      ) {
        return;
      }
      onToggleComplete(todo.id);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.style.height = 'auto';
        editInputRef.current.style.height = editInputRef.current.scrollHeight + 'px';
      }
    }, 0);
  };

  const handleEditBlur = () => {
    setIsEditing(false);
    if (editText.trim() !== todo.text) {
      onEdit(todo.id, editText.trim());
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(todo.text);
    }
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      style={{
        // Inline-Styles für Opacity/Transform: keine CSS-Transition → sofortige Änderung.
        // transition-all auf Klassen würde das Ausblenden nach Drop um 200ms verzögern.
        opacity: showDragging ? 0.4 : todo.completed ? 0.6 : 1,
        transform: showDragging ? 'scale(0.95)' : undefined,
      }}
      className="bg-white rounded-[8px] p-[8px] flex items-start gap-[16px] cursor-pointer relative"
    >
      {/* Border als absolutes Element */}
      <div
        aria-hidden="true"
        className="absolute border border-[#ccd1d6] border-solid inset-0 pointer-events-none rounded-[8px]"
      />

      {/* Links: Grip + Checkbox */}
      <div className="flex items-start gap-[4px] shrink-0">
        <div
          ref={dragHandleRef}
          data-drag-handle
          className={`p-[2px] rounded-[2px] transition-colors ${
            disableDrag
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-grab active:cursor-grabbing hover:bg-gray-100'
          }`}
        >
          <GripVertical className="size-5 text-[#666a6e] pointer-events-none" />
        </div>
        <div className="p-[2px] rounded-[2px]">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggleComplete(todo.id)}
            id={`todo-${todo.id}`}
            className="size-5 cursor-pointer"
          />
        </div>
      </div>

      {/* Mitte: Text */}
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        {isEditing ? (
          <textarea
            ref={editInputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKeyDown}
            rows={1}
            className="w-full resize-none cursor-pointer font-['Source_Sans_Pro',sans-serif] text-[14px] leading-normal border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
            style={{ minHeight: '20px', overflow: 'hidden' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        ) : (
          <>
            <span
              className={`cursor-pointer font-['Source_Sans_Pro',sans-serif] text-[14px] leading-normal break-words transition-all duration-300 ${
                todo.completed ? 'line-through text-gray-400' : 'text-[#1a1d20]'
              }`}
            >
              {todo.text}
            </span>
            {todo.date && (
              <span className="font-['Source_Sans_Pro',sans-serif] text-[10px] text-[#666a6e] leading-normal">
                {new Date(todo.date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            )}
          </>
        )}
      </div>

      {/* Rechts: Edit + Delete */}
      <div className="flex items-start gap-[8px] shrink-0">
        <button
          className="flex items-center justify-center p-[6px] rounded-[4px] hover:bg-gray-100 transition-colors size-6"
          onClick={handleEditClick}
        >
          <Pen className="size-3 text-[#0246a1]" />
        </button>
        <button
          className="flex items-center justify-center p-[6px] rounded-[4px] hover:bg-gray-100 transition-colors size-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
        >
          <X className="size-3 text-[#666a6e]" />
        </button>
      </div>
    </div>
  );
});