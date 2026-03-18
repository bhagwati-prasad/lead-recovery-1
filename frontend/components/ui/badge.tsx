type Variant = "default" | "success" | "warning" | "danger" | "info";

const VARIANT: Record<Variant, string> = {
  default: "badge-default",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`badge ${VARIANT[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}
