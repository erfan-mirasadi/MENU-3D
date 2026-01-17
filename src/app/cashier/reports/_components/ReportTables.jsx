import React from "react";

const TableWrapper = ({ headers, children }) => (
    <div className="bg-[#1F1D2B] rounded-lg p-6 w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
                <tr className="text-[#ABBBC2] text-sm border-b border-[#393C49]">
                    {headers.map((h, i) => (
                        <th key={i} className={`py-4 font-semibold ${i===0?'pl-4':''}`}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="text-neutral-300 font-medium text-sm">
                {children}
            </tbody>
        </table>
    </div>
);

const EmptyRow = ({ colSpan, message }) => (
    <tr>
        <td colSpan={colSpan} className="py-8 text-center text-[#ABBBC2]">{message || "No data available."}</td>
    </tr>
);

export const FinancialTable = ({ data, loading }) => {
    if (loading) return <div className="text-white p-4">Loading...</div>;
    if (!data?.length) return <TableWrapper headers={["Time", "Bill ID", "Table", "Amount", "Method", "Staff"]}><EmptyRow colSpan={6} /></TableWrapper>;

    return (
        <TableWrapper headers={["Time", "Bill ID", "Table", "Amount", "Method", "Staff"]}>
            {data.map(t => (
                <tr key={t.id} className="border-b border-[#393C49] hover:bg-[#252836]/50 transition-colors">
                    <td className="py-4 pl-4">{t.time}</td>
                    <td className="py-4">{t.billId}</td>
                    <td className="py-4">{t.tableNo}</td>
                    <td className="py-4 font-bold text-white">₺{parseFloat(t.amount || 0).toFixed(2)}</td>
                    <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs ${t.method?.toLowerCase().includes('cash') ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {t.method}
                        </span>
                    </td>
                    <td className="py-4">{t.staff}</td>
                </tr>
            ))}
        </TableWrapper>
    );
};

export const ProductMixTable = ({ data, loading }) => {
    if (loading) return <div className="text-white p-4">Loading...</div>;
    if (!data?.length) return <TableWrapper headers={["Product Name", "Quantity Sold", "Total Revenue"]}><EmptyRow colSpan={3} /></TableWrapper>;

    return (
        <TableWrapper headers={["Product Name", "Quantity Sold", "Total Revenue"]}>
            {data.map((item, idx) => (
                <tr key={idx} className="border-b border-[#393C49] hover:bg-[#252836]/50 transition-colors">
                    <td className="py-4 pl-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                            {idx + 1}
                        </div>
                        {item.name}
                    </td>
                    <td className="py-4">{item.quantity}</td>
                    <td className="py-4 font-bold text-[#EA7C69]">₺{item.revenue.toFixed(2)}</td>
                </tr>
            ))}
        </TableWrapper>
    );
};

export const SecurityLogTable = ({ data, loading }) => {
    if (loading) return <div className="text-white p-4">Loading...</div>;
    if (!data?.length) return <TableWrapper headers={["Time", "Staff", "Action", "Item / Details", "Reason", "Value"]}><EmptyRow colSpan={6} /></TableWrapper>;

    return (
        <TableWrapper headers={["Time", "Staff", "Action", "Item / Details", "Reason", "Value"]}>
            {data.map((log, idx) => (
                <tr key={idx} className="border-b border-[#393C49] hover:bg-[#252836]/50 transition-colors">
                    <td className="py-4 pl-4 text-xs text-[#ABBBC2]">{log.time}</td>
                    <td className="py-4">{log.staff}</td>
                    <td className="py-4">
                        <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-500 font-bold">{log.action}</span>
                    </td>
                    <td className="py-4">{log.item}</td>
                    <td className="py-4 text-[#ABBBC2] italic">"{log.reason}"</td>
                    <td className="py-4 text-white">₺{parseFloat(log.value).toFixed(2)}</td>
                </tr>
            ))}
        </TableWrapper>
    );
};
