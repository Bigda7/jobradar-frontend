import type { SVGProps } from 'react';

export function BrandMark({ className }: Pick<SVGProps<SVGSVGElement>, 'className'>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="80 80 352 352"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="256"
        cy="256"
        r="148"
        fill="none"
        stroke="currentColor"
        strokeWidth="30"
      />
      <circle
        cx="256"
        cy="256"
        r="76"
        fill="none"
        stroke="currentColor"
        strokeWidth="26"
      />
      <path
        d="M256 256 382 130"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="34"
      />
      <circle cx="256" cy="256" r="29" fill="currentColor" />
    </svg>
  );
}
