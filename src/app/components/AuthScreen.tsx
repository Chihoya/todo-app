import { useState } from 'react';
import { authService } from '@/services/authService';
import { supabaseAuthService } from '@/services/supabaseAuthService';
import { supabase } from '@/services/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Lock, Eye, EyeOff, Cloud, Database } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const usingSupabase = supabase !== null;
  const activeAuthService = usingSupabase ? supabaseAuthService : authService;
  const hasConfiguredPassword = activeAuthService.hasPassword();
  const isDevelopment = import.meta.env.DEV;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isValid = await activeAuthService.verifyPassword(password);
      
      if (isValid) {
        activeAuthService.createSession();
        onAuthenticated();
      } else {
        setError('Falsches Passwort');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  // Fehlerscreen nur in Development zeigen
  if (!hasConfiguredPassword && isDevelopment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-red-600 p-4 rounded-full">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              ⚠️ Kein Passwort konfiguriert
            </h1>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-4">
                <strong>Du musst zuerst ein Passwort setzen!</strong>
              </p>
              <ol className="text-sm text-red-700 space-y-2 list-decimal list-inside">
                <li>Erstelle eine <code className="bg-red-100 px-1 rounded">.env</code> Datei</li>
                <li>Füge hinzu:<br/>
                  <code className="bg-red-100 px-2 py-1 rounded block mt-1">
                    VITE_APP_PASSWORD=meinPasswort123
                  </code>
                </li>
                <li>Starte neu: <code className="bg-red-100 px-1 rounded">npm run dev</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In Production ohne Passwort: Generischer Fehler
  if (!hasConfiguredPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-600 p-4 rounded-full">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Konfigurationsfehler
            </h1>
            <p className="text-gray-600">
              Die App ist nicht korrekt konfiguriert. Bitte kontaktiere den Administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Willkommen
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Bitte gib das Passwort ein
          </p>

          {/* Mode Badge */}
          <div className="mb-6">
            <div className={`flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg ${
              usingSupabase 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
              {usingSupabase ? (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Multi-Device-Sync</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Lokaler Modus</span>
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  className="pr-10"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Lädt...' : 'Anmelden'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
