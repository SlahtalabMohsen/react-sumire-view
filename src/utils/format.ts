/** Formats a byte count as a compact human-readable string. */
export function formatBytes(bytes: number): string {
  if (!isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exponent);
  const rounded = exponent === 0 ? value : value.toFixed(exponent === 1 ? 1 : 0);
  return `${rounded} ${units[exponent]}`;
}
