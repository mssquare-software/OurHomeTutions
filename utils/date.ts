export function formatToday(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
}