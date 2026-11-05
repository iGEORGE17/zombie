export const $ = <E extends HTMLElement = HTMLElement>(id: string): E => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as E;
};
