type ErrorDisplayProps = {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
};

export function ErrorDisplay({
  title = "Something went wrong",
  message,
  retry,
  className = "",
}: ErrorDisplayProps) {
  return (
    <div className={`error-display ${className}`.trim()} role="alert">
      <p className="error-title">{title}</p>
      <p className="error-message">{message}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="btn btn-secondary btn-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}
