import type { RecordModel } from "pocketbase";

export type Role = "user" | "technician";
export type TicketStatus = "nowe" | "w_realizacji" | "zamkniete";

export interface User extends RecordModel {
  email: string;
  name?: string;
  role?: Role | "";
}

export interface Ticket extends RecordModel {
  title: string;
  description: string;
  room: string;
  category: string;
  priority: "niski" | "sredni" | "wysoki";
  status: TicketStatus;
  comment?: string;
  author: string;
  photo?: string;
  expand?: { author?: User };
}

export interface TicketEvent extends RecordModel {
  ticket: string;
  actor?: string;
  from_status?: TicketStatus | "";
  to_status?: TicketStatus | "";
  comment?: string;
  expand?: { actor?: User };
}
