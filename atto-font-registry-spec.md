# Atto Font Registry Protocol (AFRP) — Specification

**Status:** Draft — subject to revision before ratification
**Author:** Curtis Baldwinson, Atto Technologies Inc.
**Document Type:** Protocol Specification — Normative Extension to Atto Hybrid Syntax (AHS)
**Date:** April 24, 2026

---

## Abstract

This document defines the Atto Font Registry Protocol (AFRP), a normative sub-protocol of Atto Hybrid Syntax (AHS) governing the identification, resolution, versioning, and license transparency of font resources referenced within AHS documents. AFRP introduces a two-tier URI-like identifier scheme for font references: a governed shorthand tier requiring registration with the Atto Protocol Authority, and a permissionless full-URI tier for self-hosted resources. This specification defines the complete grammar for font identifiers, the registry manifest format, the resolution algorithm, the shorthand registration process, the fallback policy, and security considerations pertaining to font asset integrity.

---

## Table of Contents

1. [Overview and Motivation](#1-overview-and-motivation)
2. [Normative References](#2-normative-references)
3. [Font Identifier Syntax](#3-font-identifier-syntax)
4. [Registry Manifest Format](#4-registry-manifest-format)
5. [Resolution Algorithm](#5-resolution-algorithm)
6. [Shorthand Registration Process](#6-shorthand-registration-process)
7. [Fallback Policy](#7-fallback-policy)
8. [AHS Document Syntax — Font Declaration Block](#8-ahs-document-syntax--font-declaration-block)
9. [Security Considerations](#9-security-considerations)
10. [IANA and Protocol Considerations](#10-iana-and-protocol-considerations)

---

## 1. Overview and Motivation

### 1.1 Problem Statement

AHS documents reference typefaces not merely for presentation but as part of their cryptographic execution identity. A document in `EXECUTED` state has its content, layout, and font asset references sealed under a cryptographic signature. If a font asset silently changes after signing — due to a registry update, compromised CDN, or malicious substitution — the semantic and legal integrity of the executed document is undermined.

Existing mechanisms (`@font-face`, Google Fonts CDN, Typekit) offer no formal versioning semantics, no machine-readable license metadata, no integrity guarantees at the asset level, and no standardized identifier grammar. A document referencing `https://fonts.googleapis.com/css2?family=Roboto` cannot assert which binary was served at signing time, whether that binary will be served at render time, or whether license terms have changed.

AFRP addresses this by defining:

1. A formal, parseable identifier grammar for font references within AHS documents.
2. A normative manifest format that registries MUST serve — including versioned asset URLs, per-format cryptographic integrity hashes, and machine-readable SPDX license metadata.
3. A deterministic resolution algorithm that a compliant AHS renderer MUST follow.
4. A mandatory integrity verification step for all resolved font assets.
5. An execution-time pin mechanism ensuring executed documents always resolve to the exact binary present at signing.

### 1.2 Design Goals

Listed in priority order:

**G1 — Cryptographic reproducibility.** An AHS document in `EXECUTED` state MUST be renderable identically at any future time using exactly the font binaries present at signing. This is the paramount goal.

**G2 — License transparency.** Every font reference MUST be resolvable to a machine-readable license record. Renderers and compliance systems MUST determine without ambiguity whether a font permits the document's use case.

**G3 — Decentralization.** No single organization — including Atto Technologies Inc. — should control the only resolution path. The permissionless Form C tier ensures any entity can self-host a compliant registry without Atto involvement.

**G4 — Usability.** Short, readable identifiers (`@/Sligoil`, `@velvetyne/Bagnard`) MUST be usable in AHS source without requiring full URLs. The resolution layer must be deterministic and auditable.

**G5 — Extensibility.** The manifest format and resolution algorithm MUST accommodate new font formats, version specifier forms, and license metadata fields in future versions without breaking deployed documents.

### 1.3 Two-Tier Architecture

**Tier 1 — Governed shorthands** use `@scope/TypefaceName` syntax. The `scope` is registered by the Atto Protocol Authority, which requires demonstrated identity, originality, catalog depth, license transparency, and technical compliance.

**Tier 2 — Full URI** uses bare `domain.tld/TypefaceName` syntax with no `@` prefix. No registration required. Authors bear full responsibility for the reliability and integrity of the referenced registry.

The bare `@/TypefaceName` form — no scope between `@` and `/` — is a special Form A case that resolves against the canonical Atto registry at `https://fonts.atto.tech/`.

### 1.4 The Federated Registry Model

The Atto Protocol Authority operates two services:

1. **Canonical Atto font registry** at `https://fonts.atto.tech/` — curated fonts accessible via the `@/TypefaceName` bare form.
2. **Shorthand registry** at `https://registry.atto.tech/shorthands` — a JSON manifest mapping registered scope shorthands to resolver base URLs.

All other registries are independently operated. The Atto Protocol Authority does not act as a CDN for third-party registries, does not proxy font asset downloads, and has no visibility into which fonts an AHS renderer fetches from third-party registries.

---

## 2. Normative References

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119].

| Reference | Document | Relevance |
|---|---|---|
| [RFC 2119] | Bradner, "Key words for use in RFCs to Indicate Requirement Levels" | Normative language |
| [RFC 3986] | Berners-Lee et al., "URI: Generic Syntax" | Font identifier grammar extends RFC 3986 |
| [RFC 9000] | Iyengar & Thomson, "QUIC" | Preferred transport for manifest and asset fetches |
| [RFC 8785] | Rundgren et al., "JSON Canonicalization Scheme (JCS)" | Canonical serialization for manifest integrity |
| [CommonMark] | MacFarlane et al., CommonMark Spec 0.31.2 | AHS is a CommonMark superset |
| [SemVer] | Preston-Werner, "Semantic Versioning 2.0.0" | Version specifier semantics |
| [SRI] | Akhawe et al., "Subresource Integrity", W3C | Integrity hash format in manifest `integrity` fields |
| [SPDX] | Linux Foundation, "SPDX Specification 2.3" | License identifier format |
| [RFC 5234] | Crocker & Overell, "ABNF for Syntax Specifications" | Grammar notation in §3 |

---

## 3. Font Identifier Syntax

### 3.1 Identifier Forms

A font identifier in AFRP is a structured string that uniquely identifies a typeface within the AFRP resolution namespace. Font identifiers appear in AHS document metadata (see §8) and in inline font references (see §8.2).

AFRP defines three syntactic forms, distinguished by their prefix.

**Form A — Bare registry (canonical Atto registry)**

The `@/` prefix indicates resolution against `https://fonts.atto.tech/`. No scope registration is required.

```
@/Lineal
@/Lineal@2.1.0
@/Sligoil@^2
@/Grotesk@~1.3
@/Mono@latest
```

**Form B — Scoped shorthand (registered third-party registry)**

The `@scope/` prefix, where `scope` is registered with the Atto Protocol Authority, resolves against the scope's declared base URL in the shorthand registry. The scope component MUST consist solely of lowercase ASCII letters, digits, and hyphens, beginning with a lowercase letter.

```
@velvetyne/Bagnard
@velvetyne/Sligoil
@monotype/HelveticaNeue@3.0.0
@adobe/SourceSerif4@^4
@google/NotoSans@~2.0
```

Scope delegation extends Form B with a one-level sub-scope component:

```
@adobe/monotype/HelveticaNeue    ; resolves at the monotype delegation URL
@adobe/linotype/Optima           ; resolves at the linotype delegation URL
```

**Form C — Full URI (permissionless self-hosted)**

No `@` prefix. Begins with a DNS hostname, optionally including a port. No registration with the Atto Protocol Authority is required.

```
fonts.mycorp.com/HouseFace
fonts.mycorp.com/HouseFace@1.0.0
internal.fonts.example.org/BrandSans@2.3.1
localhost:4000/DraftFont
```

### 3.2 ABNF Grammar

The complete normative grammar for AFRP font identifiers and references:

```abnf
; Top-level productions
font-reference      = font-identifier *( WSP qualifier )
font-identifier     = form-a / form-b / form-c

; Form A — Canonical Atto registry
form-a              = "@/" typeface-name [ version-specifier ]

; Form B — Registered scope shorthand
; Sub-scope component supports scope delegation (one level deep only)
form-b              = "@" scope "/" [ sub-scope "/" ] typeface-name [ version-specifier ]
sub-scope           = lc-alpha *( lc-alpha / DIGIT / "-" )
                    ; MUST be declared in the parent scope's delegations map.
                    ; Delegation is one level deep only — @a/b/c/Name is invalid.

; Form C — Full URI (permissionless)
form-c              = host-authority "/" typeface-name [ version-specifier ]

; Scope (Form B)
scope               = lc-alpha *( lc-alpha / DIGIT / "-" )
lc-alpha            = %x61-7A          ; lowercase a-z

; Typeface name
typeface-name       = tc-alpha *( tc-alpha / DIGIT / "-" / "_" )
tc-alpha            = %x41-5A / %x61-7A  ; A-Z or a-z

; Host authority (Form C) — RFC 3986 host with optional port
host-authority      = reg-name [ ":" port ]
reg-name            = 1*( unreserved / pct-encoded / sub-delims )
port                = 1*DIGIT
unreserved          = ALPHA / DIGIT / "-" / "." / "_" / "~"
pct-encoded         = "%" HEXDIG HEXDIG
sub-delims          = "!" / "$" / "&" / "'" / "(" / ")" /
                      "*" / "+" / "," / ";"

; Version specifier
version-specifier   = "@" version-value
version-value       = exact-version
                    / range-caret
                    / range-tilde
                    / "latest"
                    / "pinned"

exact-version       = semver-core [ "-" pre-release ] [ "+" build-meta ]
range-caret         = "^" major [ "." minor [ "." patch ] ]
range-tilde         = "~" major "." minor [ "." patch ]

semver-core         = major "." minor "." patch
major               = numeric-id
minor               = numeric-id
patch               = numeric-id
numeric-id          = "0" / ( %x31-39 *DIGIT )   ; no leading zeros per SemVer
pre-release         = dot-separated-ids
build-meta          = dot-separated-ids
dot-separated-ids   = pre-release-id *( "." pre-release-id )
pre-release-id      = 1*( ALPHA / DIGIT / "-" )

; Qualifiers
qualifier           = axis-qual
axis-qual           = axis-tag "=" axis-value
axis-tag            = 4( ALPHA / DIGIT )   ; OpenType 4-char registered axis tag
axis-value          = axis-number
axis-number         = 1*DIGIT [ "." 1*DIGIT ]     ; non-negative decimal

; Reserved aliases — parsers MUST translate before any further processing:
;   weight=<v>      →  wght=<v>
;   style=italic    →  ital=1
;   style=oblique   →  slnt=-12  (registries MAY override the default oblique angle)
;   style=normal    →  ital=0 slnt=0
; These aliases exist for author convenience only.
; Implementations MUST store and transmit the canonical axis-tag form internally.

; Core definitions (RFC 5234)
WSP                 = SP / HTAB
SP                  = %x20
HTAB                = %x09
ALPHA               = %x41-5A / %x61-7A
DIGIT               = %x30-39
HEXDIG              = DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
                            / "a" / "b" / "c" / "d" / "e" / "f"
```

### 3.3 Axis Qualifiers

Font references may be annotated with one or more OpenType axis qualifiers specifying the typographic state along design axes. Axis qualifiers appear after the font identifier, separated by whitespace.

#### 3.3.1 Registered Standard Axes

The following axis tags are registered with the OpenType specification. All compliant renderers MUST support these axes on variable fonts that declare them:

| Axis tag | Alias | Typical range | Description |
|---|---|---|---|
| `wght` | `weight=` | 100–900 | Weight from Thin (100) to Black (900). Equivalent to CSS `font-weight`. |
| `wdth` | — | 75–125 | Width from Condensed (75) to Extended (125). Equivalent to CSS `font-stretch`. |
| `opsz` | — | 6–72 | Optical size — design optimized for the given point size. |
| `ital` | `style=italic` / `style=normal` | 0–1 | 0 = upright, 1 = fully italic. Continuous axis. |
| `slnt` | `style=oblique` | −15–0 | Slant angle in degrees. Negative values lean right. |
| `GRAD` | — | −50–150 | Grade — adjusts weight without changing character advance widths. |

All four-character tags are case-sensitive. Registered axes use lowercase; custom axes registered by foundries use uppercase (e.g., `GRAD`, `YOPQ`). A resolver MUST preserve axis tag case exactly.

#### 3.3.2 Default Axis Values

When a qualifier for a given axis is absent from a font reference, the resolver MUST use the axis `default` value declared in the manifest's `variable_axes` object for that font (see §4.2). If the manifest declares no `default` for an axis, the resolver MUST use the OpenType specification's defined defaults: `wght=400`, `wdth=100`, `opsz=12`, `ital=0`, `slnt=0`, `GRAD=0`.

**Critical for execution integrity:** In `EXECUTED` state, ALL axis values — including those not explicitly specified in the font reference — MUST be recorded in the execution metadata pin. The absence of a qualifier means "use the manifest default." That default must be frozen at signing time so that render-time manifest changes cannot alter visual output.

#### 3.3.3 Non-Variable Fonts

For non-variable fonts (no OpenType `fvar` table), only `wght` and `ital` are meaningful and are resolved by selecting the closest matching static style entry. All other axis qualifiers MUST be ignored, and the resolver MUST emit an `AXIS_NOT_SUPPORTED` informational event.

### 3.4 Version Specifiers

AFRP version specifiers follow SemVer 2.0.0 semantics:

| Form | Syntax | Semantics |
|---|---|---|
| Exact | `@X.Y.Z` | Resolve to exactly version X.Y.Z. MUST fail if that version is absent. |
| Caret range | `@^X` | Highest version ≥ X.0.0 and < (X+1).0.0. Major version fixed. |
| Caret range | `@^X.Y` | Highest version ≥ X.Y.0 and < (X+1).0.0. |
| Caret range | `@^X.Y.Z` | Highest version ≥ X.Y.Z and < (X+1).0.0. |
| Tilde range | `@~X.Y` | Highest version ≥ X.Y.0 and < X.(Y+1).0. Minor version fixed. |
| Tilde range | `@~X.Y.Z` | Highest version ≥ X.Y.Z and < X.(Y+1).0. |
| Latest | `@latest` | Highest stable version. SHOULD NOT be used in documents intended for signing. |
| Pinned | `@pinned` | Version recorded in document execution metadata. Only valid in `EXECUTED` state. A resolver encountering `@pinned` in a `DRAFT` document MUST emit `PINNED_IN_DRAFT` and treat it as `@latest`. |

If no version specifier is present, behavior is equivalent to `@latest`. Pre-release versions MUST NOT be matched by caret or tilde ranges unless the range itself is pre-release qualified.

### 3.5 Font Reference vs. Font Identifier

A **font identifier** is the bare location reference — it identifies a typeface at an optional version. A **font reference** is a font identifier augmented with typographic axis qualifiers. Font references appear in inline markup and in the `ref` field of the AHS font declaration block.

```
; Font identifier (no qualifiers)
@/Sligoil@2.0.0

; Font reference (identifier + qualifiers)
@/Sligoil@2.0.0 wght=400 ital=1
```

When axis qualifiers are absent in an inline reference, the resolver MUST use the axis values declared for the named font entry in the document's font declaration block. If no declaration block entry exists, the resolver MUST default to `wght=400`, `ital=0`.

### 3.6 Identifier Examples and Parsing Notes

```
; Valid Form A
@/Lineal
@/Lineal@2.0.0
@/Grotesk@^1
@/Mono@~3.2

; Valid Form B
@velvetyne/Bagnard
@velvetyne/Sligoil@1.0.0
@adobe/SourceCodePro@^4
@google/NotoSerif@~3.1.0

; Valid Form B with sub-scope delegation
@adobe/monotype/HelveticaNeue
@adobe/linotype/Optima

; Valid Form C
fonts.example.com/BrandFont
fonts.example.com/BrandFont@2.0.0
localhost:8080/DraftFace
192.168.0.10:4000/DevFont@1.0.0-rc.1

; INVALID — do not parse
@/                         ; missing typeface name
@/123Font                  ; typeface name must begin with alpha
@@/Lineal                  ; double @ is not a valid prefix
@VELVETYNE/Bagnard         ; scope must be lowercase
@velvetyne/Bagnard@        ; version specifier with empty value
fonts.example.com          ; missing typeface name component
@velvetyne                 ; missing typeface name (no slash)
@a/b/c/Name                ; delegation is one level deep only
```

A resolver MUST distinguish Form B from Form A by checking whether any characters appear between `@` and `/`. A resolver MUST NOT treat an unregistered Form B scope as a fallback to Form A — it MUST emit `SCOPE_NOT_FOUND` and proceed to the fallback chain.

---

## 4. Registry Manifest Format

### 4.1 Well-Known Manifest Endpoint

A compliant AFRP font registry MUST serve a registry-level manifest at the following well-known path:

```
GET /.well-known/atto-font-registry.json
```

This endpoint MUST:
- Respond over HTTPS. Plaintext HTTP MUST NOT be used in production.
- Return `Content-Type: application/atto-font-manifest+json` (see §10.2).
- Return a response body conforming to the JSON Schema defined in §4.2.
- Support HTTP/1.1, HTTP/2, and SHOULD support HTTP/3 (QUIC per [RFC 9000]).
- Return `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` (recommended).
- Include `Access-Control-Allow-Origin: *` to permit cross-origin fetches from browser-based renderers.
- Support conditional GET via `ETag` and `Last-Modified`.

### 4.2 Registry Manifest JSON Schema

The following JSON Schema defines the normative structure of the registry manifest. Implementations MUST validate inbound manifests against this schema before using any field values.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://spec.atto.tech/schemas/afrp/v1/registry-manifest.json",
  "title": "AFRP Registry Manifest",
  "type": "object",
  "required": ["registry", "fonts"],
  "additionalProperties": false,
  "properties": {
    "registry": {
      "type": "object",
      "required": ["name", "homepage", "contact", "protocol_version"],
      "additionalProperties": false,
      "properties": {
        "name":             { "type": "string", "minLength": 1, "maxLength": 128 },
        "homepage":         { "type": "string", "format": "uri" },
        "contact":          { "type": "string", "minLength": 1 },
        "protocol_version": { "type": "string", "enum": ["1.0"] },
        "shorthand":        { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
        "base_url":         { "type": "string", "format": "uri" }
      }
    },
    "fonts": {
      "type": "array",
      "description": "Array of font entries published in this registry.",
      "items": { "$ref": "#/definitions/font-entry" }
    }
  },
  "definitions": {
    "font-entry": {
      "type": "object",
      "required": ["id", "versions", "license", "designer", "foundry"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "description": "Typeface name — must be unique within this registry.",
          "pattern": "^[A-Za-z][A-Za-z0-9_-]*$",
          "minLength": 1,
          "maxLength": 128
        },
        "versions":         { "type": "array", "minItems": 1, "items": { "$ref": "#/definitions/version-entry" } },
        "license":          { "$ref": "#/definitions/license-info" },
        "unicode_coverage": { "type": "array", "items": { "type": "string" } },
        "designer":         { "type": "string", "minLength": 1 },
        "foundry":          { "type": "string", "minLength": 1 },
        "tags":             { "type": "array", "items": { "type": "string" } },
        "deprecated":       { "type": "boolean", "default": false },
        "successor": {
          "type": "string",
          "description": "Font identifier of the recommended replacement if this entry is deprecated.",
          "pattern": "^(@[a-z][a-z0-9-]*/|@/|[a-zA-Z])[A-Za-z][A-Za-z0-9_-]*"
        }
      }
    },
    "version-entry": {
      "type": "object",
      "required": ["version", "styles"],
      "additionalProperties": false,
      "properties": {
        "version":       { "type": "string", "description": "SemVer 2.0.0 version string." },
        "release_date":  { "type": "string", "format": "date" },
        "changelog_url": { "type": "string", "format": "uri" },
        "styles":        { "type": "array", "minItems": 1, "items": { "$ref": "#/definitions/style-entry" } }
      }
    },
    "style-entry": {
      "type": "object",
      "required": ["weight", "style", "formats"],
      "additionalProperties": false,
      "properties": {
        "weight":      { "type": "integer", "minimum": 1, "maximum": 1000 },
        "style":       { "type": "string", "enum": ["normal", "italic", "oblique"] },
        "is_variable": { "type": "boolean", "default": false },
        "formats": {
          "type": "array",
          "description": "Per-format asset array. WOFF2 MUST be listed first when available.",
          "minItems": 1,
          "items": { "$ref": "#/definitions/format-entry" }
        },
        "variable_axes": {
          "type": "object",
          "description": "Required when is_variable is true. Maps OpenType axis tags to { min, max, default }.",
          "additionalProperties": {
            "type": "object",
            "required": ["min", "max", "default"],
            "additionalProperties": false,
            "properties": {
              "min":     { "type": "number" },
              "max":     { "type": "number" },
              "default": { "type": "number" }
            }
          }
        }
      }
    },
    "format-entry": {
      "type": "object",
      "description": "A single format variant with its own URL and integrity hash.",
      "required": ["type", "url", "integrity"],
      "additionalProperties": false,
      "properties": {
        "type":      { "type": "string", "enum": ["woff2", "woff", "ttf", "otf"] },
        "url":       { "type": "string", "format": "uri", "description": "Absolute HTTPS URL to this format's font asset." },
        "integrity": {
          "type": "string",
          "description": "SRI integrity hash: sha256-<base64-encoded-hash>.",
          "pattern": "^sha256-[A-Za-z0-9+/]{43}=$"
        }
      }
    },
    "license-info": {
      "type": "object",
      "required": ["spdx", "url", "commercial_use", "embedding_allowed"],
      "additionalProperties": false,
      "properties": {
        "spdx":                  { "type": "string", "description": "SPDX license identifier (e.g. OFL-1.1, Apache-2.0, LicenseRef-Proprietary)." },
        "url":                   { "type": "string", "format": "uri" },
        "commercial_use":        { "type": "boolean" },
        "embedding_allowed":     { "type": "boolean" },
        "web_embedding_allowed": { "type": "boolean" },
        "modification_allowed":  { "type": "boolean" },
        "attribution_required":  { "type": "boolean" },
        "commerce":              { "$ref": "#/definitions/commerce-info" }
      }
    },
    "commerce-info": {
      "type": "object",
      "description": "Font Commerce Layer (FCL) block. Present only for fonts requiring payment or token validation.",
      "required": ["model"],
      "additionalProperties": false,
      "properties": {
        "model": {
          "type": "string",
          "enum": ["free", "seat", "per_execution", "subscription", "royalty"]
        },
        "price_usd_cents": {
          "type": "integer",
          "minimum": 0,
          "description": "Price in US cents. Applicable to per_execution and royalty models."
        },
        "payment_endpoint": {
          "type": "string",
          "format": "uri",
          "description": "HTTPS endpoint called to acquire a use_receipt or validate a license token."
        },
        "license_authority_key": {
          "type": "string",
          "description": "Ed25519 public key (base64url) used to verify use_receipt signatures from payment_endpoint."
        }
      }
    }
  }
}
```

### 4.3 Per-Font Manifest Endpoint

A registry MAY serve individual font manifests at:

```
GET /<TypefaceName>/manifest.json
```

When available, resolvers SHOULD prefer this endpoint over the registry-level manifest to reduce bandwidth and improve cache efficiency. A per-font manifest response takes precedence over the registry-level manifest for that typeface. This endpoint MUST return HTTP 404 — not an empty object — if the typeface does not exist.

### 4.4 Manifest Validation

A resolver MUST perform the following validation on every received manifest before using any field values:

1. **Schema validation.** The response body MUST be valid JSON conforming to the schema in §4.2. Failure → `MANIFEST_SCHEMA_ERROR`.
2. **Protocol version check.** `registry.protocol_version` MUST be a version the resolver supports. Failure → `UNSUPPORTED_PROTOCOL_VERSION`.
3. **Integrity field format.** Every `format-entry.integrity` value MUST match the pattern `sha256-[A-Za-z0-9+/]{43}=`. Failure → `MALFORMED_INTEGRITY_FIELD`.
4. **URL scheme validation.** Every `format-entry.url` MUST use the `https` scheme unless the registry host is `localhost` or a loopback address. Failure → `INSECURE_ASSET_URL`.
5. **SPDX field presence.** For Tier 1 registered scopes, `font-entry.license.spdx` MUST be non-empty. Failure → `MISSING_LICENSE_METADATA` (warning, not error, to accommodate Form C registries).

### 4.5 Manifest Example

```json
{
  "registry": {
    "name": "Velvetyne Type Foundry Registry",
    "homepage": "https://velvetyne.fr",
    "contact": "registry@velvetyne.fr",
    "protocol_version": "1.0",
    "shorthand": "velvetyne",
    "base_url": "https://registry.velvetyne.fr/"
  },
  "fonts": [
    {
      "id": "Bagnard",
      "designer": "Sebastien Sanfilippo",
      "foundry": "Velvetyne Type Foundry",
      "license": {
        "spdx": "OFL-1.1",
        "url": "https://scripts.sil.org/OFL",
        "commercial_use": true,
        "embedding_allowed": true,
        "web_embedding_allowed": true,
        "modification_allowed": true,
        "attribution_required": false
      },
      "unicode_coverage": ["Basic Latin", "Latin-1 Supplement", "Latin Extended-A"],
      "tags": ["serif", "display", "humanist"],
      "versions": [{
        "version": "2.1.0",
        "release_date": "2024-03-15",
        "changelog_url": "https://registry.velvetyne.fr/Bagnard/CHANGELOG.md",
        "styles": [
          {
            "weight": 400, "style": "normal", "is_variable": false,
            "formats": [
              {
                "type": "woff2",
                "url": "https://registry.velvetyne.fr/Bagnard/2.1.0/Bagnard-Regular.woff2",
                "integrity": "sha256-abc123DEFghi456JKLmno789PQRstu012VWXyz3456A="
              },
              {
                "type": "ttf",
                "url": "https://registry.velvetyne.fr/Bagnard/2.1.0/Bagnard-Regular.ttf",
                "integrity": "sha256-ttf123DEFghi456JKLmno789PQRstu012VWXyz3456B="
              }
            ]
          },
          {
            "weight": 400, "style": "italic", "is_variable": false,
            "formats": [{
              "type": "woff2",
              "url": "https://registry.velvetyne.fr/Bagnard/2.1.0/Bagnard-Italic.woff2",
              "integrity": "sha256-zyx987WVUtsrqpon654MLKjihgfedcba321ZYX098B="
            }]
          }
        ]
      }]
    },
    {
      "id": "Sligoil",
      "designer": "Ariel Martín Pérez",
      "foundry": "Velvetyne Type Foundry",
      "license": {
        "spdx": "OFL-1.1",
        "url": "https://scripts.sil.org/OFL",
        "commercial_use": true,
        "embedding_allowed": true,
        "web_embedding_allowed": true,
        "modification_allowed": true,
        "attribution_required": false
      },
      "unicode_coverage": ["Basic Latin", "Latin-1 Supplement"],
      "tags": ["monospace", "display"],
      "versions": [{
        "version": "1.0.0",
        "release_date": "2023-11-01",
        "styles": [{
          "weight": 400, "style": "normal", "is_variable": true,
          "variable_axes": {
            "wght": { "min": 100, "max": 900, "default": 400 },
            "opsz": { "min": 8,   "max": 64,  "default": 12  }
          },
          "formats": [
            {
              "type": "woff2",
              "url": "https://registry.velvetyne.fr/Sligoil/1.0.0/Sligoil-Regular-VF.woff2",
              "integrity": "sha256-mnopQRStuv789WXYZab012cde345fghIJK678lmNvf="
            },
            {
              "type": "ttf",
              "url": "https://registry.velvetyne.fr/Sligoil/1.0.0/Sligoil-Regular-VF.ttf",
              "integrity": "sha256-ttfpQRStuv789WXYZab012cde345fghIJK678lmNvg="
            }
          ]
        }]
      }]
    },
    {
      "id": "HydraDisplay",
      "designer": "Hydra Type Co.",
      "foundry": "Hydra Type Co.",
      "license": {
        "spdx": "LicenseRef-Proprietary-PerUse",
        "url": "https://registry.hydratype.example/HydraDisplay/license",
        "commercial_use": true,
        "embedding_allowed": true,
        "commerce": {
          "model": "per_execution",
          "price_usd_cents": 50,
          "payment_endpoint": "https://registry.hydratype.example/HydraDisplay/license/acquire",
          "license_authority_key": "ed25519-base64url-pubkey-placeholder=="
        }
      },
      "tags": ["display", "sans-serif"],
      "versions": [{
        "version": "2.0.0",
        "release_date": "2026-01-10",
        "styles": [{
          "weight": 400, "style": "normal", "is_variable": true,
          "variable_axes": { "wght": { "min": 100, "max": 900, "default": 400 } },
          "formats": [{
            "type": "woff2",
            "url": "https://registry.hydratype.example/HydraDisplay/2.0.0/HydraDisplay-VF.woff2",
            "integrity": "sha256-HyDrA789WXYZab012cde345fghIJK678lmNopQRStu="
          }]
        }]
      }]
    }
  ]
}
```

---

## 5. Resolution Algorithm

### 5.1 Overview

The resolution algorithm transforms a font identifier into a concrete font binary ready for use by an AHS renderer. The algorithm is deterministic: given the same identifier, document execution context, and network state, a compliant resolver MUST produce the same output.

Eleven normative steps: Steps 1–3 determine the base URL. Step 4 discovers and fetches the manifest via a three-step discovery chain. Steps 5–7 select the best matching version, style, and format entry. Step 8 fetches and verifies the asset. Step 9 applies execution-time pin overrides. Step 10 processes commerce requirements. Step 11 caches the result.

### 5.2 Normative Resolution Steps

**Step 1 — Parse the font identifier.**

Parse using the ABNF grammar in §3.2. On parse failure → emit `INVALID_IDENTIFIER` and halt. Parsers MUST NOT apply heuristic correction to malformed identifiers.

Determine the form:
- Begins with `@/` → Form A.
- Begins with `@` followed by one or more lowercase alphanumeric characters and then `/` → Form B.
- Does not begin with `@` → Form C.

Extract components: `scope` (Form B only), optional `sub-scope` (Form B delegation), `typeface-name`, and `version-specifier`.

**Step 2 — Determine the base URL.**

- **Form A:** Base URL is `https://fonts.atto.tech/`. No network request needed at this step.
- **Form B:** Proceed to Step 3.
- **Form C:** Base URL is `https://{host-authority}/`. If the host is `localhost` or a loopback address (`127.0.0.1`, `[::1]`), the scheme MAY be `http://` in `DRAFT` mode only (see §9.5).

**Step 3 — Resolve the Form B scope. (Form B only)**

Fetch the Atto Shorthand Registry:
```
GET https://registry.atto.tech/shorthands
```

Response format — a JSON object mapping scope strings to scope entry objects:

```json
{
  "velvetyne": {
    "base_url": "https://registry.velvetyne.fr/"
  },
  "adobe": {
    "base_url": "https://afrp.adobe.com/",
    "delegations": {
      "monotype": "https://fonts.monotype.com/afrp/",
      "linotype": "https://afrp.linotype.com/"
    }
  },
  "google": {
    "base_url": "https://afrp.google.com/fonts/"
  }
}
```

If the scope extracted in Step 1 is not present → emit `SCOPE_NOT_FOUND`, proceed to fallback chain. The resolver MUST NOT attempt to guess or construct a base URL for an unregistered scope.

**Sub-scope resolution:** For identifiers of the form `@scope/sub-scope/TypefaceName`:
1. Look up the parent `scope` entry.
2. Look up `sub-scope` in the parent entry's `delegations` map.
3. If found → use the delegated URL as `base_url` and proceed to Step 4.
4. If not found → emit `SUB_SCOPE_NOT_FOUND`, proceed to fallback chain.

Governance: only the registered scope owner may declare delegations. Delegation is one level deep only; four-component identifiers (`@scope/sub/further/Name`) are invalid per the ABNF. Delegated registries cannot further sub-delegate.

The shorthand registry response SHOULD be cached. Default TTL: 3600 seconds if no `Cache-Control` header. Revalidate using conditional GET (`If-None-Match`, `If-Modified-Since`).

**Step 4 — Discover and fetch the manifest.**

For Form A and Form B, construct the per-font manifest URL directly:
```
{base_url}{typeface-name}/manifest.json
```
Examples:
- Form A, typeface `Lineal` → `https://fonts.atto.tech/Lineal/manifest.json`
- Form B, scope `velvetyne`, typeface `Bagnard` → `https://registry.velvetyne.fr/Bagnard/manifest.json`

For **Form C identifiers**, the resolver MUST attempt manifest discovery in the following three-step chain, stopping at the first success:

**Step 4A — Well-known path:**
```
GET https://{host}/.well-known/atto-font-registry.json
```
Works for any standard web server. On 200 → proceed to Step 5.

**Step 4B — Per-typeface manifest at root path:**
```
GET https://{host}/{TypefaceName}/manifest.json
```
Accessible on object storage hosts (Cloudflare R2, Backblaze B2, DigitalOcean Spaces, and equivalents) that cannot serve routing-layer paths. On 200 → proceed to Step 5.

**Step 4C — Inline document manifest:**
If Steps 4A and 4B fail, and the AHS document's font declaration for this identifier includes an `inline_manifest` field, the resolver MUST use that inline manifest. For `EXECUTED` documents, `inline_manifest` values MUST be consistent with the execution metadata pin; any divergence → emit `MANIFEST_HASH_DIVERGED` and halt resolution.

If all three steps fail and no `inline_manifest` is present → emit `REGISTRY_UNREACHABLE`, proceed to fallback chain.

All manifest fetches MUST:
- Validate TLS certificates (see §9.2).
- Retry once after a 2-second delay on 5xx responses before advancing to the next discovery step.
- Emit `MANIFEST_FETCH_ERROR` on non-2xx, non-404 responses.

**Step 5 — Validate the manifest.**

Apply all validation steps in §4.4. The resolver MUST NOT use data from a manifest that fails validation.

**Step 6 — Select the best matching version.**

Apply the version selection algorithm in §5.3.

**Step 7 — Select the best matching style and format entry.**

Apply the asset selection algorithm in §5.4. The result is a specific `format-entry` with its own `url` and `integrity` hash.

**Step 8 — Fetch and verify the font asset.**

Issue an HTTPS GET to the `url` field of the selected `format-entry`. Verify integrity using the SRI algorithm [SRI]:

1. Decode the `integrity` value — parse the `sha256` prefix and the base64-encoded expected hash.
2. Compute the SHA-256 hash of the downloaded binary (after HTTP content-encoding decompression).
3. Base64-encode the computed hash using the standard alphabet with padding.
4. Compare using constant-time string comparison.

If hashes do not match → emit `INTEGRITY_VIOLATION` with `identifier`, `format`, `url`, `expected_hash`, `computed_hash`. MUST NOT use the asset. In `EXECUTED` mode → halt rendering of the affected content region.

**Step 9 — Apply execution-time pin override.**

If the document is in `EXECUTED` state and the execution metadata contains a `full_integrity` entry for this font identifier:
- Extract `full_integrity` and `pinned_format` from the pin.
- If `pinned_format` is unavailable in the current manifest → emit `PINNED_FORMAT_UNAVAILABLE`, halt in `EXECUTED` mode.
- If `full_integrity` differs from the manifest hash → use `full_integrity` as the expected hash in Step 8.
- If the asset matches `full_integrity` but not the manifest hash → log `MANIFEST_HASH_DIVERGED` (informational only).
- If the asset matches neither → emit `INTEGRITY_VIOLATION`.
- If the pinned version is no longer in the manifest → attempt to fetch from the URL recorded in execution metadata directly. If unavailable → emit `PINNED_VERSION_UNAVAILABLE`, halt in `EXECUTED` mode.

**Step 10 — Process commerce requirements.**

If the manifest `license-info` includes a `commerce` field:

| Commerce model | Resolver action |
|---|---|
| `free` | No action. Proceed. |
| `seat` | Validate the `license_token` in the document's font declaration against `payment_endpoint`. Absent or invalid → emit `LICENSE_REQUIRED` (Draft) or block execution (Executed). |
| `per_execution` / `royalty` | POST to `payment_endpoint` with document ID and execution timestamp. On success → embed the returned `use_receipt` in the document's execution metadata. On failure → emit `LICENSE_PAYMENT_FAILED`, block execution. |
| `subscription` | Validate subscription token against `payment_endpoint`. On failure → emit `LICENSE_REQUIRED`, block execution. |

`use_receipt` objects returned by `payment_endpoint` MUST be verified against the `license_authority_key` Ed25519 public key from the manifest before embedding. An unverifiable `use_receipt` MUST be treated as `LICENSE_PAYMENT_FAILED`.

If `license.commercial_use` is `false` and the document declares `commercial_use: true` → emit `LICENSE_INCOMPATIBLE`, MUST NOT proceed with execution.

**Step 11 — Cache the resolved asset.**

Cache the verified font binary keyed by:
```
(registry_host, typeface_name, version, format_type, weight, style, integrity_hash)
```

Use persistent disk cache for Form A and Form B identifiers. Use in-memory cache only for `localhost` Form C registries to prevent stale development assets leaking into production sessions.

### 5.3 Version Selection

Given the manifest's `versions` array and a version specifier from the identifier:

1. Filter to versions satisfying the specifier per SemVer 2.0.0.
2. Exclude pre-release versions unless the specifier itself is pre-release or an exact pre-release match.
3. Select the version with the highest SemVer precedence.
4. No satisfying version → emit `VERSION_NOT_FOUND` with the specifier and available version list.

For `@latest` → select the highest stable version. For `@pinned` → use the version recorded in execution metadata.

In `EXECUTED` state, the selected version MUST match the version recorded in the execution metadata for this font. The pinned version takes precedence in case of conflict. If the pinned version is absent from the manifest → emit `PINNED_VERSION_UNAVAILABLE`.

### 5.4 Asset Selection

Asset selection has two stages: style entry selection followed by format entry selection.

**Stage 1 — Select the style entry:**

1. Filter the `styles` array to entries where `style` matches the requested style qualifier exactly (after alias translation per §3.2).
2. From the filtered list, select the entry whose `weight` is the closest match using CSS font-weight rules:
   - Exact match wins.
   - Requested weight ≥ 400 with no exact match → prefer next higher, then next lower.
   - Requested weight < 400 with no exact match → prefer next lower, then next higher.
3. No `italic` match → fall back to `oblique`, then `normal`. Emit `STYLE_FALLBACK`.
4. For `is_variable: true` entries, read `variable_axes` and apply axis defaulting: use the explicit qualifier value if provided, otherwise use the `default` from `variable_axes` for that axis. Record the complete resolved axis set (explicit + defaulted). In `EXECUTED` mode, this complete set MUST be written to the execution metadata pin.
5. For non-variable fonts, `wght` and `ital` qualifiers are used for style-entry matching only. All other axis qualifiers MUST be ignored with `AXIS_NOT_SUPPORTED` informational events.

**Stage 2 — Select the format entry:**

1. From the selected style entry's `formats` array, apply preference order: `woff2` → `woff` → `ttf` → `otf`. Select the highest-preference format type the resolver's runtime supports.
2. MUST NOT request a format type not present in the `formats` array.
3. The selected `format-entry` (`type`, `url`, `integrity`) MUST be recorded in the execution metadata pin as `pinned_format`, `pinned_url`, and `full_integrity` when the document is sealed to `EXECUTED` state. Silent format fallback is forbidden in `EXECUTED` mode — if the pinned format is no longer available, emit `PINNED_FORMAT_UNAVAILABLE` and halt.

### 5.5 Integrity Verification

SHA-256 MUST be computed over the exact binary response body after HTTP content-encoding decompression. The comparison MUST use constant-time equality to prevent timing side-channels. A resolver MUST NOT cache or render with a font asset for which integrity verification has failed.

### 5.6 Execution-Time Pin Override

The purpose of the execution-time pin is to guarantee that `EXECUTED` documents render with the exact font binaries present at signing, regardless of subsequent registry changes. See Step 9 of §5.2 for the normative algorithm.

The execution metadata block (see AHS §4 — Execution Metadata Block) stores `full_integrity` — the SHA-256 SRI hash of the complete original binary — along with `pinned_format`, the resolved `axes` map, and, where subsetting occurred, `subset_integrity` and `subset_glyph_ids`. See §8.3 for the complete pin structure.

### 5.7 Caching

- **Manifest cache TTL:** MUST respect `Cache-Control: max-age`. Default to 3600 seconds if absent.
- **Asset cache:** Font binary assets are immutable at a given `(registry_host, name, version, integrity_hash)` key. Cache indefinitely once verified.
- **Shorthand registry cache:** Minimum 300 seconds, maximum 86400 seconds. Revalidate with conditional GET.
- **Cache invalidation:** Provide a mechanism to flush the manifest cache. Flushing the manifest cache MUST NOT flush the asset cache — verified assets are safe to retain.
- **Negative caching:** MAY cache `FONT_NOT_FOUND` (404) responses for a maximum of 60 seconds.

### 5.8 Error Codes

**Level definitions:** `ERROR` — resolution or rendering halted; `WARNING` — degraded behavior, user-visible; `INFO` — diagnostic/audit only, no user impact.

| Code | Level | Description |
|---|---|---|
| `INVALID_IDENTIFIER` | ERROR | Font identifier does not conform to the ABNF grammar in §3.2. |
| `SCOPE_NOT_FOUND` | ERROR | The `@scope` value in a Form B identifier is not present in the shorthand registry. |
| `SUB_SCOPE_NOT_FOUND` | ERROR | The sub-scope in a `@scope/sub-scope/TypefaceName` identifier is not in the parent scope's `delegations` map. |
| `FONT_NOT_FOUND` | ERROR | The registry returned HTTP 404 for the requested typeface. |
| `VERSION_NOT_FOUND` | ERROR | No version in the manifest satisfies the specified version range. |
| `REGISTRY_UNREACHABLE` | ERROR | All three Form C discovery steps (4A, 4B, 4C) failed. No manifest could be obtained. |
| `REGISTRY_UNAVAILABLE` | ERROR | The registry returned a 5xx error after retry (Form A / Form B). |
| `MANIFEST_FETCH_ERROR` | ERROR | The manifest fetch returned a non-2xx, non-404 HTTP response. |
| `MANIFEST_SCHEMA_ERROR` | ERROR | The manifest response body does not conform to the JSON Schema in §4.2. |
| `UNSUPPORTED_PROTOCOL_VERSION` | ERROR | The manifest declares a `protocol_version` not supported by this resolver. |
| `MALFORMED_INTEGRITY_FIELD` | ERROR | A `format-entry.integrity` field does not conform to the expected format. |
| `INSECURE_ASSET_URL` | ERROR | A `format-entry.url` uses a non-HTTPS scheme for a non-localhost registry. |
| `INTEGRITY_VIOLATION` | ERROR | The SHA-256 hash of a downloaded asset does not match. Halts rendering in `EXECUTED` mode. |
| `AXIS_NOT_SUPPORTED` | INFO | An axis qualifier was specified for a non-variable font or an undeclared axis. Qualifier is ignored. |
| `AXIS_PIN_VIOLATION` | ERROR | The resolved binary cannot reproduce the axis values pinned in execution metadata. |
| `PINNED_FORMAT_UNAVAILABLE` | ERROR | The format type pinned in execution metadata is no longer available in the manifest. |
| `PINNED_FONT_UNAVAILABLE` | ERROR | In `EXECUTED` mode, the pinned font binary is unavailable. No substitution permitted. Halts rendering. |
| `PINNED_VERSION_UNAVAILABLE` | ERROR | The version pinned in execution metadata is no longer present in the manifest. |
| `FONT_SUBSTITUTED` | INFO | A font was unavailable and an offline fallback was applied (Draft mode only). Payload includes `substituted_with` and `original_identifier`. |
| `LICENSE_REQUIRED` | WARNING | Font requires a license token absent from the document declaration. |
| `LICENSE_PAYMENT_FAILED` | ERROR | Payment request to `payment_endpoint` failed. Blocks execution. |
| `LICENSE_INCOMPATIBLE` | ERROR | Font's `commercial_use: false` conflicts with document's `commercial_use: true`. |
| `TLS_CERTIFICATE_ERROR` | ERROR | TLS certificate validation failed for the registry or asset host. |
| `FONT_UNRESOLVED` | WARNING | All resolution attempts including the fallback chain failed. |
| `FONT_DEPRECATED` | WARNING | The resolved font entry has `deprecated: true` in the manifest. |
| `STYLE_FALLBACK` | INFO | A requested weight/style was not available; an alternative style was selected. |
| `MANIFEST_HASH_DIVERGED` | INFO | The manifest integrity hash differs from the execution pin hash. The manifest has changed since signing. |
| `TLS_VALIDATION_SKIPPED` | WARNING | TLS validation was skipped (only permitted in Draft mode). |
| `MISSING_LICENSE_METADATA` | WARNING | A font entry is missing SPDX license metadata. |
| `PINNED_IN_DRAFT` | WARNING | `@pinned` version specifier encountered in a `DRAFT` document. Treated as `@latest`. |

---

## 6. Shorthand Registration Process

### 6.1 Eligibility Criteria

An entity applying for a Tier 1 `@scope` registration MUST satisfy all six criteria before an application is considered complete.

**Criterion 1 — Identity verification.** The applicant MUST demonstrate control of a registered trademark or domain name corresponding to the requested scope name, OR provide evidence of a recognized creative identity:
- A named type foundry or design collective with a public web presence predating the application by at least 12 calendar months.
- A credited type designer with at least two commercially or openly licensed typefaces released under their name predating the application.

A domain used for identity verification MUST be registered to the applicant (verifiable via WHOIS) and registered for at least six months prior to the application date.

**Criterion 2 — Originality.** Typefaces offered under the shorthand MUST be original designs. Specifically excluded: resellers without substantive creative contribution; digitizations of historical typefaces where the applicant did not perform the drawing work; fonts cloned from other typefaces without meaningful modification.

Open-source forks ARE eligible, provided: (a) attribution to the upstream source appears in the manifest `designer` field; (b) the fork includes substantive modification beyond cosmetic renaming. The Atto Protocol Authority determines substantiality at its sole discretion, subject to appeal per §6.5.

**Criterion 3 — Catalog depth.** The applicant MUST offer at least five distinct original typeface families at time of application. A "family" means a collection of related styles sharing a common design concept. A waiver reducing the minimum to two families is available to emerging designers who satisfy Criterion 2 with exceptional originality evidence; waiver requests must be submitted with the application.

**Criterion 4 — License transparency.** Every font served by the applicant's registry MUST include machine-readable SPDX license metadata in the manifest. Proprietary licenses MUST accurately declare the values of `commercial_use`, `embedding_allowed`, and `web_embedding_allowed`. False license declarations are grounds for revocation per §6.6.

**Criterion 5 — Protocol compliance.** The applicant's registry MUST pass the Atto Registry Compliance Test Suite (ARCTS) before approval. ARCTS verifies:
- Registry manifest endpoint availability and response schema conformance.
- Per-font manifest endpoint availability (if offered).
- Integrity hash correctness: ARCTS independently fetches each declared asset and computes SHA-256 hashes.
- TLS certificate validity, including hostname matching and chain completeness.
- Version resolution behavior against known specifiers.
- `Cache-Control` and optional `ETag` header conformance.
- `Access-Control-Allow-Origin: *` presence.

A passing ARCTS report MUST be included with the application. ARCTS is publicly available at `https://github.com/atto-tech/arcts`.

**Criterion 6 — Code of Conduct agreement.** The applicant MUST agree to the Atto Font Registry Code of Conduct. Prohibited conduct:
- Serving font binary files containing malware, exploits, or code execution payloads.
- Serving obfuscated font binaries designed to evade inspection.
- Serving fonts designed to impersonate other typefaces for phishing or social engineering.
- Making false claims in license metadata.
- Registering a scope with intent to prevent a legitimate entity from using that name (scope squatting).

Agreement MUST be provided as a digitally signed declaration using a key associated with the applicant's identity.

### 6.2 Application Procedure

Submit at `https://registry.atto.tech/apply`:

1. **Identity documentation upload.** Trademark registration, WHOIS verification, or other identity evidence per Criterion 1.
2. **Catalog declaration.** List all typeface families to be included, with URLs to existing public releases.
3. **ARCTS report upload.** JSON output of a successful ARCTS run, dated within 30 days of submission.
4. **License metadata declaration.** Confirmation that all fonts have conforming SPDX metadata.
5. **Code of Conduct signature.** Digitally signed declaration of agreement.
6. **Fee payment.** Per §6.3.

The Atto Protocol Authority MUST acknowledge receipt within five business days and complete review within 30 calendar days. Upon approval, the scope is added to the shorthand registry within two business days.

### 6.3 Fee Structure

| Tier | Definition | Annual Fee |
|---|---|---|
| Individual / Independent | Natural persons or informal collectives without commercial font licensing operations | $0 (waived) |
| Small Foundry | Organizations offering fewer than 50 distinct typeface families | $250/year |
| Commercial Foundry | Organizations offering 50+ families, or those licensing fonts commercially at any scale | $1,500/year |
| Enterprise | Organizations integrating AFRP into an OEM product or platform serving more than 1M monthly active users | Negotiated |

Fees must be renewed within 30 days prior to the annual anniversary of approval. Failure to renew within a 15-day grace period results in suspension. Suspended shorthands may be reinstated within 180 days by paying the outstanding fee. After 180 days, the shorthand may be released for new registration.

### 6.4 Compliance Testing

The Atto Protocol Authority performs ongoing compliance monitoring:
- Monthly automated ARCTS runs against each registered registry.
- Weekly integrity spot-checks — random font assets fetched and SHA-256 verified against manifest declarations.
- Quarterly license metadata accuracy audits.

Failure to remediate within 14 calendar days of notification MAY result in suspension pending remediation.

### 6.5 Appeal Process

1. Appeal MUST be submitted within 30 calendar days of the rejection or action notice.
2. Appeal MUST address the specific grounds cited.
3. The Technical Review Panel consists of three independent individuals: at least one affiliated with a registered open-source font project; at least one affiliated with a commercial type foundry; no more than one may be an employee of Atto Technologies Inc.
4. Panel MUST render a decision within 45 calendar days.
5. Panel decision is final.

Submit to `appeals@registry.atto.tech` with subject line `AFRP Appeal — [scope name]`.

### 6.6 Shorthand Revocation

Grounds for revocation:
- Failure to renew after the grace period.
- Material breach of the Code of Conduct.
- Loss of eligibility (typefaces demonstrated to be non-original).
- Sustained ARCTS non-compliance not remediated within 30 days.

Upon revocation: the scope is removed from the shorthand registry within 24 hours; the registration record is marked revoked; the scope enters a 12-month quarantine during which it cannot be re-registered by any party.

### 6.7 Scope Delegation

A registered scope owner MAY declare sub-scope delegations. Delegations allow a single registered scope to route specific sub-namespaces to specialist registries while retaining the parent scope as the governing entity.

The scope owner submits a delegation amendment to the Atto Protocol Authority. The delegated registry MUST pass ARCTS before the delegation is published. Approved delegations appear in the shorthand registry:

```json
{
  "adobe": {
    "base_url": "https://afrp.adobe.com/",
    "delegations": {
      "monotype": "https://fonts.monotype.com/afrp/",
      "linotype": "https://afrp.linotype.com/"
    }
  }
}
```

Font references using delegated sub-scopes:

```
@adobe/HelveticaNeue            ; resolves at https://afrp.adobe.com/
@adobe/monotype/HelveticaNeue   ; resolves at https://fonts.monotype.com/afrp/
@adobe/linotype/Optima          ; resolves at https://afrp.linotype.com/
```

Governance constraints:
- Only the registered scope owner can declare or modify delegations for their scope.
- Delegation is one level deep. Four-component identifiers are invalid per the ABNF.
- The parent scope owner is responsible for the delegated registry's Code of Conduct compliance.
- Delegated registries have no authority to further sub-delegate.

---

## 7. Fallback Policy

### 7.1 Fallback Chain Evaluation

When primary resolution fails for any reason producing an ERROR-level code (§5.8), the resolver MUST evaluate the fallback chain in order:

**Step F1 — Document-declared fallback array.** If the font declaration in the AHS document's font block includes a `fallback` array (see §8.1), resolve each entry sequentially using the full §5.2 algorithm. Use the first successful resolution. MUST NOT skip entries.

**Step F2 — Implicit Atto fallback (Form B only).** If the primary identifier is Form B and the document's `fallback_to_atto` flag is `true`, attempt to resolve `@/{TypefaceName}` against the canonical Atto registry. This step applies to Form B only; Form A and Form C MUST NOT trigger this fallback.

`fallback_to_atto` defaults to `true` in `DRAFT` state and `false` in `EXECUTED` state. An `EXECUTED` document with `fallback_to_atto: true` MUST be treated as `false`, with a `EXECUTED_FALLBACK_OVERRIDE` warning logged.

**Step F3 — System font reference.** If the `fallback` array contains a `system:` prefixed entry (see §7.3) and all prior attempts have failed, substitute the referenced system font. Permitted in `DRAFT` mode only. In `EXECUTED` mode → proceed to Step F4.

**Step F4 — Terminal failure.**
- `DRAFT` mode: substitute the system default sans-serif and emit `FONT_UNRESOLVED` (visible to the document author).
- `EXECUTED` mode: render a visible error indicator in the affected content region and halt rendering of that region. MUST NOT substitute any font.

### 7.2 Draft Mode vs. Executed Mode

| Behavior | DRAFT mode | EXECUTED mode |
|---|---|---|
| `fallback_to_atto` default | `true` | `false` |
| System font substitution permitted | Yes | No |
| All-failure outcome | System sans-serif | Visible error, rendering halted |
| TLS validation skip permitted | Yes (with warning) | No |
| `@pinned` version specifier | Treated as `@latest` | MUST use pinned version |
| `full_integrity` check | Optional | MUST be applied |

### 7.3 System Font References

System font references use the `system:` prefix and are valid only as fallback entries. MUST NOT appear as primary font identifiers. MUST NOT be the sole font entry for a document intended for `EXECUTED` state, as system fonts differ across platforms and cannot be integrity-pinned.

| Reference | Meaning |
|---|---|
| `system:sans-serif` | System default proportional sans-serif |
| `system:serif` | System default proportional serif |
| `system:monospace` | System default monospace |
| `system:ui` | System default UI font (San Francisco, Segoe UI, etc.) |

### 7.4 Offline Fallback Sequence

When font resolution fails in `DRAFT` mode and the fallback chain is exhausted, the resolver MUST attempt the following offline fallbacks in order, stopping at the first success:

**Offline Fallback 1 — Renderer-bundled Atto default font.** Every compliant AFRP renderer MUST include a bundled copy of `@/Lineal`. The bundled binary's SHA-256 hash MUST be baked into the renderer binary itself — not fetched from the network. When activated:
1. Load the bundled `@/Lineal` binary.
2. Verify its integrity against the hash embedded in the renderer build.
3. Emit `FONT_SUBSTITUTED` with `{ "substituted_with": "atto_default", "original_identifier": "<identifier>" }`.
4. Display a visible substitution indicator in the document authoring UI.

**Offline Fallback 2 — Host system default sans-serif.** If the bundled font is also unavailable (corrupted installation, stripped embedded environment), fall back to the host system's default sans-serif (equivalent to CSS `font-family: sans-serif`). Emit `FONT_SUBSTITUTED` with `{ "substituted_with": "system_default", "original_identifier": "<identifier>" }` and display a visible indicator.

**Executed Mode Hard Failure.** In `EXECUTED` mode, the offline fallback sequence is entirely prohibited. A renderer in `EXECUTED` mode MUST NOT substitute any font under any circumstances — neither the bundled Atto default nor the system default.

When font resolution fails in `EXECUTED` mode:
1. Emit `PINNED_FONT_UNAVAILABLE` as a hard error.
2. Display a visible error indicator: "FONT UNAVAILABLE — document cannot be rendered" and the font identifier.
3. Halt rendering of the affected content region. Adjacent regions that do not depend on the unavailable font SHOULD continue rendering normally.
4. MAY offer the user the option to manually supply the correct font binary. If supplied:
   - Compute the SHA-256 hash of the supplied file.
   - Compare against `full_integrity` in the execution metadata pin.
   - If hashes match → proceed with rendering.
   - If hashes do not match → reject with `INTEGRITY_VIOLATION`. MUST NOT render with a user-supplied binary whose hash does not match the pin.

---

## 8. AHS Document Syntax — Font Declaration Block

### 8.1 Font Block in AHS Metadata Header

AHS documents declare their font requirements in the `atto-meta` header block. The `fonts` key is an array of font declaration objects:

```atto
---atto-meta
protocol_version: "1.0"
fonts:
  - id: body
    ref: "@/Lineal"
    weight: 400
    style: normal
    axes:
      wght: 400
      opsz: 14
    fallback: ["@velvetyne/Lineal", "system:sans-serif"]

  - id: heading
    ref: "@/Grotesk"
    weight: 700
    style: normal
    axes:
      wght: 700
    fallback: ["system:sans-serif"]

  - id: mono
    ref: "@/Sligoil"
    weight: 400
    style: normal
    axes:
      wght: 400
      opsz: 12

  - id: custom
    ref: "fonts.mycorp.com/HouseFont@1.2.0"
    weight: [400, 700]
    style: [normal, italic]
    inline_manifest:
      version: "1.2.0"
      url: "https://fonts.mycorp.com/HouseFont/1.2.0/HouseFont-Regular.woff2"
      integrity: "sha256-abc123DEFghi456JKLmno789PQRstu012VWXyz3456A="
      license: { spdx: "LicenseRef-Proprietary", url: "https://fonts.mycorp.com/license" }
---
```

Each font declaration object supports the following fields:

| Field | Required | Type | Description |
|---|---|---|---|
| `id` | REQUIRED | string | Document-local name, unique within the `fonts` block. Used in inline markup as `{font=body}`. |
| `ref` | REQUIRED | font-identifier | AFRP font identifier conforming to the §3.2 ABNF grammar. |
| `weight` | OPTIONAL | integer or array | CSS weight value(s) 100–900. If array, renderer loads all listed weights. Defaults to `400`. |
| `style` | OPTIONAL | string or array | `normal`, `italic`, or `oblique`. If array, renderer loads all listed styles. Defaults to `normal`. |
| `axes` | OPTIONAL | object (string → number) | Explicit OpenType axis values for variable fonts. Keys are 4-character axis tags. Absent axes default to manifest defaults per §5.4. In `EXECUTED` state, the complete resolved axis set (explicit + defaulted) MUST appear in the execution metadata pin. |
| `fallback` | OPTIONAL | array of font-identifiers | Ordered fallback chain evaluated per §7.1. Each entry MUST be a valid font identifier or a `system:` reference per §7.3. |
| `inline_manifest` | OPTIONAL | object | Inline manifest for Form C fonts unreachable via Steps 4A or 4B. Mirrors the `font-entry` schema scoped to a single version. MUST match execution metadata for `EXECUTED` documents. |
| `fallback_to_atto` | OPTIONAL | boolean | Per-font override of the document-level `fallback_to_atto` flag. |

An AHS parser MUST reject a document with duplicate `id` values in the `fonts` block. An AHS parser MUST emit `MISSING_REF` for any font declaration object missing a `ref` field.

### 8.2 Inline Font References

Font identifiers may appear in inline markup using the AHS span annotation notation:

```atto
This term is rendered in [custom font]{font=@adobe/Garamond wght=400}.

This phrase is [emphasized]{font=@velvetyne/Bagnard wght=400 ital=1}.

This identifier uses the document-declared font: [monospaced text]{font=mono}.
```

The `{font=...}` annotation accepts either:
- A direct font reference (identifier + optional axis qualifiers).
- A document-declared font `id` (e.g., `{font=body}`, `{font=heading}`).

When a declared `id` is used, the resolver MUST use the `ref`, `weight`, and `style` from the corresponding declaration block entry, unless inline qualifiers explicitly override them for that span. Resolvers MUST NOT resolve inline references to undeclared `id` values without loading a default weight and style. Direct inline font references in `DRAFT` mode activate `fallback_to_atto: true` behavior.

### 8.3 Integrity Pinning in Document Metadata

When an AHS document is sealed to `EXECUTED` state, the AHS signer MUST perform the following for each font declaration in the `fonts` block:

1. Resolve each font identifier to a concrete version, style, and format entry per §5.2–§5.4.
2. Record `_resolved_version`.
3. Record the complete resolved `axes` map — all axis values active at signing, including manifest defaults for axes not explicitly specified.
4. Record `pinned_format` (e.g., `woff2`).
5. Record `full_integrity`: the SHA-256 SRI hash of the complete, unmodified font binary fetched from the registry.
6. If subsetting occurred during export (e.g., generating a PDF of this document), additionally record:
   - `subset_integrity`: SHA-256 SRI hash of the subsetted binary embedded in the export.
   - `subset_glyph_ids`: array of glyph IDs included in the subset.
   - `subset_unicode_ranges`: human-readable summary of covered Unicode ranges.
7. For `per_execution` or `royalty` fonts: record the `use_receipt` object returned by the payment endpoint.

Example executed `atto-meta` block with a full integrity pin:

```atto
---atto-meta
protocol_version: "1.0"
execution_state: "EXECUTED"
execution_timestamp: "2026-04-24T03:00:00Z"
fonts:
  - id: body
    ref: "@/Lineal"
    weight: 400
    style: normal
    axes:
      wght: 400
      opsz: 14
    pinned_format: "woff2"
    full_integrity: "sha256-ZXh4mNAbCd12efGH34ijKL56mnOP78qrST90uvWX12Y="
    subset_integrity: "sha256-Sb5eTz3nOpQr21StUv45WxYz67AbCd89EfGh01IjKl="
    subset_glyph_ids: [32, 65, 66, 67, 68, 69, 70, 97, 98, 99]
    subset_unicode_ranges: ["U+0020-007E", "U+00A0-00FF"]
    _resolved_version: "2.1.0"

  - id: heading
    ref: "@/Grotesk"
    weight: 700
    style: normal
    axes:
      wght: 700
    pinned_format: "woff2"
    full_integrity: "sha256-QrStuv01WxYz23AbCd45EfGh67IjKl89MnOp01QrSt="
    _resolved_version: "1.4.2"

  - id: hydra
    ref: "@hydra/HydraDisplay@2.0.0"
    weight: 400
    style: normal
    axes:
      wght: 400
    pinned_format: "woff2"
    full_integrity: "sha256-HyDrA789WXYZab012cde345fghIJK678lmNopQRStu="
    _resolved_version: "2.0.0"
    use_receipt:
      font: "@hydra/HydraDisplay@2.0.0"
      document_id: "alp-doc-99999"
      granted_at: "2026-04-24T03:00:00Z"
      expires: null
      receipt_signature: "ed25519-sig-placeholder=="
---
```

**Two-layer integrity validation rules:**

| Check | What is verified |
|---|---|
| `full_integrity` | The binary fetched from the registry at signing time. A validator MUST verify the current registry binary against this hash. |
| `subset_integrity` | The subset binary embedded in this export. A validator MUST verify the embedded binary against this hash. |
| `subset_glyph_ids` | The validator MAY verify that the subset contains all glyphs present in the document's text content and no extra glyphs were injected. |
| `full_integrity` + `subset_integrity` chain | `subset_integrity` alone is insufficient — it proves only that the embedded binary is unaltered, not that it was derived from the legitimate source. Both MUST be verified together for a complete integrity assertion. |

**Subsetting scope:** Subsetting is a post-rendering operation permitted only for export to downstream formats (PDF, DOCX). The resolver MUST always fetch and cache the full font binary. Subsetting is applied by the export module after rendering is complete and MUST NOT occur during in-protocol font resolution.

---

## 9. Security Considerations

### 9.1 Integrity Hash Pinning

The `full_integrity` + `subset_integrity` two-layer mechanism is the primary defense against font substitution attacks in `EXECUTED` AHS documents. A font substitution attack replaces a registry binary with a different one — potentially containing lookalike glyphs, rendered malware via font hinting abuse, or subtle visual alterations to document content.

By recording the SHA-256 hash of the font binary at signing time and re-verifying it at render time, AFRP ensures any substitution is detected. The `INTEGRITY_VIOLATION` error MUST halt rendering of the affected region. Silent substitution MUST NOT occur in any compliant renderer.

Implementers MUST ensure:
- SHA-256 computation covers the complete binary after content-encoding decompression.
- Comparison uses constant-time equality to prevent timing side-channels.
- `full_integrity` fields in `EXECUTED` metadata are covered by the AHS document signature (see AHS §4). A document whose integrity fields are not covered by the cryptographic signature MUST be treated as tampered.

### 9.2 TLS Certificate Validation

All AFRP network requests — manifest fetches, shorthand registry fetches, and font asset fetches — MUST be made over HTTPS with full TLS certificate validation:
- Hostname verification.
- Certificate chain validation to a trusted root CA.
- Certificate revocation checking via OCSP or CRL (SHOULD be performed; MAY soft-fail if the revocation service is unreachable, logging `REVOCATION_CHECK_SKIPPED`).
- Certificate expiry validation.

A resolver MUST NOT accept self-signed certificates for non-localhost registries. No global TLS bypass flag is permitted. Development tooling requiring TLS bypass MUST implement it at the transport layer in a way that cannot be activated in production builds.

### 9.3 Scope Squatting Prevention

Scope squatting is prohibited under the Code of Conduct. Mitigations:
- The Atto Protocol Authority SHOULD proactively contact the operator of a well-known type foundry before approving a same-name scope registration by a different entity.
- The 12-month quarantine on revoked scopes (§6.6) prevents rapid re-registration.
- Resolvers encountering `SCOPE_NOT_FOUND` MUST NOT attempt heuristic URL construction based on the scope name.

### 9.4 Homoglyph and Lookalike Font Prohibition

The Code of Conduct prohibits fonts whose primary design intent is to impersonate another typeface for phishing, social engineering, or brand impersonation — including fonts with glyphs that mimic another font's distinctive letterforms with subtle introduced differences, and fonts where glyphs are replaced with cross-script lookalikes with no other design intent.

The prohibition applies to intent to deceive, not to the mere presence of cross-script similarity. Legitimate Unicode-aware typefaces with multi-script coverage are not prohibited. The Atto Protocol Authority MAY commission an independent type design review in response to a credible report of homoglyph font distribution. A confirmed violation is grounds for immediate suspension and initiation of revocation.

### 9.5 Private Registry Support

The permissionless Form C tier fully supports private and enterprise font registries without Atto registration.

For `localhost` and loopback addresses in `DRAFT` mode only:
- HTTP (non-TLS) is permitted.
- Self-signed TLS certificates are permitted with a `SELF_SIGNED_CERT` warning.
- `full_integrity` is not required.

In `EXECUTED` mode, no relaxations apply regardless of the registry host. An AHS document CANNOT be sealed to `EXECUTED` state while referencing a `localhost` or loopback font resource.

For private enterprise registries on internal DNS hostnames:
- HTTPS with valid certificates issued by an enterprise CA is REQUIRED.
- Form C identifiers MUST be used.
- The registry MUST serve a conforming AFRP manifest.
- `full_integrity` MUST be populated at signing time.

### 9.6 Rate Limiting and Caching Expectations

Resolver requirements:
- Implement exponential backoff on HTTP 429. Initial backoff: 1 second; maximum: 60 seconds.
- Respect `Retry-After` headers on HTTP 429 and 503 responses.
- MUST NOT issue more than 10 concurrent requests to a single registry host.
- SHOULD batch asset downloads from the same registry to reduce connection overhead.

Registry recommendations:
- Implement rate limiting and return `Retry-After` on rate-limited responses.
- Support HTTP/2 and HTTP/3 for multiplexed concurrent requests.

### 9.7 Manifest Injection and Tampering

**Malicious registry operator.** `full_integrity` in `EXECUTED` documents ensures previously signed documents cannot be compromised by later malicious registry updates. Freshly resolved documents (no pin) can receive a malicious binary — partially mitigated by the Code of Conduct and ongoing compliance monitoring (§6.4). Resolvers MAY implement optional user confirmation before loading fonts from newly-registered or recently-changed registries.

**Shorthand registry compromise.** If `https://registry.atto.tech/shorthands` is compromised, an attacker could redirect a registered scope to a malicious host. Mitigations:
- The shorthand registry MUST be served with HSTS and HPKP (or equivalent certificate transparency monitoring).
- Resolvers SHOULD alert on unexpected changes to registered base URLs.
- The Atto Protocol Authority MUST maintain a public audit log of all shorthand registry changes at `https://registry.atto.tech/audit-log`.

**Build-time asset capture.** For `EXECUTED` documents, resolvers SHOULD support a build-time capture mode in which all resolved font assets are downloaded, integrity-verified, and stored alongside the document at signing time. Optional but RECOMMENDED for high-assurance use cases.

---

## 10. IANA and Protocol Considerations

### 10.1 Well-Known URI Registration

This specification requests IANA registration of the following well-known URI suffix in the "Well-Known URIs" registry established by [RFC 8615]:

| Field | Value |
|---|---|
| URI suffix | `atto-font-registry.json` |
| Change controller | Atto Technologies Inc., `spec@atto.tech` |
| Specification | This document |
| Status | Provisional |
| Related resources | `https://spec.atto.tech/afrp` |

### 10.2 MIME Type Registration

This specification requests IANA registration of the following media type:

| Field | Value |
|---|---|
| Type name | `application` |
| Subtype name | `atto-font-manifest+json` |
| Required params | None |
| Optional params | `version` (e.g., `version=1.0`) |
| Encoding | UTF-8 |
| Security | See §9 |
| Applications | AHS renderers, AFRP-compliant font registries, ARCTS compliance tooling |

Resolvers MUST accept responses with `Content-Type: application/atto-font-manifest+json`. Resolvers SHOULD also accept `application/json`, logging `WRONG_CONTENT_TYPE` informational events in such cases.

### 10.3 Sigil Disambiguation

The `@` sigil in AFRP identifiers is scoped entirely to the AHS parsing context and does not conflict with CSS `@font-face` rules, email addresses, or language-level annotation systems. An AHS parser MUST NOT attempt to parse `@` characters in Markdown text or LaTeX expressions as font identifiers. AFRP parsing is triggered only in `atto-meta` block `ref:` fields and `{font=...}` inline annotations. Renderers that emit CSS internally MUST translate AFRP identifiers to `@font-face` declarations using resolved asset URLs, not expose AFRP syntax in generated CSS.

### 10.4 Protocol Versioning

The AFRP protocol version is declared in `registry.protocol_version` in all conforming manifests and in `protocol_version` in the AHS `atto-meta` block.

Versioning policy:
- **Patch increments (1.x.y):** Bug fixes, clarifications, and errata. No wire format or algorithm changes.
- **Minor increments (1.x.0):** Backward-compatible additions — new optional manifest fields, new error codes, new optional syntax. Resolvers implementing `1.x.0` MUST accept manifests declaring any `1.y.0` where y ≤ x. Unknown optional fields MUST be silently ignored (forward compatibility).
- **Major increments (2.0.0 and beyond):** Breaking changes. Specification will define a transition period and migration guidance.

---

*Atto Font Registry Protocol (AFRP) — Specification*
*Author: Curtis Baldwinson, Atto Technologies Inc.*
*Status: Draft — subject to revision before ratification*
*This document may be freely reproduced and distributed for review and implementation purposes during the draft period. Normative citations should reference `https://spec.atto.tech/afrp`.*
