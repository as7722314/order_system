export function phoneLast3(phone?: string | null): string {
  const value = phone?.trim() ?? "";
  const digits = value.replace(/\D/g, "");
  const last3 = digits.slice(-3) || value.slice(-3);
  return last3 || "-";
}