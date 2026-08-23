/**
 * Hand-rolled Heroicons-style glyphs.
 *
 * There is no icon library in this project and none is being added. These are the
 * icons the document feature needs, gathered in one module rather than inlined at
 * each of the ~8 call sites. Exports components only, so
 * `react-refresh/only-export-components` stays quiet.
 */
interface IconProps {
  className?: string;
}

const SVG = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' } as const;
const CAP = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function IconDocument({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

export function IconPhoto({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

export function IconUpload({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
      />
    </svg>
  );
}

export function IconTrash({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

export function IconDownload({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

export function IconPaperclip({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
      />
    </svg>
  );
}

export function IconWarning({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={1.75}>
      <path
        {...CAP}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

export function IconCheck({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} {...SVG} strokeWidth={2}>
      <path {...CAP} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
