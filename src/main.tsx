import './zod-config';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { App } from './App';
import { AppErrorBoundary } from './components/app-error-boundary';
import { queryClient } from './query-client';
import { ThemeProvider } from './theme-provider';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
