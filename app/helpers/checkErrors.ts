export const isErrors = (
  errors: { [k: string]: string; }
) => {
  return Object.keys(errors).length > 0;
};
