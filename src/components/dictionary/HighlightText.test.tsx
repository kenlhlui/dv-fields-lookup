import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HighlightText } from '@/components/dictionary/HighlightText';

describe('HighlightText', () => {
  it('renders merged ranges with mark elements and preserves all text', () => {
    const { container } = render(<HighlightText text="Author Identifier" ranges={[[0, 5], [7, 16]]} />);

    expect(container).toHaveTextContent('Author Identifier');
    expect(screen.getAllByText(/Author|Identifier/).every((node) => node.tagName === 'MARK')).toBe(true);
  });

  it('renders source text rather than interpreting markup', () => {
    const { container } = render(<HighlightText text={'<img src=x onerror=alert(1)>'} ranges={[[1, 3]]} />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
  });
});
