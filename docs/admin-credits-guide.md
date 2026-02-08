# Admin Guide: Manuelle Credit-Verwaltung

> **Projekt:** Manyleads.io
> **Supabase Project ID:** `mffvbluqnfgnthwlavlj`
> **Datum:** Februar 2026
> **Zuletzt aktualisiert:** 2026-02-08

---

## Uebersicht

Diese Anleitung beschreibt, wie Admins Credits fuer User manuell setzen, aktualisieren und abrufen koennen. Alle Aenderungen werden in den Tabellen `credit_transactions` (Audit-Trail) und `admin_audit_logs` (Admin-Aktionen) protokolliert.

### Tabellen-Struktur

| Tabelle | Zweck |
|---------|-------|
| `user_credits` | Speichert `total_credits` und `used_credits` pro User |
| `credit_transactions` | Audit-Trail fuer alle Credit-Operationen (deduct, add, reset, refund) |
| `admin_audit_logs` | Protokollierung aller Admin-Aktionen |
| `user_roles` | Speichert User-Rollen (admin, user) |

### Credit-Berechnung

```
Verfuegbare Credits = total_credits - used_credits
```

---

## 1. Aktuellen Credit-Stand eines Users abrufen

### 1.1 Per User-ID (UUID)

```sql
-- Credit-Stand per User-ID abfragen
SELECT
  uc.user_id,
  u.email,
  uc.total_credits,
  uc.used_credits,
  (uc.total_credits - uc.used_credits) AS available_credits,
  uc.updated_at
FROM user_credits uc
JOIN auth.users u ON uc.user_id = u.id
WHERE uc.user_id = 'USER_UUID_HIER';
```

### 1.2 Per E-Mail-Adresse

```sql
-- Credit-Stand per E-Mail abfragen
SELECT
  uc.user_id,
  u.email,
  uc.total_credits,
  uc.used_credits,
  (uc.total_credits - uc.used_credits) AS available_credits,
  uc.updated_at
FROM user_credits uc
JOIN auth.users u ON uc.user_id = u.id
WHERE u.email = 'user@example.com';
```

### 1.3 Alle Users mit niedrigem Credit-Stand

```sql
-- Alle Users mit weniger als 10 verfuegbaren Credits
SELECT
  uc.user_id,
  u.email,
  uc.total_credits,
  uc.used_credits,
  (uc.total_credits - uc.used_credits) AS available_credits
FROM user_credits uc
JOIN auth.users u ON uc.user_id = u.id
WHERE (uc.total_credits - uc.used_credits) < 10
ORDER BY available_credits ASC;
```

---

## 2. Credits manuell setzen (Reset)

### 2.1 Credits auf bestimmten Wert setzen

```sql
-- Credits auf einen bestimmten Wert setzen (z.B. 100 Credits)
-- WICHTIG: Auch used_credits zuruecksetzen, wenn gewuenscht

WITH credit_update AS (
  UPDATE user_credits
  SET
    total_credits = 100,
    used_credits = 0,  -- Optional: Verbrauchte Credits auch zuruecksetzen
    updated_at = NOW()
  WHERE user_id = 'USER_UUID_HIER'
  RETURNING user_id, total_credits
),
transaction_insert AS (
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after,
    metadata
  )
  SELECT
    'USER_UUID_HIER',
    100,
    'reset',
    'Manueller Reset durch Admin',
    100,
    '{"admin_action": true, "reset_used": true}'::jsonb
  RETURNING id
)
INSERT INTO admin_audit_logs (
  admin_id,
  action,
  target_type,
  target_id,
  details
)
SELECT
  'ADMIN_UUID_HIER',  -- Deine Admin User-ID
  'credit_reset',
  'user_credits',
  'USER_UUID_HIER',
  jsonb_build_object(
    'new_total', 100,
    'reset_used', true,
    'previous_total', (SELECT total_credits FROM user_credits WHERE user_id = 'USER_UUID_HIER')
  );
```

### 2.2 Nur total_credits anpassen (used_credits behalten)

```sql
-- Credits auf 200 setzen, aber bisherigen Verbrauch behalten
UPDATE user_credits
SET
  total_credits = 200,
  updated_at = NOW()
WHERE user_id = 'USER_UUID_HIER';

-- Transaction loggen
INSERT INTO credit_transactions (
  user_id,
  amount,
  type,
  reason,
  balance_after,
  metadata
)
VALUES (
  'USER_UUID_HIER',
  200,
  'reset',
  'Manuelle Anpassung durch Admin - total_credits geaendert',
  200 - (SELECT used_credits FROM user_credits WHERE user_id = 'USER_UUID_HIER'),
  '{"admin_action": true, "reset_used": false}'::jsonb
);
```

---

## 3. Credits hinzufuegen (Add)

### 3.1 Credits zu bestehendem Stand addieren

```sql
-- 50 Credits zu bestehendem Stand hinzufuegen
WITH current_credits AS (
  SELECT
    total_credits,
    used_credits,
    (total_credits - used_credits) AS available
  FROM user_credits
  WHERE user_id = 'USER_UUID_HIER'
),
update_credits AS (
  UPDATE user_credits
  SET
    total_credits = total_credits + 50,
    updated_at = NOW()
  WHERE user_id = 'USER_UUID_HIER'
  RETURNING total_credits, used_credits
)
INSERT INTO credit_transactions (
  user_id,
  amount,
  type,
  reason,
  balance_after,
  metadata
)
SELECT
  'USER_UUID_HIER',
  50,
  'add',
  'Bonus-Credits durch Admin',
  (SELECT total_credits - used_credits FROM update_credits),
  jsonb_build_object(
    'admin_action', true,
    'added_amount', 50,
    'previous_total', (SELECT total_credits FROM current_credits)
  );
```

---

## 4. Credits erstatten (Refund)

### 4.1 Verbrauchte Credits zurueckerstatten

```sql
-- 25 Credits als Refund (z.B. wegen Fehler oder Reklamation)
WITH current_credits AS (
  SELECT
    total_credits,
    used_credits
  FROM user_credits
  WHERE user_id = 'USER_UUID_HIER'
),
update_credits AS (
  UPDATE user_credits
  SET
    used_credits = GREATEST(used_credits - 25, 0),  -- Nicht unter 0 gehen
    updated_at = NOW()
  WHERE user_id = 'USER_UUID_HIER'
  RETURNING total_credits, used_credits
)
INSERT INTO credit_transactions (
  user_id,
  amount,
  type,
  reason,
  balance_after,
  metadata
)
SELECT
  'USER_UUID_HIER',
  25,
  'refund',
  'Refund durch Admin - Suchfehler',
  (SELECT total_credits - used_credits FROM update_credits),
  jsonb_build_object(
    'admin_action', true,
    'refund_amount', 25,
    'reason_code', 'search_error',
    'previous_used', (SELECT used_credits FROM current_credits)
  );
```

---

## 5. Transaction History einsehen

### 5.1 Alle Transaktionen eines Users

```sql
-- Alle Credit-Transaktionen eines Users
SELECT
  ct.id,
  ct.amount,
  ct.type,
  ct.reason,
  ct.balance_after,
  ct.metadata,
  ct.created_at
FROM credit_transactions ct
WHERE ct.user_id = 'USER_UUID_HIER'
ORDER BY ct.created_at DESC;
```

### 5.2 Letzte Admin-Aktionen

```sql
-- Letzte 20 Admin-Aktionen anzeigen
SELECT
  aal.created_at,
  aal.action,
  aal.target_type,
  aal.target_id,
  p.email AS admin_email,
  aal.details
FROM admin_audit_logs aal
JOIN profiles p ON aal.admin_id = p.id
WHERE aal.action LIKE 'credit_%'
ORDER BY aal.created_at DESC
LIMIT 20;
```

---

## 6. Security & Best Practices

### 6.1 Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Admins muessen direkt ueber das Supabase Dashboard (SQL Editor) oder mit Service Role Key arbeiten.

**Wichtige RLS Policies:**

```sql
-- Users koennen nur ihre eigenen Credits sehen
CREATE POLICY "Users view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users koennen keine Credits manuell aendern
-- (Nur via Application Logic/Edge Functions)
```

### 6.2 Admin-Berechtigungen pruefen

```sql
-- Pruefen ob ein User Admin-Rechte hat
SELECT
  p.id,
  p.email,
  p.role,
  ur.role AS user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.id = 'ADMIN_UUID_HIER';
```

### 6.3 Admin-Aktionen immer loggen

Jede manuelle Credit-Aenderung MUSS in folgende Tabellen eingetragen werden:

1. `credit_transactions` - Fuer den User sichtbarer Audit-Trail
2. `admin_audit_logs` - Interne Admin-Aktions-Logs

### 6.4 Validierungen vor Aenderung

```sql
-- Pruefen ob User existiert
SELECT id, email
FROM auth.users
WHERE id = 'USER_UUID_HIER';

-- Aktuellen Stand pruefen vor Aenderung
SELECT * FROM user_credits WHERE user_id = 'USER_UUID_HIER';
```

---

## 7. Haeufige Operationen (Copy & Paste Templates)

### 7.1 Kompletter Reset auf 30 Credits (Neukunden-Standard)

```sql
-- User auf Standard-Credits (30) zuruecksetzen
DO $$
DECLARE
  v_user_id UUID := 'USER_UUID_HIER';
  v_admin_id UUID := 'ADMIN_UUID_HIER';
  v_new_credits INTEGER := 30;
BEGIN
  -- Credits zuruecksetzen
  UPDATE user_credits
  SET
    total_credits = v_new_credits,
    used_credits = 0,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Transaction loggen
  INSERT INTO credit_transactions (
    user_id, amount, type, reason, balance_after, metadata
  ) VALUES (
    v_user_id,
    v_new_credits,
    'reset',
    'Admin: Reset auf Standard-Credits',
    v_new_credits,
    jsonb_build_object('admin_id', v_admin_id, 'action', 'reset_to_standard')
  );

  -- Admin-Aktion loggen
  INSERT INTO admin_audit_logs (
    admin_id, action, target_type, target_id, details
  ) VALUES (
    v_admin_id,
    'credit_reset_standard',
    'user_credits',
    v_user_id,
    jsonb_build_object('new_credits', v_new_credits)
  );
END $$;
```

### 7.2 Schnelles Hinzufuegen von Credits

```sql
-- Schnell 100 Credits hinzufuegen
DO $$
DECLARE
  v_user_id UUID := 'USER_UUID_HIER';
  v_add_amount INTEGER := 100;
BEGIN
  UPDATE user_credits
  SET total_credits = total_credits + v_add_amount,
      updated_at = NOW()
  WHERE user_id = v_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, reason, balance_after)
  SELECT
    v_user_id,
    v_add_amount,
    'add',
    'Admin: Bonus-Credits',
    (total_credits - used_credits)
  FROM user_credits WHERE user_id = v_user_id;
END $$;
```

---

## 8. Troubleshooting

### 8.1 User hat keinen Credits-Eintrag

Falls ein User keinen Eintrag in `user_credits` hat:

```sql
-- Credits-Eintrag fuer neuen User erstellen
INSERT INTO user_credits (user_id, total_credits, used_credits)
VALUES ('USER_UUID_HIER', 30, 0)
ON CONFLICT (user_id) DO NOTHING;
```

### 8.2 Negative Credits verhindern

```sql
-- Sicherstellen dass keine negativen Werte entstehen
UPDATE user_credits
SET
  total_credits = GREATEST(total_credits, 0),
  used_credits = GREATEST(used_credits, 0)
WHERE user_id = 'USER_UUID_HIER';
```

### 8.3 Inkonsistente Daten finden

```sql
-- Users mit mehr verbrauchten als total Credits finden
SELECT
  user_id,
  total_credits,
  used_credits,
  (used_credits - total_credits) AS overspent
FROM user_credits
WHERE used_credits > total_credits;
```

---

## 9. Zugangsdaten & Links

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard/project/mffvbluqnfgnthwlavlj
- **SQL Editor:** SQL > New Query

### Wichtige Tabellen
- `public.user_credits` - Credit-Speicher
- `public.credit_transactions` - Transaktions-Log
- `public.admin_audit_logs` - Admin-Aktions-Log
- `auth.users` - User-Authentifizierung
- `public.profiles` - User-Profile

---

## 10. Checkliste fuer Admins

Vor jeder manuellen Credit-Aenderung:

- [ ] User-ID korrekt ueberprueft (per E-Mail verifizieren)
- [ ] Aktuellen Credit-Stand notiert
- [ ] Grund fuer Aenderung dokumentiert
- [ ] Transaction in `credit_transactions` eingetragen
- [ ] Aktion in `admin_audit_logs` protokolliert
- [ ] Berechnung ueberprueft: `total_credits - used_credits = available`

---

**Wichtiger Hinweis:** Alle manuellen Aenderungen sind ueber die Audit-Logs nachvollziehbar. Missbraeuchlicher Zugriff kann rechtliche Konsequenzen haben.
