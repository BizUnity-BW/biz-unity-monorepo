import { Shimmer } from '@shimmer-from-structure/react';

/**
 * Skeleton loader that mirrors whatever it wraps.
 *
 * `@shimmer-from-structure/react` measures the real rendered children and paints
 * shimmer blocks over their boxes, so the children must still be rendered with
 * placeholder data while loading — pass a fully-shaped stand-in object, not null.
 *
 * Two things the library does not do that we handle here:
 *  - it hides the children with `opacity: 0` but leaves them clickable and
 *    tabbable, so `inert` is applied while loading (React 19 supports it natively)
 *  - it has no notion of our theme, so the colours come from the `--color-shimmer-*`
 *    tokens in `index.css`, which are defined per theme
 */
export default function SkeletonShimmer({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div inert={loading} aria-busy={loading}>
      <Shimmer
        loading={loading}
        backgroundColor="var(--color-shimmer-base)"
        shimmerColor="var(--color-shimmer-sweep)"
        fallbackBorderRadius={6}
      >
        {children}
      </Shimmer>
    </div>
  );
}
