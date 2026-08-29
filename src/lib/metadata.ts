import { z } from 'zod';

const nonempty = z.string().trim().min(1);

// Shape of src/data/metadata.json, the raw Dataverse `/api/metadatablocks`
// export.
const rawFieldSchema: z.ZodType<RawField> = z.lazy(() =>
  z.object({
    name: nonempty,
    displayName: nonempty,
    description: nonempty,
    type: nonempty,
    multiple: z.boolean(),
    isRequired: z.boolean(),
    controlledVocabularyValues: z.array(nonempty).optional(),
    childFields: z.record(nonempty, rawFieldSchema).optional(),
  }),
);
interface RawField {
  name: string;
  displayName: string;
  description: string;
  type: string;
  multiple: boolean;
  isRequired: boolean;
  controlledVocabularyValues?: string[];
  childFields?: Record<string, RawField>;
}

const rawBlockSchema = z.object({
  name: nonempty,
  displayName: nonempty,
  fields: z.record(nonempty, rawFieldSchema),
});

const rawMetadataSchema = z.object({ data: z.array(rawBlockSchema).min(1) });

const blockDescriptionsSchema = z.record(nonempty, nonempty);

const nativeFieldSchema = z.object({
  id: nonempty,
  name: nonempty,
  definition: nonempty,
  type: nonempty,
  required: z.boolean(),
  repeatable: z.boolean(),
  values: z.array(nonempty).optional(),
});

const nativeBlockSchema = z.object({
  id: nonempty,
  name: nonempty,
  description: nonempty,
  fields: z.array(nativeFieldSchema).min(1),
});

const fieldOverrideSchema = z.object({
  bestPracticeDefinition: nonempty.optional(),
  recommendation: nonempty.optional(),
  example: nonempty.optional(),
});

const overridesSchema = z.record(nonempty, fieldOverrideSchema);

const metadataFieldSchema = nativeFieldSchema.extend(fieldOverrideSchema.shape);

const metadataBlockSchema = z.object({
  id: nonempty,
  name: nonempty,
  description: nonempty,
  fields: z.array(metadataFieldSchema).min(1),
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

export function validateMetadata(input: unknown, overridesInput?: unknown): MetadataBlock[] {
  if (overridesInput === undefined) {
    return metadataSchema.parse(input);
  }

  const blocks = z.array(nativeBlockSchema).min(1).parse(input);
  const overrides = overridesSchema.parse(overridesInput);
  // Override keys are the field's leaf name (e.g. "authorAffiliation"), not its
  // possibly-prefixed id (e.g. "author.authorAffiliation"), since overrides are
  // authored once per Dataverse field regardless of which compound it lives in.
  const leafName = (id: string) => id.split('.').at(-1)!;
  const merged = blocks.map((block) => ({
    ...block,
    fields: block.fields.map((field) => ({ ...field, ...overrides[leafName(field.id)] })),
  }));
  return metadataSchema.parse(merged);
}

// Compound fields (those with childFields) aren't emitted themselves; each child
// becomes its own leaf entry, id-prefixed by the parent's name (e.g.
// "author.authorName") to keep ids unique and traceable back to the raw field.
function flattenRawField(field: RawField, id: string): z.infer<typeof nativeFieldSchema>[] {
  const own = {
    id,
    name: field.displayName,
    definition: field.description,
    type: field.type,
    required: field.isRequired,
    repeatable: field.multiple,
    ...(field.controlledVocabularyValues?.length ? { values: field.controlledVocabularyValues } : {}),
  };

  if (!field.childFields) return [own];
  return Object.values(field.childFields).flatMap((child) => flattenRawField(child, `${id}.${child.name}`));
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
  return `${block.name} › ${field.name}`;
}
