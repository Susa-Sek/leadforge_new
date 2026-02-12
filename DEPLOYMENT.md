# Deployment Guide - manyleads.io

Umfassende Anleitung für das Deployment von manyleads.io auf Vercel.

## 📋 Voraussetzungen

- ✅ Vercel Account ([vercel.com](https://vercel.com))
- ✅ GitHub Repository mit dem Projekt verbunden
- ✅ Supabase Projekt läuft (`mffvbluqnfgnthwlavlj`)
- ✅ Zugriff auf Supabase Dashboard ([supabase.com](https://supabase.com/dashboard))

## 🚀 Schnellstart (5 Minuten)

### 1. Vercel Projekt erstellen

**Option A: Via Vercel Dashboard (Empfohlen)**

1. Gehe zu [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klicke "Add New" > "Project"
3. Importiere dein GitHub Repository
4. Framework Preset: **Next.js** (wird automatisch erkannt)
5. Root Directory: `./` (Standard)
6. **NICHT JETZT DEPLOYEN!** - Erst Environment Variables setzen

**Option B: Via Vercel CLI**

```bash
# Vercel CLI installieren (falls noch nicht installiert)
npm i -g vercel

# In Projektverzeichnis navigieren
cd DEV_Projekts

# Projekt initialisieren
vercel

# Follow the prompts:
# - Set up and deploy? N (No - wir setzen erst Env Vars)
# - Link to existing project? N
# - Project name: manyleads-io (oder dein Wunschname)
# - Directory: ./
# - Override settings? N
```

### 2. Environment Variables konfigurieren

#### Supabase Keys abrufen

1. Öffne [Supabase Dashboard](https://supabase.com/dashboard/project/mffvbluqnfgnthwlavlj/settings/api)
2. Kopiere folgende Keys:
   - **URL**: `https://mffvbluqnfgnthwlavlj.supabase.co`
   - **anon/public key**: Unter "Project API keys" > "anon public"
   - **service_role key**: Unter "Project API keys" > "service_role" ⚠️ **KRITISCH - Geheim halten!**

#### In Vercel Dashboard hinzufügen

1. Gehe zu **Settings** > **Environment Variables**
2. Füge folgende Variablen hinzu (eine nach der anderen):

**ERFORDERLICH (3 Variables):**

| Variable Name                    | Value                                          | Environments        |
|----------------------------------|------------------------------------------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | `https://mffvbluqnfgnthwlavlj.supabase.co`    | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | `<your_anon_key>`                              | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY`      | `<your_service_role_key>` ⚠️                   | Production, Preview |

**OPTIONAL:**

| Variable Name           | Value                  | Note                                  |
|-------------------------|------------------------|---------------------------------------|
| `APIFY_API_TOKEN`       | `<your_apify_token>`   | Für Lead-Scraping (kann später)      |
| `ENABLE_MOCK_DATA`      | `false`                | Nur `true` für Testing ohne Apify    |

> 💡 **Tipp**: Verwende `.env.vercel.example` als Referenz

#### Via Vercel CLI hinzufügen

```bash
# Environment Variables setzen
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://mffvbluqnfgnthwlavlj.supabase.co
# Environments: Production, Preview (Leertaste zum Auswählen)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: <your_anon_key>

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: <your_service_role_key>
```

### 3. Deployment durchführen

**Option A: Via GitHub (Empfohlen)**

```bash
# Alle Änderungen committen
git add .
git commit -m "fix: Use service client for credits display and admin queries"
git push origin main

# Vercel deployt automatisch bei jedem Push zu main!
# Status verfolgen: https://vercel.com/dashboard
```

**Option B: Via Vercel CLI**

```bash
# Production Deployment
vercel --prod

# Oder für Preview Deployment
vercel
```

### 4. Deployment verifizieren

Nach erfolgreichem Deployment:

#### a) Health Check testen

```bash
# Health Check Endpoint aufrufen
curl https://your-domain.vercel.app/api/health

# Erwartete Response:
{
  "status": "ok",
  "message": "Health check passed",
  "serviceClient": "connected",
  "environment": "configured",
  "envCheck": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true
  },
  "timestamp": "2025-02-12T10:30:00.000Z"
}
```

#### b) Dashboard Credits testen

1. Öffne `https://your-domain.vercel.app`
2. Melde dich als User an
3. Navigiere zu `/dashboard`
4. **Credits sollten korrekt angezeigt werden** (nicht 0!)

#### c) Admin Portal testen

1. Melde dich als Admin an
2. Navigiere zu `/admin`
3. **User-Liste sollte sichtbar sein**
4. Teste Credit-Vergabe an einen User
5. Keine RLS-Fehler in Browser Console

## 🔧 Vercel Konfiguration

Die Datei `vercel.json` ist bereits konfiguriert:

```json
{
  "regions": ["fra1"],
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

- **Region**: Frankfurt (`fra1`) für EU-DSGVO Compliance
- **Framework**: Next.js 16 mit Turbopack
- **Build**: Optimiert für Production

## 🐛 Troubleshooting

### Problem: Health Check schlägt fehl

**Symptom**: `/api/health` gibt Status 500 oder "error"

**Lösung**:

1. Überprüfe Environment Variables in Vercel:
   ```bash
   vercel env ls
   ```

2. Stelle sicher, dass `SUPABASE_SERVICE_ROLE_KEY` gesetzt ist:
   - Gehe zu Vercel Dashboard > Settings > Environment Variables
   - Prüfe, ob alle 3 Supabase-Variablen existieren
   - Falls nicht: Füge sie hinzu und **redeploy**

3. Redeploy erzwingen:
   - Vercel Dashboard > Deployments > Latest > "..." > "Redeploy"

### Problem: Credits zeigen immer noch 0

**Symptom**: Dashboard zeigt 0 Credits, obwohl User Credits hat

**Ursache**: Service Client wird nicht verwendet oder RLS blockiert

**Lösung**:

1. Prüfe Vercel Logs:
   ```bash
   vercel logs --prod
   ```

2. Suche nach `[getDashboardStats]` Logs:
   - Sollte erscheinen: `[getDashboardStats] Stats fetched successfully`
   - Falls RLS-Fehler: `SUPABASE_SERVICE_ROLE_KEY` fehlt oder ist falsch

3. Service Role Key neu setzen:
   - Hol dir neuen Key von Supabase Dashboard
   - Vercel Dashboard > Settings > Environment Variables
   - Bearbeite `SUPABASE_SERVICE_ROLE_KEY`
   - Redeploy

### Problem: Admin Portal zeigt keine User

**Symptom**: Admin-Seite lädt, aber User-Liste ist leer oder zeigt Fehler

**Lösung**:

1. Browser DevTools Console öffnen (F12)
2. Prüfe auf RLS Policy Fehler:
   ```
   Error: new row violates row-level security policy
   ```

3. Falls RLS-Fehler:
   - `SUPABASE_SERVICE_ROLE_KEY` fehlt oder ist falsch
   - Siehe "Service Role Key neu setzen" oben

4. Prüfe Vercel Server Logs:
   ```bash
   vercel logs --prod | grep "Admin"
   ```

### Problem: Build schlägt fehl

**Symptom**: Vercel Deployment endet mit "Build failed"

**Häufige Ursachen**:

1. **TypeScript Fehler**:
   ```bash
   # Lokal testen
   npm run build
   ```

2. **Fehlende Dependencies**:
   ```bash
   npm install
   npm run build
   ```

3. **Environment Variables zur Build-Zeit**:
   - `NEXT_PUBLIC_*` Variablen müssen zur Build-Zeit verfügbar sein
   - Prüfe in Vercel: Settings > Environment Variables
   - Stelle sicher, dass sie für "Production" aktiviert sind

### Problem: Deployment erfolgreich, aber Seite lädt nicht

**Symptom**: 500 Internal Server Error oder leere Seite

**Lösung**:

1. Prüfe Vercel Runtime Logs:
   ```bash
   vercel logs --prod --follow
   ```

2. Teste Health Check Endpoint:
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

3. Falls "service client query failed":
   - Supabase Projekt ist nicht erreichbar
   - Prüfe Supabase Status: [status.supabase.com](https://status.supabase.com)
   - Prüfe Supabase RLS Policies (sollten für service_role deaktiviert sein)

## 📊 Monitoring & Logs

### Vercel Logs anzeigen

```bash
# Echtzeit-Logs (Production)
vercel logs --prod --follow

# Letzte 100 Logs
vercel logs --prod

# Logs filtern (z.B. nach Errors)
vercel logs --prod | grep ERROR

# Logs für spezifischen Zeitraum
vercel logs --prod --since 1h
vercel logs --prod --since "2025-02-12 10:00"
```

### Wichtige Log-Patterns

Suche nach folgenden Logs für Debugging:

- `[getDashboardStats]` - Dashboard Credits Queries
- `[Admin Users API]` - Admin User Management
- `[Admin Credits API]` - Credit-Vergabe
- `[Health Check]` - Service Client Status
- `RLS policy` - Row Level Security Fehler (sollten NICHT erscheinen!)

### Performance Monitoring

- **Vercel Analytics**: Automatisch aktiviert
  - Dashboard > Analytics
  - Web Vitals, Core Web Vitals, Traffic

- **Supabase Logs**:
  - [Supabase Dashboard](https://supabase.com/dashboard/project/mffvbluqnfgnthwlavlj/logs/postgres-logs)
  - Prüfe auf langsame Queries

## 🔐 Sicherheit

### Service Role Key schützen

⚠️ **KRITISCH**: `SUPABASE_SERVICE_ROLE_KEY` ist ein SUPER-KEY!

- ✅ **NUR** in Server-Side Code verwenden
- ✅ **NUR** in Vercel Environment Variables speichern
- ❌ **NIEMALS** in Client-Code oder Git committen
- ❌ **NIEMALS** in `NEXT_PUBLIC_*` Variablen

### Environment Variables Best Practices

1. **Verschiedene Keys für Production/Preview**:
   - Production: Eigene Service Role Key
   - Preview: Separate Supabase Projekt oder Key

2. **Key Rotation**:
   ```bash
   # Falls Service Role Key kompromittiert:
   # 1. Neuen Key in Supabase generieren
   # 2. In Vercel aktualisieren
   # 3. Alten Key in Supabase löschen
   # 4. Redeploy erzwingen
   ```

3. **Access Control**:
   - Nur Admins sollten Zugriff auf Vercel Projekt haben
   - Enable 2FA für Vercel Account
   - Enable 2FA für Supabase Account

## 🔄 CI/CD Workflow

### Automatisches Deployment

```bash
# Main Branch = Production
git push origin main
# → Vercel deployt automatisch auf Production

# Feature Branches = Preview
git push origin feature/neue-funktion
# → Vercel erstellt Preview Deployment mit eigener URL
```

### Deployment Environments

- **Production**: `https://manyleads.vercel.app`
- **Preview**: `https://manyleads-<branch>-<team>.vercel.app`
- **Development**: Lokal (`npm run dev`)

## 📚 Weiterführende Ressourcen

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## 🆘 Support

Falls Probleme bestehen:

1. **Logs prüfen**: `vercel logs --prod`
2. **Health Check testen**: `curl /api/health`
3. **Vercel Status**: [vercel-status.com](https://www.vercel-status.com/)
4. **Supabase Status**: [status.supabase.com](https://status.supabase.com/)

---

**Letzte Aktualisierung**: 2025-02-12
**Version**: 1.0.0
**Framework**: Next.js 16.1.1 + Supabase + Vercel
