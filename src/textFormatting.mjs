// Unity rich-text formatting affects presentation, not the searchable text.
export function stripRichText(text) {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*|=[^<>]*)?\s*\/?>/gi, '');
}
