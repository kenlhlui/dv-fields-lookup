// Generates docs/schema.md from the zod schema. Run: npx tsx scripts/schema-doc.ts
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { metadataBlockSchema, metadataFieldSchema } from '../src/lib/metadata.ts';

// ponytail: only handles the shapes we actually use (string/boolean/array-of-string).
// Widen the type() switch if the schema grows objects or unions.
function type(p: any): string {
  return p.type === 'array' ? `${type(p.items)}[]` : p.type;
}

function table(name: string, schema: z.ZodObject): string {
  const { properties = {}, required = [] } = z.toJSONSchema(schema) as any;
  const rows = Object.entries<any>(properties).map(
    ([key, p]) =>
      `| \`${key}\` | ${type(p)} | ${required.includes(key) ? 'yes' : 'no'} | ${p.description ?? ''} |`,
  );
  return [`## ${name}`, '', '| Field | Type | Required | Description |', '| --- | --- | --- | --- |', ...rows, ''].join('\n');
}

writeFileSync(
  'docs/schema.md',
['# metadata.json schema', '', table('Block', metadataBlockSchema), table('Field', metadataFieldSchema)].join('\n'),
);
