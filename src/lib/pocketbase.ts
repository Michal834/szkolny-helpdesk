import PocketBase from "pocketbase";

// Adres PocketBase pochodzi ze zmiennej środowiskowej (wstawianej w czasie buildu).
const url = process.env.NEXT_PUBLIC_POCKETBASE_URL;

if (!url && typeof window !== "undefined") {
  console.error("Brak zmiennej NEXT_PUBLIC_POCKETBASE_URL (zob. .env.example).");
}

export const pb = new PocketBase(url || "http://127.0.0.1:8090");

// Wiele równoległych zapytań w React (Strict Mode) nie ma się nawzajem anulować.
pb.autoCancellation(false);
