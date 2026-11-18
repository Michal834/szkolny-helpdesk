/* eslint-disable @next/next/no-img-element */
import { pb } from "@/lib/pocketbase";
import type { Ticket } from "@/lib/types";

// Zdjęcie usterki. Używamy miniatury (400x300) zdefiniowanej w kolekcji PocketBase,
// a pełny rozmiar otwiera się po kliknięciu.
export function TicketPhoto({ ticket, full = false }: { ticket: Ticket; full?: boolean }) {
  if (!ticket.photo) return null;
  const thumb = pb.files.getURL(ticket, ticket.photo, full ? undefined : { thumb: "400x300" });
  const original = pb.files.getURL(ticket, ticket.photo);
  return (
    <a href={original} target="_blank" rel="noreferrer" className="block">
      <img
        src={thumb}
        alt={`Zdjęcie usterki: ${ticket.title}`}
        className="max-h-80 w-full rounded-md border object-cover"
        loading="lazy"
      />
    </a>
  );
}
