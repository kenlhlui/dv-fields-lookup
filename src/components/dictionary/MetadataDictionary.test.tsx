import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import MetadataDictionary from '@/components/dictionary/MetadataDictionary';
import type { MetadataBlock } from '@/lib/metadata';

const blocks: MetadataBlock[] = [
  {
    id: 'citation',
    name: 'Citation Metadata',
    description: 'Core information used to identify and cite a dataset.',
    fields: [
      {
        id: 'authorName',
        name: 'Author Name',
        definition: 'Person responsible for creating the dataset.',
        type: 'Text',
        required: true,
        repeatable: true,
        example: 'Ada Lovelace',
      },
      {
        id: 'authorIdentifier',
        name: 'Author Identifier',
        definition: 'A globally unique identifier for the named author, such as an ORCID iD.',
        type: 'Text',
        required: false,
        repeatable: true,
        example: 'https://orcid.org/0000-0002-1825-0097',
      },
      {
        id: 'authorIdentifierScheme',
        name: 'Author Identifier Scheme',
        definition: 'The system that issued or manages the author identifier.',
        type: 'Controlled Vocabulary',
        required: false,
        repeatable: true,
        example: 'ORCID',
      },
      {
        id: 'otherId',
        name: 'Other Identifier',
        definition: 'An identifier other than the repository primary identifier.',
        type: 'Text',
        required: false,
        repeatable: true,
        example: 'doi:10.1234/example',
      },
      {
        id: 'otherIdAgency',
        name: 'Other Identifier Agency',
        definition: 'The agency responsible for assigning the related identifier.',
        type: 'Text',
        required: false,
        repeatable: true,
        example: 'DataCite',
      },
    ],
  },
  {
    id: 'geospatial',
    name: 'Geospatial Metadata',
    description: 'Spatial coverage and geographic boundaries associated with a dataset.',
    fields: [
      {
        id: 'geographicCoverage',
        name: 'Geographic Coverage',
        definition: 'A named geographic area covered by the data.',
        type: 'Text',
        required: false,
        repeatable: true,
        example: 'Chesapeake Bay',
      },
      {
        id: 'westLongitude',
        name: 'Westernmost Longitude',
        definition: 'The westernmost longitude in decimal degrees.',
        type: 'Number',
        required: false,
        repeatable: false,
        example: '-77.5',
      },
    ],
  },
];

// Dedicated fixture for the required / best-practice facets: covers a required field, both
// best-practice tiers, and a field with no recommendation at all, spread across two blocks.
const facetBlocks: MetadataBlock[] = [
  {
    id: 'alpha',
    name: 'Alpha Block',
    description: 'Alpha block description.',
    fields: [
      {
        id: 'alphaRequired',
        name: 'Alpha Required',
        definition: 'A required field.',
        type: 'Text',
        required: true,
        repeatable: false,
        recommendation: 'Required',
      },
      {
        id: 'alphaRecommended',
        name: 'Alpha Recommended',
        definition: 'A recommended field.',
        type: 'Text',
        required: false,
        repeatable: false,
        recommendation: 'Recommended',
      },
      {
        id: 'alphaOptional',
        name: 'Alpha Optional',
        definition: 'An optional field.',
        type: 'Text',
        required: false,
        repeatable: false,
        recommendation: 'Optional',
      },
    ],
  },
  {
    id: 'beta',
    name: 'Beta Block',
    description: 'Beta block description.',
    fields: [
      {
        id: 'betaOptional',
        name: 'Beta Optional',
        definition: 'Another optional field.',
        type: 'Text',
        required: false,
        repeatable: false,
        recommendation: 'Optional',
      },
      {
        id: 'betaPlain',
        name: 'Beta Plain',
        definition: 'A field with no best-practice recommendation.',
        type: 'Text',
        required: false,
        repeatable: false,
      },
    ],
  },
];

describe('MetadataDictionary', () => {
  it('renders the full dictionary with an accessible search input and summary', () => {
    render(<MetadataDictionary blocks={blocks} />);

    expect(screen.getByLabelText('Search metadata fields')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('7 fields · 2 metadata blocks');
    expect(screen.getByRole('heading', { name: 'Citation Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Geospatial Metadata' })).toBeInTheDocument();
  });

  it('narrows Citation to only its matching fields and marks both authoritative Fuse matches', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);

    await user.type(screen.getByLabelText('Search metadata fields'), 'ORCID');

    expect(screen.getByRole('status')).toHaveTextContent('2 matching fields · 1 metadata block');
    const citation = screen.getByRole('region', { name: 'Citation Metadata' });
    expect(within(citation).getAllByRole('button', { name: /view details for/i })).toHaveLength(2);
    expect(within(citation).getAllByLabelText('Search match')).toHaveLength(2);
    expect(within(citation).queryByText('Author Name')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Geospatial Metadata' })).not.toBeInTheDocument();
  });

  it('restores source-order blocks after clearing a search', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);
    const input = screen.getByLabelText('Search metadata fields');

    await user.type(input, 'ORCID');
    await user.clear(input);

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Citation Metadata',
      'Geospatial Metadata',
    ]);
  });

  it('clears a no-results search and restores focus to the input', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);
    const input = screen.getByLabelText('Search metadata fields');

    await user.type(input, 'zzzz-no-field');

    expect(screen.getByRole('status')).toHaveTextContent('No metadata fields matched “zzzz-no-field”');
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    await user.click(clearButton);

    expect(screen.getByRole('status')).toHaveTextContent('7 fields · 2 metadata blocks');
    expect(input).toHaveFocus();
  });

  it('opens the selected field dialog and returns focus to its details button on Escape', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);
    const opener = screen.getByRole('button', { name: 'View details for Author Identifier' });

    await user.click(opener);

    expect(screen.getByRole('dialog', { name: 'Author Identifier' })).toHaveTextContent(
      'Citation Metadata › Author Identifier',
    );
    await user.keyboard('{Escape}');

    expect(opener).toHaveFocus();
  });

  it('filters to one block by clicking its facet chip, and toggles off on a second click', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);

    const chip = screen.getByRole('button', { name: 'Geospatial Metadata' });
    await user.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('2 fields · 1 metadata block');
    expect(screen.queryByRole('heading', { name: 'Citation Metadata' })).not.toBeInTheDocument();

    await user.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: 'Citation Metadata' })).toBeInTheDocument();
  });

  it('selects multiple facet chips at once', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);

    await user.click(screen.getByRole('button', { name: 'Citation Metadata' }));
    await user.click(screen.getByRole('button', { name: 'Geospatial Metadata' }));

    expect(screen.getByRole('status')).toHaveTextContent('7 fields · 2 metadata blocks');
    expect(screen.getByRole('heading', { name: 'Citation Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Geospatial Metadata' })).toBeInTheDocument();
  });

  it('combines the block facet with an active text search', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);

    await user.type(screen.getByLabelText('Search metadata fields'), 'ORCID');
    await user.click(screen.getByRole('button', { name: 'Geospatial Metadata' }));

    expect(screen.getByRole('status')).toHaveTextContent('No metadata fields matched “ORCID”');
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    await user.click(clearButton);

    expect(screen.getByRole('button', { name: 'Geospatial Metadata' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('7 fields · 2 metadata blocks');
  });

  it('filters to required fields only, and back off on a second click', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={facetBlocks} />);

    const chip = screen.getByRole('button', { name: 'Required' });
    await user.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('1 field · 1 metadata block');
    expect(screen.getByText('Alpha Required')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Recommended')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Beta Block' })).not.toBeInTheDocument();

    await user.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('5 fields · 2 metadata blocks');
  });

  it('filters by best-practice tier and combines with the block facet', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={facetBlocks} />);

    await user.click(screen.getByRole('button', { name: 'Optional' }));

    expect(screen.getByRole('status')).toHaveTextContent('2 fields · 2 metadata blocks');
    expect(screen.getByText('Alpha Optional')).toBeInTheDocument();
    expect(screen.getByText('Beta Optional')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Required')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Alpha Block' }));

    expect(screen.getByRole('status')).toHaveTextContent('1 field · 1 metadata block');
    expect(screen.queryByRole('heading', { name: 'Beta Block' })).not.toBeInTheDocument();
  });

  it('shows a filters-only empty state and clears it without touching an active search', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={facetBlocks} />);

    await user.click(screen.getByRole('button', { name: 'Required' }));
    await user.click(screen.getByRole('button', { name: 'Recommended' }));

    expect(screen.getByRole('status')).toHaveTextContent('No metadata fields match the selected filters');
    const clearButton = screen.getByRole('button', { name: 'Clear filters' });
    await user.click(clearButton);

    expect(screen.getByRole('status')).toHaveTextContent('5 fields · 2 metadata blocks');
    expect(screen.getByRole('button', { name: 'Required' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Recommended' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('restores focus to the explicit details-button opener after an unfocused click', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);
    const opener = screen.getByRole('button', { name: 'View details for Author Identifier' });

    expect(opener).not.toHaveFocus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Author Identifier' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(opener).toHaveFocus();
  });
});
