# To-Do PWA - Installationsanleitung

## ✅ Was ist fertig:

Deine To-Do Progressive Web App ist jetzt einsatzbereit mit:
- ✅ 3 Kategorien: Allgemein, Daily, Weekly
- ✅ To-Dos hinzufügen, abhaken und löschen
- ✅ Datum zu To-Dos hinzufügen
- ✅ Drag & Drop zwischen Karten
- ✅ LocalStorage für Datenspeicherung
- ✅ PWA-Manifest für Installation
- ✅ Service Worker für Offline-Funktionalität
- ✅ Responsive Design für alle Geräte

## 📱 Installation auf verschiedenen Geräten:

### iPhone / iPad:
1. Öffne die App in Safari
2. Tippe auf das Teilen-Symbol (□↑)
3. Scrolle nach unten und wähle "Zum Home-Bildschirm"
4. Bestätige mit "Hinzufügen"
5. Die App erscheint als Icon auf deinem Home-Bildschirm

### Mac (Safari):
1. Öffne die App in Safari
2. Gehe zu "Ablage" → "Zum Dock hinzufügen"
3. Die App wird als eigenständige Anwendung im Dock angezeigt

### Mac/Windows (Chrome/Edge):
1. Öffne die App im Browser
2. Klicke auf das ⊕ Symbol (oder ⋮) in der Adressleiste
3. Wähle "Installieren" oder "App installieren"
4. Die App wird als Desktop-App installiert

## 🚀 Lokale Entwicklung:

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production Build erstellen
npm run build
```

## 🌐 Deployment-Optionen:

### GitHub Pages:
1. Pushe deinen Code zu GitHub
2. Gehe zu Repository Settings → Pages
3. Wähle Branch und `/root` Ordner
4. Deine App wird unter `https://username.github.io/repo-name` verfügbar sein

### Netlify/Vercel:
1. Verbinde dein GitHub Repository
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Automatisches Deployment bei jedem Push

### Eigener Server:
1. Erstelle einen Build: `npm run build`
2. Lade den `dist` Ordner auf deinen Server hoch
3. Stelle sicher, dass dein Server HTTPS unterstützt (PWA-Voraussetzung)

## 🔄 Supabase-Integration (später):

Wenn du bereit bist, deine Daten in Supabase zu speichern:
1. Sage mir Bescheid, dass du Supabase verbinden möchtest
2. Ich helfe dir bei der Einrichtung
3. Deine LocalStorage-Daten können dann migriert werden

## 📝 Hinweise:

- **Daten**: Aktuell werden alle To-Dos im Browser (LocalStorage) gespeichert
- **Synchronisation**: Ohne Supabase funktioniert die Sync zwischen Geräten noch nicht
- **Offline**: Die App funktioniert auch ohne Internet (nach erstem Laden)
- **Icons**: Füge eigene App-Icons hinzu (siehe `/public/icon-generation-info.md`)

## 🔒 Datenschutz:

- Alle Daten bleiben aktuell auf deinem Gerät
- Keine Verbindung zu externen Servern
- 100% privat und nicht im App Store

Viel Erfolg mit deiner To-Do App! 🎉
