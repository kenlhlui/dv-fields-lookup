import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FieldDetailsDialog, type SelectedField } from '@/components/dictionary/FieldDetailsDialog';

const field = {
  id: 'authorIdentifier',
  name: 'Identifier',
  summary: 'Persistent identifier associated with the author.',
  description:
    'A globally unique identifier for the named author, such as an ORCID iD. Use the corresponding scheme in Identifier Scheme.',
  type: 'Text',
  required: false,
  repeatable: true,
  example: 'https://orcid.org/0000-0002-1825-0097',
  aliases: ['ORCID', 'researcher ID'],
} satisfies SelectedField['field'];

const group = {
  id: 'author',
  name: 'Author',
  fields: [field],
} satisfies SelectedField['group'];

const block = {
  id: 'citation',
  name: 'Citation Metadata',
  description: 'Core information used to identify, describe, and cite a dataset.',
  groups: [group],
} satisfies SelectedField['block'];

const selected: SelectedField = { block, group, field };

describe('FieldDetailsDialog', () => {
  it('exposes complete field metadata and hierarchy in an accessible dialog', () => {
    render(<FieldDetailsDialog selected={selected} onOpenChange={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Identifier' });
    expect(dialog).toHaveTextContent(
      'A globally unique identifier for the named author, such as an ORCID iD. Use the corresponding scheme in Identifier Scheme.',
    );
    expect(dialog).toHaveTextContent('authorIdentifier');
    expect(dialog).toHaveTextContent('Text');
    expect(dialog).toHaveTextContent('No');
    expect(dialog).toHaveTextContent('Yes');
    expect(dialog).toHaveTextContent('https://orcid.org/0000-0002-1825-0097');
    expect(dialog).toHaveTextContent('ORCID');
    expect(dialog).toHaveTextContent('Citation Metadata › Author › Identifier');
  });

  it('reports dismissal when Escape closes the controlled dialog', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FieldDetailsDialog selected={selected} onOpenChange={onOpenChange} />);

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders no dialog when no field is selected', () => {
    render(<FieldDetailsDialog selected={null} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
