import { load } from 'js-yaml';

import raw from './metadata.overrides.yaml?raw';

// ponytail: parsed once at import time; the yaml is small and this module is only imported where the merged dataset is built.
export const metadataOverrides: unknown = load(raw);
