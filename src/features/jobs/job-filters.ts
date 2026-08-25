import type { JobsFilters, WorkMode } from '../../api';

interface JobFilterValues {
  search: string;
  workMode: WorkMode;
  employmentType: string;
  minimumSalary: string;
  limit: number;
  offset: number;
}

export function createJobsFilters(values: JobFilterValues): JobsFilters {
  const search = values.search.trim();
  const employmentType = values.employmentType.trim();
  const parsedSalary = Number(values.minimumSalary);

  return {
    work_mode: values.workMode,
    limit: values.limit,
    offset: values.offset,
    ...(search.length >= 2 ? { q: search } : {}),
    ...(employmentType.length >= 2
      ? { employment_type: employmentType }
      : {}),
    ...(values.minimumSalary !== '' &&
    Number.isFinite(parsedSalary) &&
    parsedSalary >= 0
      ? { min_salary: parsedSalary }
      : {}),
  };
}
