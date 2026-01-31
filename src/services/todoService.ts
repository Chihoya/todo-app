import { Todo, TodoCategory } from '../types/todo';

/**
 * TodoService - Abstraktionsschicht für Todo-Datenverwaltung
 * 
 * Diese Schicht ermöglicht es, den Datenspeicher später einfach 
 * von localStorage auf Supabase umzustellen, ohne die Komponenten 
 * ändern zu müssen.
 */

const STORAGE_KEY = 'todo-pwa-data';

export interface TodoService {
  // Alle Todos abrufen
  getAllTodos(): Promise<Todo[]>;
  
  // Todo nach ID abrufen
  getTodoById(id: string): Promise<Todo | null>;
  
  // Todos nach Kategorie filtern
  getTodosByCategory(category: TodoCategory): Promise<Todo[]>;
  
  // Neues Todo erstellen
  createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo>;
  
  // Todo aktualisieren
  updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null>;
  
  // Todo löschen
  deleteTodo(id: string): Promise<boolean>;
  
  // Alle Todos löschen (für Entwicklung/Testing)
  deleteAllTodos(): Promise<boolean>;
}

/**
 * LocalStorage-basierte Implementierung
 * Wird später durch SupabaseTodoService ersetzt
 */
class LocalStorageTodoService implements TodoService {
  private async getTodosFromStorage(): Promise<Todo[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load todos from localStorage:', error);
      return [];
    }
  }

  private async saveTodosToStorage(todos: Todo[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error('Failed to save todos to localStorage:', error);
      throw error;
    }
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.getTodosFromStorage();
  }

  async getTodoById(id: string): Promise<Todo | null> {
    const todos = await this.getTodosFromStorage();
    return todos.find(todo => todo.id === id) || null;
  }

  async getTodosByCategory(category: TodoCategory): Promise<Todo[]> {
    const todos = await this.getTodosFromStorage();
    return todos.filter(todo => todo.category === category);
  }

  async createTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const todos = await this.getTodosFromStorage();
    
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    todos.push(newTodo);
    await this.saveTodosToStorage(todos);
    
    return newTodo;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null> {
    const todos = await this.getTodosFromStorage();
    const index = todos.findIndex(todo => todo.id === id);
    
    if (index === -1) return null;
    
    todos[index] = {
      ...todos[index],
      ...updates,
      id: todos[index].id, // ID darf nicht überschrieben werden
      updatedAt: new Date().toISOString(),
    };
    
    await this.saveTodosToStorage(todos);
    return todos[index];
  }

  async deleteTodo(id: string): Promise<boolean> {
    const todos = await this.getTodosFromStorage();
    const filteredTodos = todos.filter(todo => todo.id !== id);
    
    if (filteredTodos.length === todos.length) {
      return false; // Todo nicht gefunden
    }
    
    await this.saveTodosToStorage(filteredTodos);
    return true;
  }

  async deleteAllTodos(): Promise<boolean> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to delete all todos:', error);
      return false;
    }
  }
}

/**
 * Singleton-Instanz des TodoService
 * 
 * Um später auf Supabase umzustellen:
 * 1. Erstelle SupabaseTodoService, der das TodoService Interface implementiert
 * 2. Ändere diese Zeile zu: export const todoService = new SupabaseTodoService();
 */

import { SupabaseTodoService } from "../services/supabaseTodoService";

export const todoService: TodoService =
  new SupabaseTodoService();