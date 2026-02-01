import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TodoCard } from "@/app/components/TodoCard";
import { AuthScreen } from "@/app/components/AuthScreen";
import { CheckSquare } from "lucide-react";
import { Todo, TodoCategory, TodoPriority } from "@/types/todo";
import { todoService } from "@/services/todoService";
import { authService } from "@/services/authService";
import { supabaseAuthService } from "@/services/supabaseAuthService";
import { supabase } from "@/services/supabase";

// Use Supabase auth if available, otherwise local auth
const activeAuthService = supabase ? supabaseAuthService : authService;

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // For Supabase: check session (synchronous)
      // For LocalStorage: check session (synchronous)
      const hasValidSession = supabase
        ? supabaseAuthService.hasValidSession()
        : authService.hasValidSession();

      setIsAuthenticated(hasValidSession);

      if (hasValidSession) {
        loadTodos();
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle successful authentication
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    loadTodos();
  };

  const loadTodos = async () => {
    try {
      setIsLoading(true);
      const allTodos = await todoService.getAllTodos();

      // Migration: Add missing priority field to old todos
      const migratedTodos = allTodos.map((todo) => ({
        ...todo,
        priority: todo.priority || ("niedrig" as TodoPriority),
        order: todo.order ?? 0,
      }));

      // Save migrated todos if needed
      const hasOldTodos = migratedTodos.some(
        (todo, i) => !allTodos[i].priority,
      );
      if (hasOldTodos) {
        for (const todo of migratedTodos) {
          if (
            !allTodos.find((t) => t.id === todo.id)?.priority
          ) {
            await todoService.updateTodo(todo.id, {
              priority: todo.priority,
              order: todo.order,
            });
          }
        }
      }

      setTodos(migratedTodos);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new todo
  const handleAddTodo = useCallback(async (
    category: TodoCategory,
    text: string,
    date?: string,
    priority: TodoPriority = 'niedrig'
  ) => {
    console.log('🚀 handleAddTodo START:', { category, text, date, priority });
    
    try {
      const todoToCreate = {
        text,
        completed: false,
        category,
        date,
        priority,
        order: 0,
      };
      
      console.log('📝 Calling todoService.createTodo with:', todoToCreate);
      
      // Create todo with temporary order
      const newTodo = await todoService.createTodo(todoToCreate);
      
      console.log('✅ Todo created in storage:', newTodo);
      console.log('🔍 Does it have priority?', newTodo.priority);
      console.log('🔍 Does it have order?', newTodo.order);
      
      // Update state and calculate correct order
      setTodos(prevTodos => {
        console.log('📊 setTodos called, prevTodos length:', prevTodos.length);
        
        const categoryPriorityTodos = prevTodos.filter(
          t => t.category === category && t.priority === priority
        );
        const maxOrder = categoryPriorityTodos.length > 0 
          ? Math.max(...categoryPriorityTodos.map(t => t.order || 0))
          : -1;
        
        const todoWithOrder = { ...newTodo, order: maxOrder + 1 };
        
        console.log('📦 Adding todo with order:', todoWithOrder.order);
        console.log('📦 Todo has priority:', todoWithOrder.priority);
        
        // Update order in storage
        todoService.updateTodo(todoWithOrder.id, { order: todoWithOrder.order });
        
        const newTodosArray = [...prevTodos, todoWithOrder];
        console.log('✨ New todos array length:', newTodosArray.length);
        
        return newTodosArray;
      });
      
      console.log('🏁 handleAddTodo COMPLETE');
    } catch (error) {
      console.error('❌ Failed to create todo:', error);
    }
  }, []);

  // Toggle todo completion
  const handleToggleComplete = useCallback(
    async (id: string) => {
      // Optimistically update UI first
      setTodos((prevTodos) => {
        const todo = prevTodos.find((t) => t.id === id);
        if (!todo) return prevTodos;

        return prevTodos.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t,
        );
      });

      // Then update storage
      try {
        const todo = await todoService.getTodoById(id);
        if (todo) {
          await todoService.updateTodo(id, {
            completed: !todo.completed,
          });
        }
      } catch (error) {
        console.error("Failed to update todo:", error);
        // Revert on error
        loadTodos();
      }
    },
    [],
  );

  // Delete todo
  const handleDeleteTodo = useCallback(async (id: string) => {
    try {
      const success = await todoService.deleteTodo(id);
      if (success) {
        setTodos((prevTodos) =>
          prevTodos.filter((t) => t.id !== id),
        );
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  }, []);

  // Clear all completed todos
  const handleClearCompleted = useCallback(async () => {
    setTodos((prevTodos) => {
      const completedTodos = prevTodos.filter(
        (t) => t.completed,
      );

      // Delete from storage
      completedTodos.forEach((todo) => {
        todoService.deleteTodo(todo.id);
      });

      return prevTodos.filter((t) => !t.completed);
    });
  }, []);

  // Edit todo text
  const handleEditTodo = useCallback(
    async (id: string, newText: string) => {
      try {
        const updatedTodo = await todoService.updateTodo(id, {
          text: newText,
        });

        if (updatedTodo) {
          setTodos((prevTodos) =>
            prevTodos.map((t) =>
              t.id === id ? updatedTodo : t,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to edit todo:", error);
      }
    },
    [],
  );

  // Update todo priority
  const handleUpdatePriority = useCallback(
    async (id: string, newPriority: TodoPriority) => {
      setTodos((prevTodos) => {
        const todo = prevTodos.find((t) => t.id === id);
        if (!todo) return prevTodos;

        // Calculate new order
        const newPriorityTodos = prevTodos.filter(
          (t) =>
            t.category === todo.category &&
            t.priority === newPriority,
        );
        const maxOrder =
          newPriorityTodos.length > 0
            ? Math.max(
                ...newPriorityTodos.map((t) => t.order || 0),
              )
            : -1;

        const updatedTodo = {
          ...todo,
          priority: newPriority,
          order: maxOrder + 1,
        };

        // Update storage
        todoService.updateTodo(id, {
          priority: newPriority,
          order: maxOrder + 1,
        });

        return prevTodos.map((t) =>
          t.id === id ? updatedTodo : t,
        );
      });
    },
    [],
  );

  // Move todo to different category
  const handleMoveTodo = useCallback(
    async (id: string, newCategory: TodoCategory) => {
      setTodos((prevTodos) => {
        const todo = prevTodos.find((t) => t.id === id);
        if (!todo) return prevTodos;

        // Calculate new order
        const targetTodos = prevTodos.filter(
          (t) =>
            t.category === newCategory &&
            t.priority === todo.priority,
        );
        const maxOrder =
          targetTodos.length > 0
            ? Math.max(...targetTodos.map((t) => t.order || 0))
            : -1;

        const updatedTodo = {
          ...todo,
          category: newCategory,
          order: maxOrder + 1,
        };

        // Update storage
        todoService.updateTodo(id, {
          category: newCategory,
          order: maxOrder + 1,
        });

        return prevTodos.map((t) =>
          t.id === id ? updatedTodo : t,
        );
      });
    },
    [],
  );

  // Reorder todo within same category and priority
  const handleReorderTodo = useCallback(
    (
      category: TodoCategory,
      priority: TodoPriority,
      dragIndex: number,
      hoverIndex: number,
    ) => {
      setTodos((prevTodos) => {
        // Get todos in this priority section
        const priorityTodos = prevTodos.filter(
          (t) =>
            t.category === category && t.priority === priority,
        );
        const otherTodos = prevTodos.filter(
          (t) =>
            !(
              t.category === category && t.priority === priority
            ),
        );

        // Reorder
        const draggedTodo = priorityTodos[dragIndex];
        const reordered = [...priorityTodos];
        reordered.splice(dragIndex, 1);
        reordered.splice(hoverIndex, 0, draggedTodo);

        // Update order field
        const updated = reordered.map((todo, index) => ({
          ...todo,
          order: index,
        }));

        // Debounce storage updates - batch them together
        // Clear any pending updates
        if (handleReorderTodo.timeoutId) {
          clearTimeout(handleReorderTodo.timeoutId);
        }
        
        // Schedule batch update
        handleReorderTodo.timeoutId = setTimeout(() => {
          // Batch update all items at once
          Promise.all(
            updated.map((todo) =>
              todoService.updateTodo(todo.id, { order: todo.order })
            )
          ).catch((error) => {
            console.error('Failed to update todo order:', error);
          });
        }, 500) as any;

        return [...otherTodos, ...updated];
      });
    },
    [],
  ) as any;
  
  // Add timeout property to function for debouncing
  handleReorderTodo.timeoutId = null as any;

  // Memoized filtered and sorted todos by category
  const allgemeinTodos = useMemo(() => {
    const filtered = todos
      .filter((t) => t.category === "allgemein" && !t.completed)
      .sort((a, b) => {
        const priorityOrder = {
          hoch: 0,
          mittel: 1,
          niedrig: 2,
        };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (a.order || 0) - (b.order || 0);
      });
    console.log(
      "🔄 allgemeinTodos recalculated:",
      filtered.length,
    );
    return filtered;
  }, [todos]);

  const dailyTodos = useMemo(() => {
    return todos
      .filter((t) => t.category === "daily" && !t.completed)
      .sort((a, b) => {
        const priorityOrder = {
          hoch: 0,
          mittel: 1,
          niedrig: 2,
        };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (a.order || 0) - (b.order || 0);
      });
  }, [todos]);

  const weeklyTodos = useMemo(() => {
    return todos
      .filter((t) => t.category === "weekly" && !t.completed)
      .sort((a, b) => {
        const priorityOrder = {
          hoch: 0,
          mittel: 1,
          niedrig: 2,
        };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (a.order || 0) - (b.order || 0);
      });
  }, [todos]);

  const completedTodos = useMemo(() => {
    return todos
      .filter((t) => t.completed)
      .sort((a, b) => {
        const priorityOrder = {
          hoch: 0,
          mittel: 1,
          niedrig: 2,
        };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (a.order || 0) - (b.order || 0);
      });
  }, [todos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CheckSquare className="size-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Lade To-Dos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-[1600px] mx-auto h-[calc(100vh-4rem)]">
          <div className="flex gap-6 h-full">
            <TodoCard
              title="Allgemein"
              category="allgemein"
              todos={allgemeinTodos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              onUpdatePriority={handleUpdatePriority}
              onMoveTodo={handleMoveTodo}
              onAddTodo={(text, date, priority) =>
                handleAddTodo("allgemein", text, date, priority)
              }
              onReorderTodo={handleReorderTodo}
            />

            <TodoCard
              title="Daily"
              category="daily"
              todos={dailyTodos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              onUpdatePriority={handleUpdatePriority}
              onMoveTodo={handleMoveTodo}
              onAddTodo={(text, date, priority) =>
                handleAddTodo("daily", text, date, priority)
              }
              onReorderTodo={handleReorderTodo}
            />

            <TodoCard
              title="Weekly"
              category="weekly"
              todos={weeklyTodos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              onUpdatePriority={handleUpdatePriority}
              onMoveTodo={handleMoveTodo}
              onAddTodo={(text, date, priority) =>
                handleAddTodo("weekly", text, date, priority)
              }
              onReorderTodo={handleReorderTodo}
            />

            <TodoCard
              title="Erledigt"
              category="erledigt"
              todos={completedTodos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              onClearCompleted={handleClearCompleted}
              isCompletedCard={true}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;