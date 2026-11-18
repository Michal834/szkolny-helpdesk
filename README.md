# Szkolny Helpdesk

System zgłaszania usterek w szkole (projekt zaliczeniowy). Użytkownik zgłasza usterkę (np. niedziałający
rzutnik), technik widzi wszystkie zgłoszenia, zmienia ich status i komentuje.

**Stack:** Next.js (App Router, TypeScript) · shadcn/ui + Tailwind · PocketBase · Coolify na VPS (OVH)

- Aplikacja: `https://helpdesk.TWOJA-DOMENA.pl` <!-- uzupełnij -->
- PocketBase: `https://pb.TWOJA-DOMENA.pl` <!-- uzupełnij -->

## Zrzuty ekranu

<!-- Wstaw własne zrzuty do docs/screenshots/ i odkomentuj -->
<!--
![Logowanie](docs/screenshots/login.png)
![Lista zgłoszeń użytkownika](docs/screenshots/moje-zgloszenia.png)
![Nowe zgłoszenie](docs/screenshots/nowe-zgloszenie.png)
![Panel technika](docs/screenshots/panel-technika.png)
![Tryb ciemny na telefonie](docs/screenshots/mobile-dark.png)
-->

## Funkcje

**Podstawowe:** rejestracja i logowanie (e-mail + hasło), role użytkownik/technik, dodawanie zgłoszeń
(tytuł, opis, sala, kategoria, priorytet, zdjęcie ≤ 5 MB), użytkownik widzi tylko swoje zgłoszenia,
technik: tabela, filtry (status, sala, priorytet), zmiana statusu i komentarz, walidacja formularzy
(react-hook-form + zod).

**Rozszerzone:** realtime (lista technika odświeża się sama), historia zmian w kolekcji `ticket_events`,
dashboard technika, tryb jasny/ciemny, układ responsywny.

## Uruchomienie lokalnie

Wymagane: Node.js 20+, Docker (dla PocketBase).

```bash
# 1. PocketBase (migracje z kolekcjami i regułami wczytają się same)
docker compose up -d --build
#    panel: http://127.0.0.1:8090/_/  (superuser z PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD,
#    domyślnie admin@example.com / change-me-12345 – tylko lokalnie)

# 2. Frontend
cp .env.example .env.local        # NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
npm install
npm run dev                       # http://localhost:3000

# 3. (opcjonalnie) konta testowe i przykładowe zgłoszenia
PB_SUPERUSER_EMAIL=admin@example.com PB_SUPERUSER_PASSWORD=change-me-12345 node scripts/seed.mjs
```

Zamiast Dockera możesz pobrać binarkę PocketBase i uruchomić ją w katalogu `pocketbase/`:
`./pocketbase serve --migrationsDir=pb_migrations --hooksDir=pb_hooks`.

## Konta testowe

| Rola | E-mail | Hasło |
|------|--------|-------|
| Użytkownik | `uczen@szkola.test` | `Test12345!` |
| Technik | `technik@szkola.test` | `Test12345!` |

Konta tworzy `scripts/seed.mjs`. Rolę `technician` może nadać tylko superuser (panel PocketBase →
kolekcja `users` → pole `role`).

## Reguły API (bezpieczeństwo)

Dane chronią reguły PocketBase (`pocketbase/pb_migrations/`), a nie interfejs:

| Kolekcja | Reguła |
|----------|--------|
| `users` | rejestracja bez możliwości ustawienia `role`; edycja własnego konta bez zmiany `role`; technik widzi autorów zgłoszeń |
| `tickets` | list/view: `author = @request.auth.id` lub technik; create: tylko jako ja sam, status `nowe`, bez komentarza; update: tylko technik i tylko `status` + `comment`; delete: tylko superuser |
| `ticket_events` | list/view: autor zgłoszenia lub technik; create/update/delete zablokowane dla API – wpisy tworzy hook serwerowy `pb_hooks/ticket_events.pb.js` |

Test ręczny (użytkownik A nie może czytać zgłoszeń użytkownika B):

```bash
PB=https://pb.TWOJA-DOMENA.pl
TOKEN=$(curl -s $PB/api/collections/users/auth-with-password \
  -H 'Content-Type: application/json' \
  -d '{"identity":"uczen@szkola.test","password":"Test12345!"}' | jq -r .token)

curl -s "$PB/api/collections/tickets/records" -H "Authorization: $TOKEN"          # tylko własne
curl -s "$PB/api/collections/tickets/records/ID_CUDZEGO" -H "Authorization: $TOKEN" # 404
curl -s -X PATCH "$PB/api/collections/users/records/MOJE_ID" -H "Authorization: $TOKEN" \
  -H 'Content-Type: application/json' -d '{"role":"technician"}'                    # 400/404
```

## Wdrożenie w Coolify

Dwie osobne usługi z tego samego repozytorium (Application → *Dockerfile*):

### 1. PocketBase

| Ustawienie | Wartość |
|-----------|---------|
| Build pack | Dockerfile |
| Base directory | `/pocketbase` |
| Dockerfile location | `/Dockerfile` |
| Port | `8090` |
| Domena | `https://pb.TWOJA-DOMENA.pl` |
| **Persistent Storage** | Volume → Destination Path: `/pb/pb_data` |
| Zmienne (runtime) | `PB_SUPERUSER_EMAIL`, `PB_SUPERUSER_PASSWORD` |

Wolumen na `/pb/pb_data` zapewnia, że restart i redeploy kontenera nie kasują danych (baza, pliki,
zdjęcia). Migracje i hooki są częścią obrazu i same się stosują przy starcie.

### 2. Frontend (Next.js)

| Ustawienie | Wartość |
|-----------|---------|
| Build pack | Dockerfile |
| Base directory | `/` |
| Port | `3000` |
| Domena | `https://helpdesk.TWOJA-DOMENA.pl` |
| Zmienna **Build Variable** | `NEXT_PUBLIC_POCKETBASE_URL=https://pb.TWOJA-DOMENA.pl` |

`NEXT_PUBLIC_*` jest wstawiane w czasie buildu – po zmianie adresu zrób **Redeploy** (Wariant A: ręcznie).

### DNS (OVH)

Rekordy `A` dla `helpdesk` i `pb` wskazują na adres IP VPS. Coolify (Traefik) wystawia certyfikaty
Let's Encrypt automatycznie po dodaniu domen w ustawieniach aplikacji.

## Struktura

```
src/app/            strony (login, rejestracja, zgloszenia, technik)
src/components/     komponenty UI (shadcn/ui) i wspólne
src/lib/            klient PocketBase, auth, schematy zod, stałe
pocketbase/         Dockerfile, migracje (kolekcje + reguły), hooki
scripts/seed.mjs    konta testowe i dane przykładowe
```

## Zmienne środowiskowe

Patrz `.env.example`. W repozytorium nie ma haseł, tokenów ani pliku `.env`.
