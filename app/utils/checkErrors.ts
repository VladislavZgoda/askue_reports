export const isErrors = (errors: Record<string, string>) => {
  return Object.keys(errors).length > 0;
};
