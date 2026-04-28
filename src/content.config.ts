// Astro content-collections configuration.
//
// The `docs` collection drives /docs. Each MDX file under
// `src/content/docs/` describes ONE top-level section of the Atto
// specification. The render page (see `src/pages/docs.astro`)
// sorts entries by `order`, derives the section eyebrow from
// `${order} — ${label}`, and assembles the sidebar navigation from
// the collection itself — add a new MDX file with an `order:`
// value and it renders automatically, no cross-file sync needed.
//
// Schema philosophy: every field is required-or-explicitly-optional,
// kebab-case is enforced for anchor ids, and `sub` exists only for
// sections that surface child anchors in the sidebar (Document
// Header, Content Blocks, Protocol Blocks, Font References).

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const kebab = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case');

const docs = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/docs',
  }),
  schema: z.object({
    // Section number. Renders as a zero-padded "02" in the eyebrow.
    order: z.number().int().min(1),

    // Anchor id used by the sidebar link and any cross-references.
    // Must match the visible <section id="..."> attribute.
    id: kebab,

    // Sidebar label and eyebrow trailer (e.g. "Frontmatter").
    label: z.string().min(1),

    // Visible h2 title for the section (e.g. "Frontmatter.").
    // The trailing period is intentional — matches the typographic
    // convention used throughout /docs.
    title: z.string().min(1),

    // Heading level for the injected section title.
    // §01 Overview is the only section that uses h1 (it doubles as
    // the page-level title); every other section is h2.
    headingLevel: z.union([z.literal(1), z.literal(2)]).default(2),

    // Optional version badge rendered next to the heading inside a
    // `.docs-title-row` flex row. Used by §01 Overview to surface
    // "v0" alongside the page title.
    versionBadge: z.string().optional(),

    // Optional sidebar sub-anchors. Only declared for sections whose
    // h3 children are referenced in the navigation (e.g. ::callout
    // under Content Blocks). The h3 itself owns the matching
    // `id="..."` attribute inside the MDX body.
    sub: z
      .array(
        z.object({
          id: kebab,
          label: z.string().min(1),
        }),
      )
      .optional(),
  }),
});

export const collections = { docs };
