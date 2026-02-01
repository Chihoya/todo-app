/**
 * Supabase-basierte Implementierung des TodoService
 *
 * Diese Datei ist vorbereitet und kann aktiviert werden, sobald:
 * 1. @supabase/supabase-js installiert ist
 * 2. Die Supabase-Konfiguration in .env eingetragen ist
 * 3. Die 'todos' Tabelle in Supabase erstellt wurde
 *
 * Um diese Implementierung zu aktivieren:
 * - In /src/services/todoService.ts die letzte Zeile ändern zu:
 *   export const todoService = new SupabaseTodoService();
 */

import { Todo, TodoCategory } from "@/types/todo";
import { TodoService } from "@/services/todoService";
import { supabase } from "@/services/supabase";

export class SupabaseTodoService implements TodoService {
  async getAllTodos(): Promise<Todo[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching todos:", error);
      throw error;
    }

    return data.map(this.mapSupabaseTodoToTodo);
  }

  async getTodoById(id: string): Promise<Todo | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching todo:", error);
      throw error;
    }

    return this.mapSupabaseTodoToTodo(data);
  }

  async getTodosByCategory(
    category: TodoCategory,
  ): Promise<Todo[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching todos by category:", error);
      throw error;
    }

    return data.map(this.mapSupabaseTodoToTodo);
  }

  async createTodo(
    todoData: Omit<Todo, "id" | "createdAt" | "updatedAt">,
  ): Promise<Todo> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    console.log("💾 Supabase: Creating todo with:", todoData);

    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          text: todoData.text,
          completed: todoData.completed,
          category: todoData.category,
          date: todoData.date || null,
          priority: todoData.priority || "niedrig",
          order: todoData.order ?? 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase: Error creating todo:", error);
      throw error;
    }

    console.log("✅ Supabase: Todo created:", data);

    return this.mapSupabaseTodoToTodo(data);
  }

  async updateTodo(
    id: string,
    updates: Partial<Todo>,
  ): Promise<Todo | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const updateData: any = {};
    if (updates.text !== undefined)
      updateData.text = updates.text;
    if (updates.completed !== undefined)
      updateData.completed = updates.completed;
    if (updates.category !== undefined)
      updateData.category = updates.category;
    if (updates.date !== undefined)
      updateData.date = updates.date;
    if (updates.priority !== undefined)
      updateData.priority = updates.priority;
    if (updates.order !== undefined)
      updateData.order = updates.order;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("todos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error updating todo:", error);
      throw error;
    }

    return this.mapSupabaseTodoToTodo(data);
  }

  async deleteTodo(id: string): Promise<boolean> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting todo:", error);
      return false;
    }

    return true;
  }

  async deleteAllTodos(): Promise<boolean> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { error } = await supabase
      .from("todos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (error) {
      console.error("Error deleting all todos:", error);
      return false;
    }

    return true;
  }

  /**
   * Hilfsfunktion zum Mapping von Supabase-Daten zum Todo-Typ
   */
  private mapSupabaseTodoToTodo(data: any): Todo {
    return {
      id: data.id,
      text: data.text,
      completed: data.completed,
      category: data.category,
      date: data.date,
      priority: data.priority || "niedrig",
      order: data.order ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}