import { z } from 'zod';

const nonempty = z.string().trim().min(1);

const metadataFieldSchema = z.object({
  id: nonempty,
  name: nonempty,
  summary: nonempty,
  description: nonempty,
  type: nonempty,
  required: z.boolean(),
  repeatable: z.boolean(),
  example: nonempty,
  aliases: z.array(nonempty),
});

const metadataGroupSchema = z.object({
  id: nonempty,
  name: nonempty,
  fields: z.array(metadataFieldSchema).min(1),
});

const metadataBlockSchema = z.object({
  id: nonempty,
  name: nonempty,
  description: nonempty,
  groups: z.array(metadataGroupSchema).min(1),
});

const metadataSchema = z.array(metadataBlockSchema).min(1).superRefine((blocks, context) => {
  const blockIds = new Set<string>();
  const groupIds = new Set<string>();
  const fieldIds = new Set<string>();
  const addId = (seen: Set<string>, kind: string, id: string, path: (string | number)[]) => {
    if (seen.has(id)) {
      context.addIssue({ code: 'custom', message: `Duplicate ${kind} id: ${id}`, path });
    }
    seen.add(id);
  };

  for (const [blockIndex, block] of blocks.entries()) {
    addId(blockIds, 'block', block.id, [blockIndex, 'id']);
    for (const [groupIndex, group] of block.groups.entries()) {
      addId(groupIds, 'group', group.id, [blockIndex, 'groups', groupIndex, 'id']);
      for (const [fieldIndex, field] of group.fields.entries()) {
        addId(fieldIds, 'field', field.id, [blockIndex, 'groups', groupIndex, 'fields', fieldIndex, 'id']);
      }
    }
  }
});

export type MetadataField = z.infer<typeof metadataFieldSchema>;
export type MetadataGroup = z.infer<typeof metadataGroupSchema>;
export type MetadataBlock = z.infer<typeof metadataBlockSchema>;

export function validateMetadata(input: unknown): MetadataBlock[] {
  return metadataSchema.parse(input);
}

export function countFields(blocks: MetadataBlock[]): number {
  return blocks.reduce(
    (total, block) => total + block.groups.reduce((groupTotal, group) => groupTotal + group.fields.length, 0),
    0,
  );
}

export function getFieldPath(block: MetadataBlock, group: MetadataGroup, field: MetadataField): string {
  return `${block.name} › ${group.name} › ${field.name}`;
}
