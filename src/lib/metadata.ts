// See the https://guides.dataverse.org/en/latest/admin/metadatacustomization.html for the description of the properties.

import { z } from 'zod';

const nonempty = z.string().trim().min(1);

export const metadataFieldSchema = z.object({
  id: nonempty.describe('Dataverse `#datasetField name`. Identifies the field and maps directly to the field name used by Solr. Alphanumeric or underscore characters only, and must not start with a digit.'),
  name: nonempty.describe('Dataverse `#datasetField title`. Brief label displayed for the field.'),
  parent: nonempty.optional().describe('Display name of the compound field this field is a child of, i.e. the Dataverse `#datasetField` whose `childFields` contain it. Absent for top-level fields.'),
  definition: nonempty.describe('Dataverse `#datasetField description`. Free-text explanation of the field.'),
  bestPracticeDefinition: nonempty.optional().describe('Definition from the Dataverse North Metadata Best Practices Guide. Not a Dataverse property.'),
  recommendation: nonempty.optional().describe('Guidance on when to fill the field in, e.g. `Required`, `Recommended`, `Optional`. Not a Dataverse property.'),
  type: nonempty.describe('Dataverse `#datasetField fieldType`. One of `none`, `date`, `email`, `text`, `textbox`, `string`, `url`, `int`, `float`.'),
  required: z.boolean().describe('Dataverse `#datasetField required`. Whether a value must be supplied.'),
  repeatable: z.boolean().describe('Dataverse `#datasetField allowmultiples`. Whether the field may be entered more than once.'),
  example: nonempty.optional().describe('Sample value, for display only. Not a Dataverse property.'),
  values: z.array(nonempty).optional().describe('Controlled vocabulary entries, i.e. the `#controlledVocabulary` values allowed when Dataverse `allowControlledVocabulary` is TRUE.'),
});

export const metadataBlockSchema = z.object({
  id: nonempty.describe('Dataverse `#metadataBlock name`. Identifies the block. No spaces or punctuation except underscore, and by convention starts with a letter and uses lower camel case.'),
  name: nonempty.describe('Dataverse `#metadataBlock displayName`. Brief label displayed for the block.'),
  description: nonempty.optional().describe('Summary of what the block covers, for display only. Not a Dataverse property.'),
  fields: z.array(metadataFieldSchema).min(1).describe('The `#datasetField` entries belonging to this block.'),
});

const metadataSchema = z.array(metadataBlockSchema).min(1).superRefine((blocks, context) => {
  const blockIds = new Set<string>();
  const fieldIds = new Set<string>();
  const addId = (seen: Set<string>, kind: string, id: string, path: (string | number)[]) => {
    if (seen.has(id)) {
      context.addIssue({ code: 'custom', message: `Duplicate ${kind} id: ${id}`, path });
    }
    seen.add(id);
  };

  for (const [blockIndex, block] of blocks.entries()) {
    addId(blockIds, 'block', block.id, [blockIndex, 'id']);
    for (const [fieldIndex, field] of block.fields.entries()) {
      addId(fieldIds, 'field', field.id, [blockIndex, 'fields', fieldIndex, 'id']);
    }
  }
});

export type MetadataField = z.infer<typeof metadataFieldSchema>;
export type MetadataBlock = z.infer<typeof metadataBlockSchema>;

// Override entries are a subset of the display-only metadataFieldSchema fields,
// authored by hand per Dataverse field (keyed by leaf name) in metadata.overrides.yaml.
const overrideEntrySchema = z.object({
  bestPracticeDefinition: nonempty.optional(),
  recommendation: nonempty.optional(),
  example: nonempty.optional(),
});
const overridesSchema = z.record(nonempty, overrideEntrySchema);
const blockDescriptionsSchema = z.record(nonempty, nonempty);

export function validateMetadata(input: unknown, overridesInput?: unknown): MetadataBlock[] {
  if (overridesInput === undefined) {
    return metadataSchema.parse(input);
  }

  const blocks = z.array(metadataBlockSchema).min(1).parse(input);
  const rawOverrides = z.record(nonempty, z.record(nonempty, z.unknown())).parse(overridesInput);
  // Override keys are the field's leaf name (e.g. "authorAffiliation"), not its
  // possibly-prefixed id (e.g. "author.authorAffiliation"), since overrides are
  // authored once per Dataverse field regardless of which compound it lives in.
  const leafName = (id: string) => id.split('.').at(-1)!;
  // ponytail: an override key with no matching field (typo, removed field) is just
  // stale data, not a build-breaking error, so it's dropped before shape-validating
  // the rest rather than failing the whole parse over it.
  const leafNames = new Set(blocks.flatMap((block) => block.fields.map((field) => leafName(field.id))));
  const overrides = overridesSchema.parse(
    Object.fromEntries(Object.entries(rawOverrides).filter(([key]) => leafNames.has(key))),
  );
  const merged = blocks.map((block) => ({
    ...block,
    fields: block.fields.map((field) => ({ ...field, ...overrides[leafName(field.id)] })),
  }));
  return metadataSchema.parse(merged);
}

// Shape of one field entry in the raw Dataverse /api/metadatablocks response.
// Compound fields (childFields present) carry no useful data of their own.
type RawField = {
  name: string;
  displayName: string;
  description: string;
  type: string;
  isRequired: boolean;
  multiple: boolean;
  controlledVocabularyValues?: string[];
  childFields?: Record<string, RawField>;
};

const rawFieldSchema: z.ZodType<RawField> = z.lazy(() =>
  z.object({
    name: nonempty,
    displayName: nonempty,
    description: nonempty,
    type: nonempty,
    isRequired: z.boolean(),
    multiple: z.boolean(),
    controlledVocabularyValues: z.array(nonempty).optional(),
    childFields: z.record(nonempty, rawFieldSchema).optional(),
  }),
);

const rawBlockSchema = z.object({
  name: nonempty,
  displayName: nonempty,
  fields: z.record(nonempty, rawFieldSchema),
});

const rawMetadataSchema = z.object({
  data: z.array(rawBlockSchema).min(1),
});

// Compound fields (those with childFields) aren't emitted themselves; each child
// becomes its own leaf entry, id-prefixed by the parent's name (e.g.
// "author.authorName") to keep ids unique and traceable back to the raw field.
function flattenRawField(field: RawField, id: string, parent?: string): MetadataField[] {
  const own: MetadataField = {
    id,
    name: field.displayName,
    ...(parent ? { parent } : {}),
    definition: field.description,
    type: field.type,
    required: field.isRequired,
    repeatable: field.multiple,
    ...(field.controlledVocabularyValues?.length ? { values: field.controlledVocabularyValues } : {}),
  };

  if (!field.childFields) return [own];
  return Object.values(field.childFields).flatMap((child) =>
    flattenRawField(child, `${id}.${child.name}`, field.displayName),
  );
}

/** Builds validated MetadataBlock[] straight from the raw Dataverse API export, merging
 * in field overrides (keyed by leaf field name) and block descriptions (keyed by block id). */
export function buildMetadata(rawInput: unknown, overridesInput: unknown, blockDescriptionsInput: unknown): MetadataBlock[] {
  const raw = rawMetadataSchema.parse(rawInput);
  const blockDescriptions = blockDescriptionsSchema.parse(blockDescriptionsInput);
  // block-descriptions.yaml's key order is the desired display order; blocks it
  // doesn't mention sort after all listed ones, keeping their relative API order.
  const displayOrder = Object.keys(blockDescriptions);

  const flattened = raw.data.map((block) => ({
    id: block.name,
    name: block.displayName,
    // Falls back to the API's own displayName when block-descriptions.yaml has no
    // entry for this block yet, rather than failing the whole build over it.
    description: blockDescriptions[block.name] ?? block.displayName,
    fields: Object.values(block.fields).flatMap((field) => flattenRawField(field, field.name)),
  }));

  const sorted = flattened.toSorted((a, b) => {
    const rank = (id: string) => {
      const index = displayOrder.indexOf(id);
      return index === -1 ? displayOrder.length : index;
    };
    return rank(a.id) - rank(b.id);
  });

  return validateMetadata(sorted, overridesInput);
}

export function countFields(blocks: MetadataBlock[]): number {
  return blocks.reduce((total, block) => total + block.fields.length, 0);
}

export function getFieldPath(block: MetadataBlock, field: MetadataField): string {
  return [block.name, field.parent, field.name].filter(Boolean).join(' › ');
}
