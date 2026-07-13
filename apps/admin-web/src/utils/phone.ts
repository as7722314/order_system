export function phoneLast3(phone?: string | null): string {
  const value = phone?.trim() ?? "";
  const digits = value.replace(/\D/g, "");
  const last3 = digits.slice(-3) || value.slice(-3);
  return last3 || "-";
}

export function formatPhoneLast3(phone?: string | null): string {
  const last3 = phoneLast3(phone);
  return last3 === "-" ? "手機後三碼 -" : `手機後三碼 ${last3}`;
}