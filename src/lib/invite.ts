import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type EventRow = Tables<"events">;
export type GiftRow = Tables<"gifts">;

export const CATEGORIES = [
  "Todos",
  "Cozinha",
  "Quarto",
  "Banheiro",
  "Casa",
  "Limpeza e lavanderia",
  "Presentes coletivos",
] as const;

export const EVENT_DATE = new Date("2026-10-17T00:00:00-03:00");

export function isPlaceholder(value?: string | null) {
  return !value || value.trim().startsWith("[");
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLongDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function whatsappLink(phone: string, message: string) {
  const digits = onlyDigits(phone);
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

export async function fetchEvent() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchGifts() {
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
