import { readFile, writeFile } from 'node:fs/promises';
import { site } from '../src/site.config';
import { isDeepStrictEqual } from 'node:util';

async function getMetadata(dataverseURL: string, collectionId?: string): Promise<any> {
  const path = collectionId
    ? `/api/dataverses/${encodeURIComponent(collectionId)}/metadatablocks?returnDatasetFieldTypes=true`
    : '/api/metadatablocks?returnDatasetFieldTypes=true';
  const url = new URL(path, dataverseURL);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata from ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

const metadataJsonPath = new URL('../src/data/metadata.json', import.meta.url);

const dataverseURL = site.dataverseURL;
const collectionId = site.collectionId;

const fetchMetadata = await getMetadata(dataverseURL, collectionId);
const localMetadata = JSON.parse(await readFile(metadataJsonPath, 'utf-8'));

const hasChanged = !isDeepStrictEqual(fetchMetadata, localMetadata);

if (hasChanged) {
  console.log('Metadata has changed. Updating local metadata.json...');
  await writeFile(metadataJsonPath, JSON.stringify(fetchMetadata, null, 4));
} else {
  console.log('No changes detected in metadata. No update needed.');
}
