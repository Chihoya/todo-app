import { Todo, TodoPriority } from '@/types/todo';

// Priority order mapping
export const PRIORITY_ORDER: Record<TodoPriority, number> = {
  hoch: 0,
  mittel: 1,
  niedrig: 2,
};

// Sort function for todos
export const sortTodosByPriorityAndOrder = (a: Todo, b: Todo): number => {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return (a.order || 0) - (b.order || 0);
};

// Calculate max order for a category and priority
export const calculateMaxOrder = (todos: Todo[], category: string, priority: TodoPriority): number => {
  const filteredTodos = todos.filter(
    (t) => t.category === category && t.priority === priority
  );
  return filteredTodos.length > 0
    ? Math.max(...filteredTodos.map((t) => t.order || 0))
    : -1;
};
