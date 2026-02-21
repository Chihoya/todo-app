import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TodoCard } from "@/app/components/TodoCard";
import { ChecklistCard } from "@/app/components/ChecklistCard";
import { MobileTabBar } from "@/app/components/MobileTabBar";
import { AuthScreen } from "@/app/components/AuthScreen";
import { CheckSquare } from "lucide-react";
import { Todo, TodoCategory, TodoPriority } from "@/types/todo";
import { todoService } from "@/services/todoService";
import { authService } from "@/services/authService";
import { supabaseAuthService } from "@/services/supabaseAuthService";
import { supabase } from "@/services/supabase";
import { sortTodosByPriorityAndOrder, calculateMaxOrder } from "@/utils/todoHelpers";
import { Plus } from "lucide-react";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMobileCategory, setActiveMobileCategory] = useState<TodoCategory | 'dailyChecklist'>('allgemein');
  const [isAllgemeinArchiveView, setIsAllgemeinArchiveView] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
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
    try {
      // Create todo with temporary order
      const newTodo = await todoService.createTodo({
        text,
        completed: false,
        category,
        date,
        priority,
        order: 0,
      });
      
      // Update state and calculate correct order
      setTodos(prevTodos => {
        const maxOrder = calculateMaxOrder(prevTodos, category, priority);
        const todoWithOrder = { ...newTodo, order: maxOrder + 1 };
        
        // Update order in storage
        todoService.updateTodo(todoWithOrder.id, { order: todoWithOrder.order });
        
        return [...prevTodos, todoWithOrder];
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
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

        const maxOrder = calculateMaxOrder(prevTodos, todo.category, newPriority);

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

        const maxOrder = calculateMaxOrder(prevTodos, newCategory, todo.priority);

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

  // Helper function to filter and sort todos
  const filterAndSortTodos = useCallback((category: string, includeCompleted = false) => {
    return todos
      .filter((t) => {
        if (includeCompleted) return t.completed;
        return t.category === category && !t.completed;
      })
      .sort(sortTodosByPriorityAndOrder);
  }, [todos]);

  // Helper function specifically for checklist (shows both completed and uncompleted)
  const filterAndSortChecklistTodos = useCallback((category: string) => {
    return todos
      .filter((t) => t.category === category)
      .sort(sortTodosByPriorityAndOrder);
  }, [todos]);

  // Memoized filtered and sorted todos by category
  const allgemeinTodos = useMemo(() => filterAndSortTodos("allgemein"), [filterAndSortTodos]);
  const dailyChecklistTodos = useMemo(() => filterAndSortChecklistTodos("dailyChecklist"), [filterAndSortChecklistTodos]);
  const completedTodos = useMemo(() => filterAndSortTodos("", true), [filterAndSortTodos]);

  // Reset all checklist items to uncompleted
  const handleResetChecklist = useCallback(async () => {
    const checklistTodos = todos.filter(t => t.category === 'dailyChecklist' && t.completed);
    
    // Optimistically update UI first
    setTodos(prevTodos => prevTodos.map(t => 
      t.category === 'dailyChecklist' && t.completed 
        ? { ...t, completed: false }
        : t
    ));

    // Then update storage
    try {
      await Promise.all(
        checklistTodos.map(todo => 
          todoService.updateTodo(todo.id, { completed: false })
        )
      );
    } catch (error) {
      console.error('Failed to reset checklist:', error);
      // Revert on error
      loadTodos();
    }
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
      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-[#FBFEFE]">
        <div className="px-[16px] py-[32px] h-full">
          <div className="flex gap-[16px] h-[calc(100vh-64px)]">
              <TodoCard
                title={isAllgemeinArchiveView ? "Archiv" : "Allgemein"}
                category="allgemein"
                todos={isAllgemeinArchiveView ? completedTodos : allgemeinTodos}
                onToggleComplete={handleToggleComplete}
                onDeleteTodo={handleDeleteTodo}
                onEditTodo={handleEditTodo}
                onUpdatePriority={!isAllgemeinArchiveView ? handleUpdatePriority : undefined}
                onMoveTodo={!isAllgemeinArchiveView ? handleMoveTodo : undefined}
                onAddTodo={!isAllgemeinArchiveView ? (text, date, priority) =>
                  handleAddTodo("allgemein", text, date, priority) : undefined
                }
                onReorderTodo={!isAllgemeinArchiveView ? handleReorderTodo : undefined}
                onClearCompleted={isAllgemeinArchiveView ? handleClearCompleted : undefined}
                isCompletedCard={isAllgemeinArchiveView}
                isArchiveView={isAllgemeinArchiveView}
                onToggleArchive={() => setIsAllgemeinArchiveView(!isAllgemeinArchiveView)}
              />

              <ChecklistCard
                title="Daily Checkliste"
                todos={dailyChecklistTodos}
                onToggleComplete={handleToggleComplete}
                onDeleteTodo={handleDeleteTodo}
                onEditTodo={handleEditTodo}
                onAddTodo={(text) =>
                  handleAddTodo("dailyChecklist", text, undefined, 'niedrig')
                }
                onResetAll={handleResetChecklist}
              />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden h-screen bg-white flex flex-col overflow-hidden">
        {/* Todo Card Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {activeMobileCategory === 'allgemein' && (
            <TodoCard
              title={isAllgemeinArchiveView ? "Archiv" : "Allgemein"}
              category="allgemein"
              todos={isAllgemeinArchiveView ? completedTodos : allgemeinTodos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              onUpdatePriority={!isAllgemeinArchiveView ? handleUpdatePriority : undefined}
              onMoveTodo={!isAllgemeinArchiveView ? handleMoveTodo : undefined}
              onAddTodo={!isAllgemeinArchiveView ? (text, date, priority) =>
                handleAddTodo("allgemein", text, date, priority) : undefined
              }
              onReorderTodo={!isAllgemeinArchiveView ? handleReorderTodo : undefined}
              onClearCompleted={isAllgemeinArchiveView ? handleClearCompleted : undefined}
              isCompletedCard={isAllgemeinArchiveView}
              isArchiveView={isAllgemeinArchiveView}
              onToggleArchive={() => setIsAllgemeinArchiveView(!isAllgemeinArchiveView)}
              isMobileView={true}
            />
          )}
          {activeMobileCategory === 'dailyChecklist' && (
            <ChecklistCard
              title="Daily Checkliste"
              todos={dailyChecklistTodos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              onAddTodo={(text) =>
                handleAddTodo("dailyChecklist", text, undefined, 'niedrig')
              }
              onResetAll={handleResetChecklist}
              isMobileView={true}
            />
          )}
        </div>

        {/* Sticky Bottom Container - Tabs + Input */}
        <div className="shrink-0 bg-[#f7fcff] flex flex-col gap-[16px] pb-[40px] pt-[24px] px-[16px]">
          {/* Tab Bar */}
          <MobileTabBar
            activeCategory={activeMobileCategory}
            onCategoryChange={(category) => setActiveMobileCategory(category)}
          />
          
          {/* Mobile Input Area */}
          <div className="w-full">
            {activeMobileCategory === 'allgemein' && !isAllgemeinArchiveView && (
              <AllgemeinMobileInput 
                onAddTodo={(text, date, priority) => handleAddTodo("allgemein", text, date, priority)}
              />
            )}
            {activeMobileCategory === 'dailyChecklist' && (
              <ChecklistMobileInput 
                onAddTodo={(text) => handleAddTodo("dailyChecklist", text, undefined, 'niedrig')}
              />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;

// Mobile Input Components
function AllgemeinMobileInput({ 
  onAddTodo 
}: { 
  onAddTodo: (text: string, date?: string, priority?: TodoPriority) => void 
}) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('niedrig');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTodo(text.trim(), date || undefined, priority);
      setText('');
      setDate('');
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-[8px] items-center">
      {/* Date Button with Transparent Overlay */}
      <div className="relative size-[40px] shrink-0">
        <input
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

      {/* Priorität Button - Zyklisch 3→1→2→3 */}
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

      {/* Input mit Plus Icon innen */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-white border border-[#999da1] rounded-[4px] pl-[12px] pr-[44px] py-[8px] h-[40px] text-[16px] font-['Source_Sans_Pro',sans-serif] focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
          placeholder="Neue Aufgabe hinzufügen..."
          ref={inputRef}
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
  );
}

function ChecklistMobileInput({ 
  onAddTodo 
}: { 
  onAddTodo: (text: string) => void 
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTodo(text.trim());
      setText('');
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-white border border-[#999da1] rounded-[4px] pl-[12px] pr-[44px] py-[8px] min-h-[40px] text-[16px] font-['Source_Sans_Pro',sans-serif] focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
          placeholder="Neuen Checkpunkt hinzufügen..."
          ref={inputRef}
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
  );
}