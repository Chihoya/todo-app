export type TodoCategory = 'allgemein' | 'dailyChecklist';
export type TodoPriority = 'hoch' | 'mittel' | 'niedrig';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: TodoCategory;
  date?: string;
  priority: TodoPriority;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}