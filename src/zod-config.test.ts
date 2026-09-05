import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import './zod-config';

describe('Zod runtime configuration', () => {
  it('disables JIT compilation for strict CSP compatibility', () => {
    expect(z.config().jitless).toBe(true);
  });
});
