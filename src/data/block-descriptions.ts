import { load } from 'js-yaml';

import raw from './block-descriptions.yaml?raw';

// ponytail: parsed once at import time; the yaml is small and this module is only imported where the merged dataset is built.
export const blockDescriptions: unknown = load(raw);
