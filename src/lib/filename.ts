/**
 * Extract a human-readable session name from a FIT filename.
 * Pattern: {digits}_{Name_With_Underscores}.fit
 * Returns undefined if the filename does not match.
 */
export const extractSessionName = (filename: string): string | undefined => {
  const match = filename.match(/^\d+_(.+)\.fit$/i);
  if (!match) return undefined;
  const captured = match[1];
  if (!captured) return undefined;
  const name = captured.replace(/_/g, ' ').trim();
  if (name.length > 0) {
    return name;
  }
  return undefined;
};
