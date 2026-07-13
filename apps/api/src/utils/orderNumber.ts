const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createOrderNumber(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const datePart = formatter.format(now).replaceAll("-", "");
  const randomPart = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${datePart}-${randomPart}`;
}
