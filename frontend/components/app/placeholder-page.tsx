export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="placeholder-page">
      <h2>{title}</h2>
      <p>{description}</p>
      <p className="placeholder-note">Migration status: scaffolded route, feature logic pending.</p>
    </section>
  );
}
