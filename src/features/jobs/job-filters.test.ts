import { describe, expect, it } from 'vitest';

import { createJobsFilters } from './job-filters';

describe('createJobsFilters', () => {
  it('keeps the explicit remote default and valid filters', () => {
    expect(
      createJobsFilters({
        search: '  react  ',
        workMode: 'remote',
        employmentType: 'full_time',
        minimumSalary: '1200.50',
        salaryCurrency: 'USD',
        limit: 50,
        offset: 100,
      }),
    ).toEqual({
      q: 'react',
      work_mode: 'remote',
      employment_type: 'full_time',
      min_salary: 1200.5,
      salary_currency: 'USD',
      limit: 50,
      offset: 100,
    });
  });

  it('omits values that would violate API constraints', () => {
    expect(
      createJobsFilters({
        search: 'r',
        workMode: 'hybrid',
        employmentType: 'x',
        minimumSalary: '-1',
        salaryCurrency: 'EUR',
        limit: 50,
        offset: 0,
      }),
    ).toEqual({
      work_mode: 'hybrid',
      limit: 50,
      offset: 0,
    });
  });

  it('sends the selected currency with a valid monthly salary threshold', () => {
    expect(
      createJobsFilters({
        search: '',
        workMode: 'remote',
        employmentType: '',
        minimumSalary: '50000',
        salaryCurrency: 'UAH',
        limit: 50,
        offset: 0,
      }),
    ).toEqual({
      work_mode: 'remote',
      min_salary: 50000,
      salary_currency: 'UAH',
      limit: 50,
      offset: 0,
    });
  });
});
