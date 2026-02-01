/**
 * Simple Authentication Service (LocalStorage)
 * 
 * System: Ein festes Passwort für alle Benutzer
 * - Passwort wird in .env als VITE_APP_PASSWORD gesetzt
 * - Alle mit dem Passwort sehen die gleichen To-Dos
 */

const SESSION_KEY = 'todo_pwa_session';

// Hash-Funktion (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  /**
   * Prüfe ob ein App-Passwort in .env gesetzt ist
   */
  hasPassword(): boolean {
    const appPassword = import.meta.env.VITE_APP_PASSWORD;
    return !!appPassword && appPassword.trim() !== '';
  },

  /**
   * Hole das App-Passwort aus .env
   */
  getConfiguredPassword(): string | null {
    return import.meta.env.VITE_APP_PASSWORD || null;
  },

  /**
   * Prüfe Passwort gegen das konfigurierte Passwort
   */
  async verifyPassword(password: string): Promise<boolean> {
    const configuredPassword = this.getConfiguredPassword();
    
    if (!configuredPassword) {
      console.error('❌ Kein Passwort in .env konfiguriert!');
      return false;
    }

    // Einfacher String-Vergleich (könnte auch gehasht werden)
    return password === configuredPassword;
  },

  /**
   * Session Management (lokal im SessionStorage)
   */
  createSession(): void {
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 Stunden
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, expiresAt }));
    
    if (import.meta.env.DEV) {
      console.log('✅ Session created until:', new Date(expiresAt).toLocaleString());
    }
  },

  hasValidSession(): boolean {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) return false;

    try {
      const { expiresAt } = JSON.parse(sessionData);
      const isValid = Date.now() < expiresAt;
      
      if (!isValid) {
        if (import.meta.env.DEV) {
          console.log('⏰ Session expired');
        }
        this.logout();
      }
      
      return isValid;
    } catch {
      return false;
    }
  },

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    if (import.meta.env.DEV) {
      console.log('👋 Logged out');
    }
  },
};

// Mache logout global verfügbar
if (typeof window !== 'undefined') {
  (window as any).__logout = () => {
    authService.logout();
    window.location.reload();
  };
}