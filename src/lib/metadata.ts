// See the https://guides.dataverse.org/en/latest/admin/metadatacustomization.html for the description of the properties.

import { z } from 'zod';

const nonempty = z.string().trim().min(1);

export const metadataFieldSchema = z.object({
  id: nonempty.describe('Dataverse `#datasetField name`. Identifies the field and maps directly to the field name used by Solr. Alphanumeric or underscore characters only, and must not start with a digit.'),
  name: nonempty.describe('Dataverse `#datasetField title`. Brief label displayed for the field.'),
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

export function validateMetadata(input: unknown): MetadataBlock[] {
  return metadataSchema.parse(input);
}

export function countFields(blocks: MetadataBlock[]): number {
  return blocks.reduce((total, block) => total + block.fields.length, 0);
}

export function getFieldPath(block: MetadataBlock, field: MetadataField): string {
  return `${block.name} › ${field.name}`;
}
