export function todayDate() {
  const date = new Date().toLocaleDateString("en-CA");

  return date;
}

export function cutOutYear(date: string) {
  return Number(date.slice(0, 4));
}

export function cutOutMonth(date: string) {
  return date.slice(5, 7);
}

export function validatePreviousMonthDate(
  currentMonth: string,
  previousMonth: string,
) {
  const difference =
    Number(cutOutMonth(currentMonth)) - Number(cutOutMonth(previousMonth));

  return difference === 1;
}
