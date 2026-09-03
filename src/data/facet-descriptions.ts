import { load } from 'js-yaml';
import { z } from 'zod';

import raw from './facet-descriptions.yaml?raw';

const facetDescriptionsSchema = z.object({
  metadataBlock: z.string(),
  required: z.string(),
  bestPractice: z.string(),
});

// ponytail: parsed once at import time; the yaml is tiny and this module is only imported by MetadataDictionary.
export const facetDescriptions = facetDescriptionsSchema.parse(load(raw));
