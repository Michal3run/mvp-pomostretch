/**
 * Formats a duration in seconds into a standard MM:SS string representation.
 * Clamps negative values to "00:00".
 */
export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  const mStr = minutes.toString().padStart(2, "0");
  const sStr = remainingSeconds.toString().padStart(2, "0");

  return `${mStr}:${sStr}`;
}
