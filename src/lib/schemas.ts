import { z } from "zod";
import { CATEGORIES, MAX_PHOTO_SIZE, PRIORITIES, ROOMS, STATUSES } from "./constants";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Podaj adres e-mail")
    .email("Nieprawidłowy adres e-mail"),
  password: z.string().min(1, "Podaj hasło"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki")
      .max(80, "Maksymalnie 80 znaków"),
    email: z
      .string()
      .min(1, "Podaj adres e-mail")
      .email("Nieprawidłowy adres e-mail"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .max(72, "Hasło może mieć maksymalnie 72 znaki"),
    passwordConfirm: z.string().min(1, "Powtórz hasło"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Hasła nie są takie same",
    path: ["passwordConfirm"],
  });

const roomValues = ROOMS as unknown as [string, ...string[]];
const categoryValues = CATEGORIES.map((c) => c.value) as unknown as [string, ...string[]];
const priorityValues = PRIORITIES.map((p) => p.value) as unknown as [string, ...string[]];
const statusValues = STATUSES.map((s) => s.value) as unknown as [string, ...string[]];

export const ticketSchema = z.object({
  title: z
    .string()
    .min(3, "Tytuł musi mieć co najmniej 3 znaki")
    .max(120, "Tytuł może mieć maksymalnie 120 znaków"),
  description: z
    .string()
    .min(10, "Opis musi mieć co najmniej 10 znaków")
    .max(2000, "Opis może mieć maksymalnie 2000 znaków"),
  room: z.enum(roomValues, { errorMap: () => ({ message: "Wybierz salę" }) }),
  category: z.enum(categoryValues, {
    errorMap: () => ({ message: "Wybierz kategorię" }),
  }),
  priority: z.enum(priorityValues, {
    errorMap: () => ({ message: "Wybierz priorytet" }),
  }),
  photo: z
    .custom<File | undefined>()
    .refine((f) => !f || f instanceof File, "Nieprawidłowy plik")
    .refine((f) => !f || f.type.startsWith("image/"), "Dozwolone są tylko obrazy")
    .refine((f) => !f || f.size <= MAX_PHOTO_SIZE, "Zdjęcie może mieć maksymalnie 5 MB")
    .optional(),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

export const updateTicketSchema = z.object({
  status: z.enum(statusValues, { errorMap: () => ({ message: "Wybierz status" }) }),
  comment: z.string().max(1000, "Komentarz może mieć maksymalnie 1000 znaków"),
});

export type UpdateTicketValues = z.infer<typeof updateTicketSchema>;
