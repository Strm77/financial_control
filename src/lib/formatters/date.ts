import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIME_ZONE = "America/Sao_Paulo";

/** Interpreta uma data "YYYY-MM-DD" (coluna `date` do Postgres) como data local, sem deslocamento de fuso. */
export function parseDateOnly(value: string): Date {
  return parseISO(value);
}

/** Formata uma data (string ISO ou Date) no padrão brasileiro dd/MM/yyyy. */
export function formatDateBR(date: string | Date, pattern = "dd/MM/yyyy"): string {
  const parsed = typeof date === "string" ? parseDateOnly(date) : date;
  return format(parsed, pattern, { locale: ptBR });
}

/** Formata "agosto de 2026" a partir de uma data ou string "YYYY-MM-DD"/"YYYY-MM". */
export function formatMonthYearBR(date: string | Date): string {
  const parsed = typeof date === "string" ? parseDateOnly(normalizeMonthString(date)) : date;
  return format(parsed, "MMMM 'de' yyyy", { locale: ptBR });
}

function normalizeMonthString(value: string): string {
  return value.length === 7 ? `${value}-01` : value;
}

/** Formata só o nome do mês (ex: "Agosto") a partir de uma data ou string "YYYY-MM-DD"/"YYYY-MM". */
export function formatMonthNameBR(date: string | Date): string {
  const parsed = typeof date === "string" ? parseDateOnly(normalizeMonthString(date)) : date;
  const label = format(parsed, "MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Formata um timestamp ISO (com hora) considerando o fuso America/Sao_Paulo. */
export function formatDateTimeBR(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(isoTimestamp));
}

/** Retorna a data/hora atual "vista" a partir do fuso America/Sao_Paulo. */
export function nowInSaoPaulo(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
}

/** Formata um objeto Date como string "YYYY-MM-DD" (para enviar ao Postgres). */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
