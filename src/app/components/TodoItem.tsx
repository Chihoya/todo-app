import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Checkbox } from '@/app/components/ui/checkbox';
import { GripVertical, Pen, Trash2 } from 'lucide-react';
import { Todo } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
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
  disableDrag = false
}: TodoItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const dragHandleRef = React.useRef<HTMLDivElement>(null);
  const editInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [hasDragged, setHasDragged] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(todo.text);

  // Drag source - only from the grip handle
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
    [todo.id, index, todo.category, todo.priority, disableDrag]
  );

  // Drop target
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(
    {
      accept: ITEM_TYPE,
      canDrop: (item) => {
        if (disableDrag || !onReorder) return false;
        // Can only reorder within same category and priority
        return item.category === todo.category && item.priority === todo.priority && item.id !== todo.id;
      },
      hover: (item: DragItem, monitor) => {
        if (!ref.current || !onReorder || disableDrag) return;
        
        // Can't drop on itself
        if (item.id === todo.id) return;
        
        // Must be same category and priority
        if (item.category !== todo.category || item.priority !== todo.priority) return;
        
        setHasDragged(true);
        
        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) return;

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        // Time to actually perform the action
        onReorder(dragIndex, hoverIndex);

        // Note: we're mutating the item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    },
    [index, todo.id, todo.category, todo.priority, disableDrag, onReorder]
  );

  // Connect drop to the entire item (for drop zone)
  drop(ref);
  
  // Connect drag to the grip handle only
  drag(dragHandleRef);
  
  // Connect preview to the entire item (for visual feedback)
  preview(ref);

  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if in edit mode
    if (isEditing) return;
    
    // Only toggle if we didn't drag
    if (!hasDragged) {
      // Prevent toggling if clicking on buttons, checkbox, input, or drag handle
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
        // Auto-resize on mount
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

  const showDropIndicator = isOver && canDrop;

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`bg-white rounded-[8px] p-[8px] flex items-start gap-[16px] transition-all duration-200 cursor-pointer ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
      } ${showDropIndicator ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${
        todo.completed ? 'opacity-60' : ''
      }`}
    >
      {/* Left side: Grip and Checkbox */}
      <div className="flex items-start gap-[4px] shrink-0">
        <div 
          ref={dragHandleRef}
          data-drag-handle
          className={`p-[6px] rounded-[4px] hover:bg-gray-100 transition-colors ${
            disableDrag ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
        >
          <GripVertical className="size-5 text-[#666a6e] pointer-events-none" />
        </div>
        <div className="p-[6px]">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggleComplete(todo.id)}
            id={`todo-${todo.id}`}
            className="size-5 cursor-pointer"
          />
        </div>
      </div>

      {/* Middle: Text */}
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        {isEditing ? (
          <textarea
            ref={editInputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKeyDown}
            rows={1}
            className="w-full resize-none cursor-pointer font-['Source_Sans_Pro',sans-serif] text-[16px] leading-normal border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
            style={{ minHeight: '24px', overflow: 'hidden' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        ) : (
          <>
            <span
              className={`cursor-pointer font-['Source_Sans_Pro',sans-serif] text-[16px] leading-normal break-words transition-all duration-300 ${
                todo.completed ? 'line-through text-gray-400' : 'text-black'
              }`}
            >
              {todo.text}
            </span>
            {todo.date && (
              <span className="font-['Source_Sans_Pro',sans-serif] text-[10px] text-[#666a6e] leading-normal">
                {new Date(todo.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right side: Edit and Delete buttons */}
      <div className="flex items-start gap-[8px] shrink-0">
        <button className="p-[6px] rounded-[4px] hover:bg-gray-100 transition-colors" onClick={handleEditClick}>
          <Pen className="size-5 text-[#0246a1]" />
        </button>
        <button 
          className="p-[6px] rounded-[4px] hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
        >
          <Trash2 className="size-5 text-[#d2001e]" />
        </button>
      </div>
    </div>
  );
});