type Params = Promise<{ id: string }>;

export default async function CustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  return (
    <section className="placeholder-page">
      <h2>Customer Detail</h2>
      <p>Customer ID: {id}</p>
      <p className="placeholder-note">Migrated route scaffold for legacy #/customers/:id.</p>
    </section>
  );
}
