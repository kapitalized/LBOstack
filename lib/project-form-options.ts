/** Country options for project form (dropdown). */
export const COUNTRY_OPTIONS = [
  '',
  'Spain',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Portugal',
  'Ireland',
  'Netherlands',
  'Belgium',
  'United States',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Saudi Arabia',
  'Other',
] as const;

/** Allowed `project_main.project_status` values only (legacy labels are rejected / cleared). */
export const ALLOWED_PROJECT_STATUSES = ['Active', 'Pause', 'Archive'] as const;
export type AllowedProjectStatus = (typeof ALLOWED_PROJECT_STATUSES)[number];

/** API / UI: return null for unknown or legacy stored values (no mapping). */
export function sanitizeProjectStatus(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return (ALLOWED_PROJECT_STATUSES as readonly string[]).includes(t) ? t : null;
}

/** Status of project options for project form (dropdown). */
export const PROJECT_STATUS_OPTIONS = ['', ...ALLOWED_PROJECT_STATUSES] as const;
