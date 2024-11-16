export function searchString(str: string | null) {
  if (str && str.length > 0) {
    return str
      .split('')
      .map(chr => '%' + chr + '%')
      .join('');
  } else {
    return '%%';
  }
}

export function cutOutYear(date: string) {
  return Number(date.slice(0, 4));
}

export function cutOutMonth(date: string) {
  return date.slice(5, 7);
}