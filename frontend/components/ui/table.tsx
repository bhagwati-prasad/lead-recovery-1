export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  emptyText?: string;
  caption?: string;
  className?: string;
};

export function Table<T>({
  columns,
  data,
  getRowKey,
  emptyText = "No items to display.",
  caption,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`table-wrapper ${className}`.trim()} role="region" tabIndex={0}>
      <table className="table">
        {caption && <caption className="table-caption">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`table-th ${col.headerClassName ?? ""}`.trim()}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)} className="table-row">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`table-td ${col.cellClassName ?? ""}`.trim()}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
