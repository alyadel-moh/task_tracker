export const isValidISODate = (date?: unknown): boolean => {
  if (!date) return false;
  if (date instanceof Date) return !isNaN(date.getTime());
  if (typeof date !== "string") return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

export const isNumberInRange = (
  val: unknown,
  min: number = 0,
  max: number = 525600,
): boolean => {
  if (typeof val !== "number" || !Number.isFinite(val)) return false;
  return val >= min && val <= max;
};
