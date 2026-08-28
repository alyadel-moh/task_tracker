export const isValidISODate = (dateString?: unknown): boolean => {
  if (!dateString || typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isNumberInRange = (
  val: unknown,
  min: number = 0,
  max: number = 525600,
): boolean => {
  if (typeof val !== "number" || !Number.isFinite(val)) return false;
  return val >= min && val <= max;
};
