import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { ThemeContext } from '../../theme-context';
import { LegalPage } from './legal-page';

describe('LegalPage', () => {
  it('describes the current privacy scope and remains reachable through navigation', () => {
    const queryClient = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider
          value={{ theme: 'dark', setTheme: vi.fn() }}
        >
          <MemoryRouter initialEntries={['/legal']}>
            <LegalPage />
          </MemoryRouter>
        </ThemeContext.Provider>
      </QueryClientProvider>,
    );

    expect(html).toContain('Privacy &amp; legal');
    expect(html).toContain('does not provide user accounts, payments');
    expect(html).toContain('stored in localStorage');
    expect(html).toContain('is not sent to the JobRadar backend');
    expect(html).toContain('does not use advertising cookies');
    expect(html).toContain('href="/legal"');
    expect(html).toContain('id="main-content"');
  });
});
