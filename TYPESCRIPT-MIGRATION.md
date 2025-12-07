# TypeScript Strict Mode Migration Plan

Dieser Guide beschreibt die schrittweise Aktivierung des TypeScript Strict Mode.

## Aktueller Status

**Strict Mode:** ❌ Deaktiviert
**Aktivierte Checks:**
- ✅ `noUnusedLocals` - Warnt bei ungenutzten Variablen
- ✅ `noFallthroughCasesInSwitch` - Verhindert fallthrough in switch-Statements

**Noch zu aktivieren:**
- ⏳ `noUnusedParameters` - Warnt bei ungenutzten Function-Parametern
- ⏳ `noImplicitAny` - Verhindert implizite `any` Types
- ⏳ `strictNullChecks` - Strenge null/undefined Checks
- ⏳ `strict` - Alle strict Checks aktivieren

---

## Migration Roadmap

### Phase 1: Non-Breaking Changes ✅ DONE

**Status:** Abgeschlossen
**Aktiviert:**
- `noUnusedLocals: true`
- `noFallthroughCasesInSwitch: true`

Diese verursachen keine Breaking Changes, nur Warnungen.

---

### Phase 2: noImplicitAny (Geschätzt: 2-4 Stunden)

**Ziel:** Alle impliziten `any` Types eliminieren

**Vorgehen:**
1. Aktiviere `noImplicitAny: true` in `tsconfig.app.json`
2. Run TypeScript Check:
   ```bash
   cd frontend
   npm run build
   ```
3. Fixe alle Errors schrittweise:
   - Starte mit Utility-Files (`src/lib/`, `src/utils/`)
   - Dann Services (`src/services/`)
   - Dann Components (`src/components/`, `src/features/`)
   - Zuletzt Pages (`src/pages/`)

**Häufige Fixes:**
```typescript
// ❌ Vorher (implizites any)
function handleClick(e) {
  console.log(e.target.value);
}

// ✅ Nachher
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log(e.currentTarget.value);
}
```

**Geschätzter Aufwand:**
- ~50-100 Fehler erwartet
- ~2-3 Minuten pro Fehler

---

### Phase 3: strictNullChecks (Geschätzt: 4-8 Stunden)

**Ziel:** Null-Safety garantieren

**Vorgehen:**
1. Aktiviere `strictNullChecks: true`
2. Fixe alle Null-Check-Errors

**Häufige Probleme:**

#### Problem 1: Möglicherweise undefined

```typescript
// ❌ Error: Object is possibly 'undefined'
const user = useAppStore().user;
console.log(user.name);

// ✅ Fix 1: Optional Chaining
console.log(user?.name);

// ✅ Fix 2: Guard Clause
if (!user) return null;
console.log(user.name);

// ✅ Fix 3: Non-null Assertion (nur wenn sicher!)
console.log(user!.name);
```

#### Problem 2: Array.find() returns T | undefined

```typescript
// ❌ Error: Object is possibly 'undefined'
const campaign = campaigns.find(c => c.id === id);
setCampaign(campaign);

// ✅ Fix: Handle undefined case
const campaign = campaigns.find(c => c.id === id);
if (campaign) {
  setCampaign(campaign);
} else {
  console.error('Campaign not found');
}
```

#### Problem 3: localStorage kann null zurückgeben

```typescript
// ❌ Error: Argument of type 'string | null' is not assignable
const storedValue = localStorage.getItem('key');
JSON.parse(storedValue);

// ✅ Fix: Null-Check
const storedValue = localStorage.getItem('key');
if (storedValue) {
  JSON.parse(storedValue);
}
```

**Geschätzter Aufwand:**
- ~100-200 Fehler erwartet
- ~3-5 Minuten pro Fehler

---

### Phase 4: Alle Strict Checks (Geschätzt: 2-4 Stunden)

**Ziel:** Vollständiger Strict Mode

**Vorgehen:**
1. Aktiviere `strict: true` in `tsconfig.app.json`
2. Deaktiviere alle individuellen strict-Flags (werden durch `strict` überschrieben)
3. Fixe verbleibende Errors:
   - `strictBindCallApply`
   - `strictFunctionTypes`
   - `strictPropertyInitialization`
   - etc.

**Finale Config:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Migration Commands

### Check TypeScript Errors
```bash
cd frontend
npx tsc --noEmit
```

### Check specific file
```bash
cd frontend
npx tsc --noEmit src/services/apiClient.ts
```

### ESLint Check (parallel)
```bash
cd frontend
npm run lint
```

---

## Tools & Helpers

### VS Code Settings

Aktiviere in `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Auto-Fix Script

```bash
# ESLint kann einige TypeScript-Probleme auto-fixen
cd frontend
npm run lint -- --fix
```

---

## Testing während Migration

**Wichtig:** Nach jeder Phase testen!

```bash
# Frontend build (zeigt TypeScript-Errors)
cd frontend
npm run build

# Frontend dev server (zeigt Errors in Echtzeit)
npm run dev

# Manuelle Tests im Browser
# - Login flow
# - Campaign creation
# - Voting flow
# - Budget contribution
```

---

## Geschätzter Gesamtaufwand

| Phase | Aufwand | Priorität |
|-------|---------|-----------|
| Phase 1: Non-Breaking | ✅ Done | High |
| Phase 2: noImplicitAny | 2-4 Stunden | High |
| Phase 3: strictNullChecks | 4-8 Stunden | Medium |
| Phase 4: Full Strict | 2-4 Stunden | Low |

**Total:** 8-16 Stunden

---

## Benefits nach Migration

✅ **Bessere Type-Safety** - Weniger Runtime-Errors
✅ **Bessere IDE-Unterstützung** - Autocomplete & IntelliSense
✅ **Frühere Fehler-Erkennung** - Errors beim Kompilieren statt zur Laufzeit
✅ **Bessere Refactoring-Sicherheit** - TypeScript warnt bei Breaking Changes
✅ **Code-Qualität** - Zwingt zu expliziten Typen

---

## Nächste Schritte

1. **Jetzt:** Phase 1 ist abgeschlossen ✅
2. **Nächste Woche:** Phase 2 starten (`noImplicitAny`)
3. **In 2 Wochen:** Phase 3 (`strictNullChecks`)
4. **In 1 Monat:** Phase 4 (Full Strict Mode)

Bei Fragen zur Migration siehe:
- [TypeScript Strict Mode Docs](https://www.typescriptlang.org/tsconfig#strict)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
