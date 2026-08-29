import { z } from 'zod';

const nonempty = z.string().trim().min(1);

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
  const merged = blocks.map((block) => ({
    ...block,
    fields: block.fields.map((field) => ({ ...field, ...overrides[field.id] })),
  }));
  return metadataSchema.parse(merged);
}

export function countFields(blocks: MetadataBlock[]): number {
  return blocks.reduce((total, block) => total + block.fields.length, 0);
}

export function getFieldPath(block: MetadataBlock, field: MetadataField): string {
  return `${block.name} › ${field.name}`;
}
