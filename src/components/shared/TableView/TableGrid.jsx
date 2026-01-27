"use client";
import { useMemo } from "react";
import TableCard from "./TableCard";
import { FaLayerGroup } from "react-icons/fa";
export default function TableGrid({
  tables,
  sessions,
  onTableClick,
  isTransferMode,
  sourceTableId,
  loadingTransfer,
  role = "waiter", // 'waiter' | 'cashier'
  sortingMode = "numeric", // 'numeric' | 'priority'
}) {
  const sortedTables = useMemo(() => {
    // Clone tables to avoid mutating the original array
    const sorted = [...tables];

    if (sortingMode === "priority") {
      sorted.sort((a, b) => {
        const sessionA = sessions.find((s) => s.table_id === a.id);
        const sessionB = sessions.find((s) => s.table_id === b.id);

        // Helper to calculate priority score (Higher score = Higher priority)
        const getPriority = (session) => {
          if (!session) return 0; // Empty

          const items = session.order_items || [];
          const requests = session.service_requests || [];

          // 1. Service Requests (Highest)
          const hasRequest = requests.some((r) => r.status === "pending");
          if (hasRequest) {
              // Refine priority based on Role
              if (role === 'cashier') {
                  const hasBill = requests.some(r => r.status === 'pending' && r.request_type === 'bill');
                  // Cashier cares most about MONEY (Bill Requests)
                  if (hasBill) return 5; 
                  return 1; // General calls are less important for cashier? Or maybe still high?
                            // Let's keep them high but below bill.
              } else {
                   // Waiter cares about ALL requests high
                   return 5;
              }
          }

          // 2. Pending Orders (New items to confirm)
          const hasPending = items.some((i) => i.status === "pending");
          if (hasPending) return 4; 

          // 3. Ready/Serving (Chef finished)
          // const hasServed = items.some((i) => i.status === "served"); // "served" here means Chef said "Pick up"
          // if (hasServed) return 3; 

          // 4. Occupied (Active)
          return 2; 
        };

        const priorityA = getPriority(sessionA);
        const priorityB = getPriority(sessionB);

        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Descending order of priority
        }

        // Tie-breaker: Table Number
        const numA = parseInt(a.table_number.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.table_number.replace(/\D/g, '')) || 0;
        
        if (numA !== numB) return numA - numB;
        return a.table_number.localeCompare(b.table_number);
      });
    } else {
        // NUMERIC SORT (Default/Fallback)
        sorted.sort((a, b) => {
            const numA = parseInt(a.table_number.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.table_number.replace(/\D/g, '')) || 0;
            
            if (numA !== numB) return numA - numB;
            return a.table_number.localeCompare(b.table_number);
        });
    }

    return sorted;
  }, [tables, sessions, sortingMode, role]);

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <FaLayerGroup className="text-4xl mb-4 text-gray-600" />
        <p className="text-gray-500">No tables found.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 ${loadingTransfer ? 'opacity-50 pointer-events-none' : ''}`}>
      {sortedTables.map((table) => {
        const activeSession = sessions.find((s) => s.table_id === table.id);
        return (
          <TableCard
            key={table.id}
            table={table}
            session={activeSession}
            onClick={onTableClick}
            isTransferMode={isTransferMode}
            isSource={sourceTableId === table.id}
            role={role}
          />
        );
      })}
    </div>
  );
}
