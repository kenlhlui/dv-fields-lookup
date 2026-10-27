export interface UrlQuery {
  q: string;
  block: string[];
  required: boolean;
  bestPractice: string[];
}

export function parseFiltersFromUrl(
  search: string,
  blockIds: readonly string[],
  bestPracticeTiers: readonly string[],
): UrlQuery {
  const params = new URLSearchParams(search);

  return {
    q: params.get('q') || '',
    block: params.getAll('block').filter((id) => blockIds.includes(id)),
    required: params.get('required') === 'true',
    bestPractice: params.getAll('bestPractice').filter((tier) => bestPracticeTiers.includes(tier)),
  };
}

export function serializeFilters(filters: UrlQuery): string {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  for (const id of filters.block) {
    params.append('block', id);
  }
  if (filters.required) {
    params.set('required', 'true');
  }
  for (const tier of filters.bestPractice) {
    params.append('bestPractice', tier);
  }
  return params.toString();
}
