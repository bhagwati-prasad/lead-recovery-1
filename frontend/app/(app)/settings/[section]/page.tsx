type Params = Promise<{ section: string }>;

export default async function SettingsSectionPage({
  params,
}: {
  params: Params;
}) {
  const { section } = await params;

  return (
    <section className="placeholder-page">
      <h2>Settings</h2>
      <p>Section: {section}</p>
      <p className="placeholder-note">Migrated route scaffold for legacy #/settings/:section.</p>
    </section>
  );
}
