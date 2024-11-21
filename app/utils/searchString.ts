export default function composeSearchString(str: string | null) {
  if (str && str.length > 0) {
    return str
      .split('')
      .map(chr => '%' + chr + '%')
      .join('');
  } else {
    return '%%';
  }
}
