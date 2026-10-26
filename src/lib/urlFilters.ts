
export interface UrlQuery {
    q: string;
    block: string[];
    required: boolean;
    bestPractice: string[];
}

export function parseFiltersFromUrl(search: string, blockIds: readonly string[], bestPracticeTiers: readonly string[]): UrlQuery {
    const params = new URLSearchParams(search);

    return {
        q: params.get('q') || '',
        block: params.getAll('block').filter((id) => blockIds.includes(id)),
        required: params.get('required') === 'true',
        bestPractice: params.getAll('bestPractice').filter((tier) => bestPracticeTiers.includes(tier)),
    };
}