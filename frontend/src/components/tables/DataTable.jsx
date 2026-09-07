const DataTable = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300">
      <table className="w-full text-left text-sm">
        <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-dark-300 hover:bg-dark-300/50 transition">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-2 text-white">
                  {col.render ? col.render(row) : row[col.key] ?? 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;