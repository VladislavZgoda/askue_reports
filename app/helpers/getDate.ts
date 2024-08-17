export default function todayDate() {
  const date = new Date().toLocaleDateString('en-CA');

  return date;
}
