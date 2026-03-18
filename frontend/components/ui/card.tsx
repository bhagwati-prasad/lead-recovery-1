type CardProps = {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  as?: "article" | "section" | "div";
};

export function Card({
  children,
  title,
  actions,
  className = "",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </Tag>
  );
}
