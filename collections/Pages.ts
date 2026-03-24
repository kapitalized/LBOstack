import type { CollectionConfig } from 'payload';

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length ? s : null;
}

function clamp(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function titleToKeywords(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 3)
    .slice(0, 8);
  const uniq = Array.from(new Set(['lbostack', ...words]));
  return uniq.join(', ');
}

function buildCanonical(slug: string): string | null {
  const base = asNonEmptyString(process.env.NEXT_PUBLIC_APP_URL);
  if (!base) return null;
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedSlug = slug.startsWith('/') ? slug.slice(1) : slug;
  return `${normalizedBase}/${normalizedSlug}`;
}

function ensurePageSeoFields(input: Record<string, unknown>): Record<string, unknown> {
  const title = asNonEmptyString(input.title) ?? undefined;
  const slug = asNonEmptyString(input.slug) ?? undefined;
  const out: Record<string, unknown> = { ...input };
  if (!asNonEmptyString(out.metaTitle) && title) out.metaTitle = clamp(title, 60);
  if (!asNonEmptyString(out.metaDescription) && title) out.metaDescription = clamp(`${title} — LBO Deal Modelling & Analysis.`, 160);
  if (!asNonEmptyString(out.metaKeywords) && title) out.metaKeywords = titleToKeywords(title);
  if (!asNonEmptyString(out.canonicalUrl) && slug) {
    const canonical = buildCanonical(slug);
    if (canonical) out.canonicalUrl = canonical;
  }
  return out;
}

/**
 * Marketing pages with SEO tab. Used by getPageMetadata when fetching from CMS.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation !== 'create' && operation !== 'update') return data;
        // Only fill missing values; do not overwrite editor-provided SEO fields.
        return ensurePageSeoFields(data as Record<string, unknown>);
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { description: 'URL path, e.g. about' } },
    { name: 'metaTitle', type: 'text', admin: { description: 'SEO: overrides default title' } },
    { name: 'metaDescription', type: 'textarea', admin: { description: 'SEO: 150–160 chars' } },
    { name: 'metaKeywords', type: 'text', admin: { description: 'SEO: comma-separated keywords' } },
    { name: 'canonicalUrl', type: 'text', admin: { description: 'SEO: canonical URL' } },
    { name: 'indexPage', type: 'checkbox', defaultValue: true, admin: { description: 'Allow search engine indexing' } },
  ],
};
