import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: 'allgemein' | 'daily' | 'weekly';
  onAdd: (text: string, date?: string) => void;
}

export function AddTodoDialog({
  open,
  onOpenChange,
  category,
  onAdd,
}: AddTodoDialogProps) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim(), date || undefined);
      setText('');
      setDate('');
      onOpenChange(false);
    }
  };

  const categoryLabels = {
    allgemein: 'Allgemein',
    daily: 'Daily',
    weekly: 'Weekly',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neues To-Do hinzufügen</DialogTitle>
          <DialogDescription>
            Füge ein neues To-Do zur Kategorie "{categoryLabels[category]}" hinzu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Aufgabe *</Label>
              <Input
                id="text"
                placeholder="Was möchtest du erledigen?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Datum (optional)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
