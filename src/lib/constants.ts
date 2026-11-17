// Wartości muszą być zgodne z migracją PocketBase
// (pocketbase/pb_migrations/1731800000_init_helpdesk.js).

export const ROOMS = [
  "Sala 101",
  "Sala 102",
  "Sala 103",
  "Sala 104",
  "Sala 105",
  "Pracownia informatyczna 1",
  "Pracownia informatyczna 2",
  "Sala gimnastyczna",
  "Biblioteka",
  "Świetlica",
  "Pokój nauczycielski",
  "Aula",
] as const;

export const CATEGORIES = [
  { value: "sprzet_komputerowy", label: "Sprzęt komputerowy" },
  { value: "multimedia", label: "Multimedia" },
  { value: "instalacje", label: "Instalacje" },
  { value: "inne", label: "Inne" },
] as const;

export const PRIORITIES = [
  { value: "niski", label: "Niski" },
  { value: "sredni", label: "Średni" },
  { value: "wysoki", label: "Wysoki" },
] as const;

export const STATUSES = [
  { value: "nowe", label: "Nowe" },
  { value: "w_realizacji", label: "W realizacji" },
  { value: "zamkniete", label: "Zamknięte" },
] as const;

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

export function labelOf(
  list: readonly { value: string; label: string }[],
  value: string
) {
  return list.find((i) => i.value === value)?.label ?? value;
}
