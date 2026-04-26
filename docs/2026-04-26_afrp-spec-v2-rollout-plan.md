# AFRP spec v2 — marketing site rollout plan

**Source:** `2026-04-25_atto-font-registry-spec_2.md`
**Affects:** `/apply`, `/docs` (AFRP section), `Footer.astro`

---

## 1. What changed in the spec

### 1.1 Tier 1 `@scope` — no longer self-serve

Before: any qualifying entity could apply for a Tier 1 scope through a public form. Six eligibility criteria (identity, originality, catalog depth ≥5, license transparency, ARCTS, Code of Conduct). Four fee tiers from $0 (Individual) to negotiated (Enterprise). 5-day acknowledgement / 30-day review.

After:

- **Invitation-only ratification** by the Atto Protocol Authority's Technical Review Panel. Reserved for foundational infrastructure providers (5+ years operational history, institutional backing, demonstrable permanence).
- **Five criteria** — catalog depth and originality are gone. Replaced with `infrastructure permanence` as Criterion 1.
- **Flat $2,500/year** for every Tier 1 holder. The four-tier fee ladder is gone.
- **10-business-day** acknowledgement, **60-calendar-day** review.
- Expression of interest only via `mailto:registry@atto.tech`.
- Suspended scopes pay a **$500 reinstatement** charge if revived inside the 180-day grace; after that, a **12-month quarantine** locks the name.

### 1.2 New: Atto Hosted Registry Service (AHRS)

Brand-new §7 of the spec. Managed AFRP-compliant registry hosting for publishers who don't want to self-host. Resolves as Form C (no `@scope`) at `hosted.fonts.atto.tech/{publisher-slug}/` or a customer-brought CNAME.

| Tier | Families | Storage | Bandwidth | SLA | Custom domain | Annual / Monthly |
|---|---|---|---|---|---|---|
| **Indie** | 3 | 1 GB | 10 GB/mo | 99.9% | No | $99 / $12 |
| **Studio** | 20 | 10 GB | 100 GB/mo | 99.9% | Yes | $399 / $49 |
| **Foundry** | Unlimited | 50 GB | 1 TB/mo | 99.95% | Yes (priority DNS) | $1,599 / $199 |
| **Enterprise** | Unlimited | Negotiated | Negotiated | Negotiated | Yes | Negotiated |

Bandwidth overage $0.08/GB. Storage overage $0.20/GB/mo (Studio + Foundry only). Onboarding ack within 2 business days, registry live within 5 business days.

### 1.3 New architectural framing — "three paths to AFRP compliance"

Spec §1.3 now explicitly enumerates three paths a publisher can take:

1. **Self-host** (Form C) — no registration required.
2. **Atto-hosted registry** (Form C, AHRS) — subscription-based managed hosting.
3. **Tier 1 ratified scope** (Form B) — invitation-only.

This framing is the headline structure all marketing copy should adopt.

### 1.4 Smaller spec touches worth noting

- New well-known endpoint path `/.well-known/atto-font-registry.json` for the registry-level manifest (current docs reference is implicit).
- Revocation language tightened: 24-hour removal from shorthand registry, 12-month quarantine.
- Sub-scope delegation language unchanged but worth re-checking against the docs version.

---

## 2. Marketing site work

Ordered by ideal completion sequence. Difficulty in points (S / M / L). Each item is a self-contained PR-sized chunk.

### Group A — `/apply` rebuild (L · single largest item)

**Why first:** the page currently embodies the deprecated 4-tier self-serve Tier 1 model. Until it is rebuilt around AHRS, the `apply` link from `/docs` and the Footer points users at a misleading workflow.

Rebuild as the **AHRS subscription onboarding** wizard. Reuse the existing 6-step shell; replace contents:

- **Step 1 — Tier & publisher slug** (was: Tier & scope)
  - Tier picker: Indie / Studio / Foundry / Enterprise with the new monthly + annual price points.
  - Slug input (replaces `@scope`): segmented `hosted.fonts.atto.tech/_/`, with the same lowercase ABNF rules.
  - Optional custom-domain input visible only on Studio / Foundry / Enterprise.
- **Step 2 — Identity** (mostly unchanged)
  - Same fields. Trim the verification-method radio to two options (trademark / WHOIS-domain) — the `foundry credentials` path is no longer a route into AHRS since hosting doesn't require the long-history credential.
- **Step 3 — Font submission & metadata** (was: Catalog & originality)
  - Replace the typeface-family textarea with a per-family table: name, designer, foundry, SPDX license, commercial flag, woff2 file picker.
  - Drop the originality attestation — AHRS still has the rights/originality clause but it sits on the Code of Conduct page now.
  - Drop the family-count threshold and the waiver textarea (no longer applicable — tiers cap families instead).
- **Step 4 — License & technical declaration** (was: Technical compliance)
  - Replace ARCTS report upload with: SPDX license confirmation, "rights to distribute" attestation, malware-free attestation. Atto generates the manifest and runs ARCTS server-side under AHRS — the publisher does not.
  - Keep the registry-base-URL idea but auto-fill from the Step 1 slug as a read-only preview.
- **Step 5 — Code of Conduct** (mostly unchanged)
  - Update the prohibited-conduct list to match §7.4 (drop the scope-squatting clause; add the false-license + malware clauses verbatim).
  - SignatureWidget stays.
- **Step 6 — Review & subscribe** (was: Review & submit)
  - Fee callout changes from "annual fee" to "subscription" with both monthly and annual prices and the overage rates.
  - "Submit" copy becomes "Start subscription" or "Submit for review" — payment instructions still come on acknowledgement (no Stripe yet).
- **Success state**
  - Change ack window to **2 business days**, live window to **5 business days**.
  - Tracking ID format unchanged (`APP-YYYY-XXXXXX`).
- **Tier 1 inquiry callout**
  - Add a sidebar / banner: *"Looking for a Tier 1 `@scope` instead? Tier 1 ratification is invitation-only. Email `registry@atto.tech` to express interest."* Links straight to mailto.

### Group B — `/docs` §6 rewrite (M)

`@/Users/chunter/code/atto/marketing/src/pages/docs.astro:1335-1395` — the `afrp-registration` section.

- Rename heading: **"Tier 1 ratification"** (or **"Shorthand ratification"**).
- Replace the 6-item criterion list with the new 5-item list (Permanence / Identity / License transparency / Protocol compliance / Code of Conduct).
- Replace the 4-row fee table with the single-row flat $2,500/year table.
- Replace the closing paragraph: drop the `/apply` link, replace with `mailto:registry@atto.tech`. Update timelines to 10-day ack / 60-day review. Mention Technical Review Panel majority vote.
- Add an explicit "not self-serve" callout up front so readers don't bounce to `/apply` looking for a form.

### Group C — `/docs` new §7 (Hosted Registry Service) (M)

Insert a new section between `afrp-registration` and `afrp-errors`. Side-nav entry `{ id: 'afrp-hosted', label: 'Hosted registry' }`.

Content shape (lifted from spec §7):

- One-paragraph overview — what AHRS is, who it's for, why it exists.
- Tier table (the same 4-tier matrix from §1.2 above), wired through the existing `<table class="spec-table">` pattern.
- Six-step onboarding list using the existing `<ol class="spec-steps">` pattern.
- Two-paragraph note on publisher obligations + termination.
- Closing paragraph linking to `/apply` ("Onboarding form at `registry.atto.tech/apply`") and explaining the upgrade path to Tier 1.

### Group D — `/docs` §1.3 framing update (S)

`@/Users/chunter/code/atto/marketing/src/pages/docs.astro:693-744` — the `afrp-architecture` section.

- Update the FieldTable description for `@scope/Typeface` to read "Issued by invitation by the Atto Protocol Authority's Technical Review Panel — reserved for foundational infrastructure providers" instead of "issued… after identity verification, catalog audit, license-transparency review".
- Add a paragraph after the FieldTable enumerating the **three paths to AFRP compliance** (self-host / AHRS / Tier 1) with anchor links to the relevant later sections.
- Side-nav doesn't need a change — the existing `afrp-architecture` anchor still applies.

### Group E — Footer + cross-links (S)

`@/Users/chunter/code/atto/marketing/src/components/Footer.astro:14`

- Rename **`Font Registry Apply`** → **`Hosted Registry`** (the link still goes to `/apply`).
- Optional second link: **`Tier 1 inquiry`** → `mailto:registry@atto.tech` if we want the invitation-only path to be discoverable from the footer.

### Group F — `Nav.astro` audit (S)

Quick check that nothing in the top nav references the old "Apply for shorthand" copy (currently nothing does, but worth confirming after Group A lands).

---

## 3. Open questions

These need a decision before Group A is implemented. None block Group D / E / F.

1. **Tier 1 inquiry surface.** Mailto-only, or a small inline inquiry form on `/apply` (e.g., a "Not for me — I want a `@scope`" link that toggles a 4-field interest form)?
2. **Custom-domain support on Studio+.** Should Step 1 include a CNAME / domain input for Studio + Foundry tiers, or defer that to onboarding email?
3. **Pricing-page placement.** AHRS pricing is structurally separate from the Atto editor's Solo/Team/Enterprise. Add a new section to `/pricing`, or keep AHRS pricing exclusively on `/apply` + `/docs`?
4. **Indie tier waitlist gating.** $99/yr is impulse-buy territory. Do we want to launch Indie self-serve immediately, or gate it behind the same waitlist as the editor? (Affects Step 1 copy and submit-button language.)
5. **Old spec file.** `2026-04-25_atto-font-registry-spec_2.md` lives at the workspace root. Move it to `/docs/`, rename to drop the `_2` suffix, or leave as-is?

---

## 4. Suggested completion order

1. **Group D** (S) — small framing fix in `/docs` §1.3. No dependencies.
2. **Group B** (M) — rewrite `/docs` §6 to remove the misleading Tier 1 self-serve copy. Unblocks honest framing of the rest.
3. **Group C** (M) — add `/docs` §7 (Hosted Registry). New material, no rewrite churn.
4. **Group A** (L) — rebuild `/apply` against AHRS. Largest piece, depends on Q1–Q4 above.
5. **Group E** (S) — relabel Footer link + add Tier 1 inquiry link.
6. **Group F** (S) — Nav audit + any cleanup.

Group D + B + C can land in a single docs-only PR. Group A is its own PR. Group E + F can ride along with either.
