export function isTruthyEnv(value?: string | null): boolean {
  if (!value) {
    return false;
  }

  return ['true', '1', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
}
