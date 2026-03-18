type SpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function Spinner({ label = "Loading…", size = "md" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`spinner spinner-${size}`}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

type SkeletonProps = {
  lines?: number;
  className?: string;
};

export function Skeleton({ lines = 3, className = "" }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className={`skeleton-block ${className}`.trim()}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

type PageLoadingProps = {
  message?: string;
};

export function PageLoading({ message = "Loading…" }: PageLoadingProps) {
  return (
    <div className="page-loading" role="status">
      <Spinner size="lg" />
      <p className="page-loading-text">{message}</p>
    </div>
  );
}
