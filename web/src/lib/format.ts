const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatRupees = (amount: number) => rupees.format(amount);

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const formatDate = (date: Date) => dateFormat.format(date);

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const DAY = 24 * 60 * 60 * 1000;

/** "today", "yesterday", "3 days ago", "in 2 weeks"… */
export function timeFromNow(date: Date) {
  const days = Math.round((date.getTime() - Date.now()) / DAY);
  if (Math.abs(days) < 7) return relative.format(days, "day");
  if (Math.abs(days) < 30) return relative.format(Math.round(days / 7), "week");
  return relative.format(Math.round(days / 30), "month");
}

/** Short label for a gig deadline, e.g. "Due in 5 days" or "Overdue". */
export function deadlineLabel(deadline: Date) {
  // Compare calendar days, not 24-hour blocks (deadlines are stored as 23:59 on the day).
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(deadline) - startOfDay(new Date())) / DAY);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** "Alice Kumar" -> "AK" for avatars. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
