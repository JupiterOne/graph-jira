export default function getTime(
  time: Date | string | undefined | null,
): number | undefined {
  return time ? new Date(time).getTime() : undefined;
}
