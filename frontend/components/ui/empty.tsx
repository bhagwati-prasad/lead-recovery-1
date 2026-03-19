type EmptyProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function Empty({
  title = "Nothing here yet",
  description,
  action,
  className = "",
}: EmptyProps) {
  return (
    <div className={`empty-state ${className}`.trim()} role="status">
      <p className="empty-title">{title}</p>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
