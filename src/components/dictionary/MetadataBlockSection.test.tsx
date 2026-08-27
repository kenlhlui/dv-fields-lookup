import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MetadataBlockSection } from '@/components/dictionary/MetadataBlockSection';
import type { MetadataBlock } from '@/lib/metadata';
import type { SearchBlock } from '@/lib/search';

const block: MetadataBlock = {
  id: 'citation',
  name: 'Citation Metadata',
  description: 'Describe the people and identifiers used to cite this dataset.',
  fields: [
    {
      id: 'authorName',
      name: 'Author Name',
      definition: 'A person or organization responsible for the resource.',
      type: 'Text',
      required: true,
      repeatable: true,
      example: 'Ada Lovelace',
    },
    {
      id: 'authorIdentifier',
      name: 'Author Identifier',
      definition: 'A globally unique identifier for the author.',
      type: 'Identifier',
      required: false,
      repeatable: false,
      example: '0000-0000-0000-0000',
    },
    {
      id: 'authorIdentifierScheme',
      name: 'Author Identifier Scheme',
      definition: 'The scheme used to issue the author identifier.',
      type: 'Controlled vocabulary',
      required: false,
      repeatable: false,
      example: 'ORCID',
    },
  ],
};

const result: SearchBlock = {
  block,
  matches: new Map([
    [
      'authorIdentifier',
      {
        fieldId: 'authorIdentifier',
        score: 0.01,
        ranges: { name: [[0, 17]], definition: [[2, 11]] },
      },
    ],
  ]),
  bestScore: 0.01,
  sourceIndex: 0,
};

describe('MetadataBlockSection', () => {
  it('shows only matching fields while searching, with match state and selection details', async () => {
    const user = userEvent.setup();
    const onSelectField = vi.fn();

    render(<MetadataBlockSection result={result} onSelectField={onSelectField} />);

    expect(screen.getByRole('heading', { name: 'Citation Metadata' })).toBeInTheDocument();
    expect(screen.queryByText('Author Name')).not.toBeInTheDocument();
    expect(screen.getByText('Author Identifier')).toBeInTheDocument();
    expect(screen.queryByText('Author Identifier Scheme')).not.toBeInTheDocument();
    expect(screen.getByText('Search match')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /view details for/i })).toHaveLength(1);
    expect(screen.getByText('Type: Identifier')).toBeInTheDocument();

    const detailsButton = screen.getByRole('button', { name: 'View details for Author Identifier' });
    expect(detailsButton.closest('.grid')).toHaveClass('md:grid-cols-2');

    await user.click(detailsButton);

    expect(onSelectField).toHaveBeenCalledWith(block, block.fields[1], detailsButton);
  });

  it('shows every field when not searching (matches empty)', () => {
    const browsing: SearchBlock = { ...result, matches: new Map() };

    render(<MetadataBlockSection result={browsing} onSelectField={vi.fn()} />);

    expect(screen.getByText('Author Name')).toBeInTheDocument();
    expect(screen.getByText('Author Identifier')).toBeInTheDocument();
    expect(screen.getByText('Author Identifier Scheme')).toBeInTheDocument();
    expect(screen.queryByText('Search match')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /view details for/i })).toHaveLength(3);
  });

  it('narrows further by fieldFilter on top of the search matches', () => {
    const browsing: SearchBlock = { ...result, matches: new Map() };

    render(
      <MetadataBlockSection result={browsing} onSelectField={vi.fn()} fieldFilter={(field) => field.required} />,
    );

    expect(screen.getByText('Author Name')).toBeInTheDocument();
    expect(screen.queryByText('Author Identifier')).not.toBeInTheDocument();
    expect(screen.queryByText('Author Identifier Scheme')).not.toBeInTheDocument();
  });
});
