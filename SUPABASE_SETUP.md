# Supabase Integration - Setup Anleitung

Diese Anleitung hilft dir, die To-Do PWA mit Supabase zu verbinden, um Daten zwischen mehreren Geräten zu synchronisieren.

## 🎯 Aktuelle Implementierung

Die App nutzt momentan **localStorage** für die Datenspeicherung. Alle CRUD-Operationen sind bereits über eine Service-Schicht abstrahiert, sodass der Wechsel zu Supabase einfach ist.

## 📋 Vorbereitungen (bereits erledigt)

✅ Service-Layer implementiert (`/src/services/todoService.ts`)
✅ TypeScript-Typen definiert (`/src/types/todo.ts`)
✅ Supabase-Service vorbereitet (`/src/services/supabaseTodoService.ts`)
✅ Environment-Variablen Template erstellt (`.env.example`)

## 🚀 Schritt-für-Schritt Migration zu Supabase

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein kostenloses Konto
3. Erstelle ein neues Projekt
4. Notiere dir die **Project URL** und den **Anon/Public Key**

### 2. Datenbank-Tabelle erstellen

Führe in der Supabase SQL Editor aus:

```sql
-- Todos Tabelle erstellen
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  category TEXT CHECK (category IN ('allgemein', 'daily', 'weekly')),
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnellere Abfragen nach Kategorie
CREATE INDEX idx_todos_category ON todos(category);

-- Index für created_at (sortierung)
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);

-- Row Level Security aktivieren
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann alle Todos lesen (für MVP ohne Authentifizierung)
CREATE POLICY "Todos sind öffentlich lesbar"
  ON todos
  FOR SELECT
  USING (true);

-- Policy: Jeder kann Todos erstellen
CREATE POLICY "Jeder kann Todos erstellen"
  ON todos
  FOR INSERT
  WITH CHECK (true);

-- Policy: Jeder kann Todos aktualisieren
CREATE POLICY "Jeder kann Todos aktualisieren"
  ON todos
  FOR UPDATE
  USING (true);

-- Policy: Jeder kann Todos löschen
CREATE POLICY "Jeder kann Todos löschen"
  ON todos
  FOR DELETE
  USING (true);
```

> **⚠️ Wichtig:** Die Policies oben erlauben öffentlichen Zugriff für MVP-Zwecke.
> Für eine Produktionsversion solltest du Authentifizierung hinzufügen und die Policies anpassen!

### 3. Supabase Client installieren

```bash
npm install @supabase/supabase-js
```

### 4. Umgebungsvariablen konfigurieren

1. Kopiere `.env.example` zu `.env`:

   ```bash
   cp .env.example .env
   ```

2. Füge deine Supabase Credentials ein:
   ```env
   VITE_SUPABASE_URL=https://dein-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=dein-anon-key
   ```

### 5. Supabase Client aktivieren

Öffne `/src/services/supabase.ts` und entferne die Kommentare:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Using localStorage fallback.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);
```

### 6. Supabase TodoService aktivieren

Öffne `/src/services/supabaseTodoService.ts` und entferne alle Kommentare im Code.

### 7. Service-Implementierung wechseln

Öffne `/src/services/todoService.ts` und ändere die letzte Zeile:

**Vorher (localStorage):**

```typescript
export const todoService: TodoService =
  new LocalStorageTodoService();
```

**Nachher (Supabase):**

```typescript
import { SupabaseTodoService } from "@/services/supabaseTodoService";

export const todoService: TodoService =
  new SupabaseTodoService();
```

### 8. App neu starten

```bash
npm run dev
```

## 🔄 Daten Migration (optional)

Wenn du bereits Todos im localStorage hast und diese zu Supabase migrieren möchtest:

1. Öffne die Browser-Konsole in deiner App
2. Führe diesen Code aus:

```javascript
// Todos aus localStorage holen
const localTodos = JSON.parse(localStorage.getItem('todo-pwa-data') || '[]');

// In Supabase importieren
for (const todo of localTodos) {
  await todoService.createTodo({
    text: todo.text,
    completed: todo.completed,
    category: todo.category,
    date: todo.date
  });
}

console.log(`${localTodos.length} Todos erfolgreich migriert!`);
```

## 📱 Realtime Updates (Optional)

Um Echtzeit-Synchronisation zwischen Geräten zu ermöglichen, kannst du Supabase Realtime nutzen:

```typescript
// In App.tsx useEffect hinzufügen:
useEffect(() => {
  if (!supabase) return;

  const channel = supabase
    .channel("todos-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "todos" },
      (payload) => {
        console.log("Change received!", payload);
        loadTodos(); // Todos neu laden
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## 🔐 Authentifizierung hinzufügen (Empfohlen für Produktion)

Für eine sichere Multi-User-Umgebung solltest du Supabase Auth integrieren:

1. Füge eine `user_id` Spalte zur `todos` Tabelle hinzu
2. Implementiere Supabase Auth (Email/Password oder OAuth)
3. Passe die RLS Policies an, sodass User nur ihre eigenen Todos sehen

## 🎯 Vorteile nach der Migration

✅ Geräteübergreifende Synchronisation
✅ Automatische Backups durch Supabase
✅ Skalierbarkeit für mehrere Benutzer
✅ Optional: Realtime Updates
✅ Optional: Authentifizierung und Benutzerverwaltung

## 🆘 Problembehebung

**Problem:** "Supabase client not initialized"

- Lösung: Überprüfe, ob `.env` die richtigen Werte enthält und der Dev-Server neu gestartet wurde

**Problem:** Keine Todos werden angezeigt

- Lösung: Überprüfe in Supabase Dashboard > Table Editor, ob Daten vorhanden sind
- Prüfe die Browser-Konsole auf Fehler
- Stelle sicher, dass RLS Policies korrekt konfiguriert sind

**Problem:** "Failed to fetch todos"

- Lösung: Überprüfe deine Supabase URL und Anon Key
- Stelle sicher, dass das Supabase-Projekt aktiv ist

## 📚 Weitere Ressourcen

- [Supabase Dokumentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)