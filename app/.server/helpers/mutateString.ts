export const searchString = (str: string) => {
  return str
          .split('')
          .map(chr => '%' + chr + '%')
          .join('');
};