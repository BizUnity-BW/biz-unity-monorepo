import { useState } from 'react';

interface Props {
  url: string | null | undefined;
  initials: string;
  /** Tailwind size classes, e.g. 'h-8 w-8'. */
  sizeClass?: string;
  shape?: 'square' | 'circle';
  className?: string;
}

/**
 * Initials block with the image layered over it.
 *
 * The initials are always rendered underneath, so there is no loading state to manage
 * and no layout shift: while the image loads the initials show, and when it paints it
 * covers them. If the image 404s — a deleted object, or a URL that has gone stale —
 * `onError` drops it and the initials are already in place. No effect involved, which
 * keeps this clear of `react-hooks/set-state-in-effect`.
 */
export default function Avatar({
  url,
  initials,
  sizeClass = 'h-8 w-8',
  shape = 'square',
  className = '',
}: Props) {
  const [broken, setBroken] = useState(false);
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const showImage = Boolean(url) && !broken;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-amber-500/30 bg-amber-500/15 text-xs font-bold text-amber-400 ${sizeClass} ${radius} ${className}`}
    >
      <span aria-hidden={showImage}>{initials}</span>
      {showImage && (
        <img
          src={url as string}
          alt=""
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
