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
    groups: [
      {
        id: 'author',
        name: 'Author',
        fields: [
          {
            id: 'authorName',
            name: 'Name',
            summary: 'Person responsible for creating the dataset.',
            description: 'The full name of a credited person or organization.',
            type: 'Text',
            required: true,
            repeatable: true,
            example: 'Ada Lovelace',
            aliases: ['creator'],
          },
          {
            id: 'authorIdentifier',
            name: 'Identifier',
            summary: 'Persistent identifier associated with the author.',
            description: 'A globally unique identifier for the named author, such as an ORCID iD.',
            type: 'Text',
            required: false,
            repeatable: true,
            example: 'https://orcid.org/0000-0002-1825-0097',
            aliases: ['ORCID'],
          },
          {
            id: 'authorIdentifierScheme',
            name: 'Identifier Scheme',
            summary: 'Scheme used for the author identifier.',
            description: 'The system that issued or manages the author identifier.',
            type: 'Controlled Vocabulary',
            required: false,
            repeatable: true,
            example: 'ORCID',
            aliases: ['identifier type'],
          },
        ],
      },
      {
        id: 'otherIdentifier',
        name: 'Other Identifier',
        fields: [
          {
            id: 'otherId',
            name: 'Other Identifier',
            summary: 'Identifier assigned to the dataset by another system.',
            description: 'An identifier other than the repository primary identifier.',
            type: 'Text',
            required: false,
            repeatable: true,
            example: 'doi:10.1234/example',
            aliases: ['alternate identifier'],
          },
          {
            id: 'otherIdAgency',
            name: 'Other Identifier Agency',
            summary: 'Organization that issued the other identifier.',
            description: 'The agency responsible for assigning the related identifier.',
            type: 'Text',
            required: false,
            repeatable: true,
            example: 'DataCite',
            aliases: ['issuing agency'],
          },
        ],
      },
    ],
  },
  {
    id: 'geospatial',
    name: 'Geospatial Metadata',
    description: 'Spatial coverage and geographic boundaries associated with a dataset.',
    groups: [
      {
        id: 'geographicCoverage',
        name: 'Geographic Coverage',
        fields: [
          {
            id: 'geographicCoverage',
            name: 'Geographic Coverage',
            summary: 'Place or region represented by the dataset.',
            description: 'A named geographic area covered by the data.',
            type: 'Text',
            required: false,
            repeatable: true,
            example: 'Chesapeake Bay',
            aliases: ['location'],
          },
          {
            id: 'westLongitude',
            name: 'Westernmost Longitude',
            summary: 'Western edge of the dataset bounding box.',
            description: 'The westernmost longitude in decimal degrees.',
            type: 'Number',
            required: false,
            repeatable: false,
            example: '-77.5',
            aliases: ['west bound'],
          },
        ],
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

  it('keeps every Citation field visible and marks both authoritative Fuse matches', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);

    await user.type(screen.getByLabelText('Search metadata fields'), 'ORCID');

    expect(screen.getByRole('status')).toHaveTextContent('2 matching fields · 1 metadata block');
    const citation = screen.getByRole('region', { name: 'Citation Metadata' });
    expect(within(citation).getAllByRole('button', { name: /view details for/i })).toHaveLength(5);
    expect(within(citation).getAllByLabelText('Search match')).toHaveLength(2);
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
    const opener = screen.getByRole('button', { name: 'View details for Identifier' });

    await user.click(opener);

    expect(screen.getByRole('dialog', { name: 'Identifier' })).toHaveTextContent(
      'Citation Metadata › Author › Identifier',
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

  it('restores focus to the explicit details-button opener after an unfocused click', async () => {
    const user = userEvent.setup();
    render(<MetadataDictionary blocks={blocks} />);
    const opener = screen.getByRole('button', { name: 'View details for Identifier' });

    expect(opener).not.toHaveFocus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Identifier' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(opener).toHaveFocus();
  });
});
