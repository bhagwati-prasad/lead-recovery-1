type Params = Promise<{ id: string }>;

export default async function FunnelEditorPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  return (
    <section className="placeholder-page">
      <h2>Funnel Editor</h2>
      <p>Funnel ID: {id}</p>
      <p className="placeholder-note">Migrated route scaffold for legacy #/funnels/:id/editor.</p>
    </section>
  );
}
