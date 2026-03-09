import toast from "react-hot-toast";
import { voidOrderItem, updateOrderItemSecurely } from "@/services/orderService";

export const useGroupedItemEdits = ({
  sessionItems,
  localItems,
  groupedItems,
  isEditingGroup,
  setGroupedItems,
  setIsEditingGroup,
  setItemToVoid,
  setIsVoidModalOpen,
  setLoadingOp,
  t
}) => {

  const handleStartGroupEdit = (scope) => {
      let relevantStatus = [];
      if (scope === 'served') relevantStatus = ['served'];
      else if (scope === 'kitchen') relevantStatus = ['preparing', 'ready'];
      else if (scope === 'confirmed') relevantStatus = ['confirmed'];
      else return; 
      
      const active = localItems.filter(i => relevantStatus.includes(i.status)); 
      
      const groupedItemsArray = Object.values(active.reduce((acc, item) => {
        const key = item.product_id || item.product?.id;
        if (!acc[key]) {
            acc[key] = { 
                ...item, 
                quantity: 0, 
                ids: [], 
                virtualId: `group-edit-${key}` 
            };
        }
        acc[key].quantity += item.quantity;
        acc[key].ids.push(item.id);
        return acc;
      }, {}));

      setGroupedItems(groupedItemsArray);
      setIsEditingGroup(scope);
  };

  const handleCancelGroupEdit = () => {
    setIsEditingGroup(null);
    setGroupedItems([]);
  };

  const executeGroupUpdate = async (voidReason) => {
    setLoadingOp('GROUPED_UPDATE');
    try {
        let relevantStatus = [];
        if (isEditingGroup === 'served') relevantStatus = ['served'];
        else if (isEditingGroup === 'kitchen') relevantStatus = ['preparing', 'ready'];
        else if (isEditingGroup === 'confirmed') relevantStatus = ['confirmed'];

        const originalActive = sessionItems.filter(i => relevantStatus.includes(i.status));
        const updates = [];
        
        for (const groupedItem of groupedItems) {
             const originalRows = originalActive.filter(o => (o.product_id || o.product?.id) === (groupedItem.product_id || groupedItem.product?.id));
             const currentTotal = originalRows.reduce((sum, i) => sum + i.quantity, 0);
             const targetTotal = groupedItem.quantity;

             if (targetTotal === currentTotal) continue; 

             if (targetTotal < currentTotal) {
                 let amountToRemove = currentTotal - targetTotal;
                 originalRows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

                 for (const row of originalRows) {
                     if (amountToRemove <= 0) break;
                     
                     if (row.quantity <= amountToRemove) {
                         updates.push(voidOrderItem(row.id, voidReason || "Group Edit Removed"));
                         amountToRemove -= row.quantity;
                     } else {
                         const newRowQty = row.quantity - amountToRemove;
                         updates.push(updateOrderItemSecurely(row.id, newRowQty, row.quantity, voidReason || "Group Update"));
                         amountToRemove = 0;
                     }
                 }
             } 
        }

        const groupedProductIds = groupedItems.map(b => b.product_id || b.product?.id);
        const productsToRemove = [...new Set(originalActive
              .map(o => o.product_id || o.product?.id)
              .filter(pid => !groupedProductIds.includes(pid))
        )];
        
        for (const pid of productsToRemove) {
             const rows = originalActive.filter(o => (o.product_id || o.product?.id) === pid);
             for (const r of rows) {
                 updates.push(voidOrderItem(r.id, voidReason || "Group Edit Removed"));
             }
        }

        await Promise.all(updates);
        toast.success(t('orderUpdated'));
    } catch (e) {
        toast.error(t('failedToUpdate') + ": " + e.message);
    } finally {
        setLoadingOp(null);
        setIsEditingGroup(null);
        setIsVoidModalOpen(false);
        setItemToVoid(null);
    }
  };

  const handleSaveGroupEdit = () => {
    let relevantStatus = [];
    if (isEditingGroup === 'served') relevantStatus = ['served'];
    else if (isEditingGroup === 'kitchen') relevantStatus = ['preparing', 'ready'];
    else if (isEditingGroup === 'confirmed') relevantStatus = ['confirmed'];
    
    const originalActive = sessionItems.filter(i => relevantStatus.includes(i.status));
  
    let needsVoid = false;

    for (const groupedItem of groupedItems) {
        const originalTotal = originalActive
            .filter(o => (o.product_id || o.product?.id) === (groupedItem.product_id || groupedItem.product?.id))
            .reduce((sum, i) => sum + i.quantity, 0);
        
        if (groupedItem.quantity < originalTotal) {
            needsVoid = true;
            break;
        }
    }

    const groupedProductIds = groupedItems.map(b => b.product_id || b.product?.id);
    const originalProductIds = [...new Set(originalActive.map(o => o.product_id || o.product?.id))];
    
    if (originalProductIds.some(pid => !groupedProductIds.includes(pid))) {
        needsVoid = true;
    }

    if (needsVoid) {
        setItemToVoid({ actionType: 'GROUPED_SAVE' });
        setIsVoidModalOpen(true);
    } else {
        executeGroupUpdate(null);
    }
  };

  return {
    handleStartGroupEdit,
    handleCancelGroupEdit,
    handleSaveGroupEdit,
    executeGroupUpdate
  };
};
