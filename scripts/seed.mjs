// Tworzy konta testowe (użytkownik + technik) i przykładowe zgłoszenia.
// Użycie (Node 18+):
//   PB_URL=http://127.0.0.1:8090 PB_SUPERUSER_EMAIL=... PB_SUPERUSER_PASSWORD=... node scripts/seed.mjs
// Dane superusera podajesz tylko w zmiennych środowiskowych – nie trafiają do repozytorium.

const url = (process.env.PB_URL || "http://127.0.0.1:8090").replace(/\/$/, "");
const adminEmail = process.env.PB_SUPERUSER_EMAIL;
const adminPassword = process.env.PB_SUPERUSER_PASSWORD;

// Konta testowe z README (hasło demonstracyjne, tylko do testów).
const TEST_PASSWORD = process.env.SEED_PASSWORD || "Test12345!";
const accounts = [
  { email: "uczen@szkola.test", name: "Jan Uczeń", role: "user" },
  { email: "technik@szkola.test", name: "Anna Technik", role: "technician" },
];

if (!adminEmail || !adminPassword) {
  console.error("Ustaw PB_SUPERUSER_EMAIL i PB_SUPERUSER_PASSWORD.");
  process.exit(1);
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const { token: adminToken } = await api("/api/collections/_superusers/auth-with-password", {
  method: "POST",
  body: { identity: adminEmail, password: adminPassword },
});

const ids = {};
for (const acc of accounts) {
  const existing = await api(
    `/api/collections/users/records?filter=${encodeURIComponent(`email="${acc.email}"`)}`,
    { token: adminToken }
  );
  if (existing.items.length) {
    ids[acc.role] = existing.items[0].id;
    // rolę może ustawić superuser
    await api(`/api/collections/users/records/${ids[acc.role]}`, {
      method: "PATCH",
      token: adminToken,
      body: { role: acc.role },
    });
    console.log(`= ${acc.email} już istnieje (rola: ${acc.role})`);
    continue;
  }
  const rec = await api("/api/collections/users/records", {
    method: "POST",
    token: adminToken,
    body: {
      email: acc.email,
      name: acc.name,
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      emailVisibility: true,
      verified: true,
      role: acc.role,
    },
  });
  ids[acc.role] = rec.id;
  console.log(`+ utworzono ${acc.email} (rola: ${acc.role})`);
}

// Przykładowe zgłoszenia – wysyłane jako użytkownik testowy (przez reguły API).
const { token: userToken } = await api("/api/collections/users/auth-with-password", {
  method: "POST",
  body: { identity: accounts[0].email, password: TEST_PASSWORD },
}).catch(() => ({ token: null }));

if (userToken) {
  const existing = await api("/api/collections/tickets/records?perPage=1", { token: userToken });
  if (existing.totalItems === 0) {
    const samples = [
      ["Nie działa rzutnik", "Rzutnik w sali nie włącza się po naciśnięciu przycisku zasilania.", "Sala 102", "multimedia", "wysoki"],
      ["Cieknący kran", "W toalecie kran cały czas kapie, na podłodze jest kałuża.", "Pokój nauczycielski", "instalacje", "sredni"],
      ["Komputer nie uruchamia się", "Stanowisko nauczyciela wyświetla czarny ekran po włączeniu.", "Pracownia informatyczna 1", "sprzet_komputerowy", "wysoki"],
    ];
    for (const [title, description, room, category, priority] of samples) {
      await api("/api/collections/tickets/records", {
        method: "POST",
        token: userToken,
        body: { title, description, room, category, priority, status: "nowe", author: ids.user },
      });
      console.log(`+ zgłoszenie: ${title}`);
    }
  }
}

console.log(`\nGotowe. Hasło kont testowych: ${TEST_PASSWORD}`);
