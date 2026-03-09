import toast from "react-hot-toast";
import { updateOrderItem, deleteOrderItem } from "@/services/staffService";

export const useCartOperations = ({
  draftItems, setDraftItems,
  sessionItems, setSessionItems,
  setConfirmedEdits,
  setItemToVoid,
  setIsVoidModalOpen,
  t
}) => {
  const handleMenuAdd = async (product) => {
    const existingDraft = draftItems.find(i => i.product_id === product.id);

    if (existingDraft) {
        setDraftItems(prev => prev.map(i => 
            i.id === existingDraft.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
        return; 
    }

    const newItem = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product, 
        product_id: product.id,
        quantity: 1, 
        unit_price_at_order: product.price,
        status: 'pending', 
        created_at: new Date().toISOString(),
        isDraft: true 
    };

    setDraftItems(prev => [...prev, newItem]);
    toast.success(t('addedToOrder'), { icon: '📝', duration: 1000 });
  };

  const handleMenuRemove = async (product) => {
      const draftItem = draftItems.find(i => i.product_id === product.id);

      if (draftItem) {
          if (draftItem.quantity > 1) {
              setDraftItems(prev => prev.map(i => i.id === draftItem.id ? {...i, quantity: i.quantity - 1} : i));
          } else {
              setDraftItems(prev => prev.filter(i => i.id !== draftItem.id));
          }
          return;
      }

      const sessionItem = sessionItems.find(i => 
        (i.product_id === product.id || i.product?.id === product.id) && 
        ['pending', 'confirmed', 'preparing', 'served'].includes(i.status)
      );

      if (!sessionItem) return;

      if (sessionItem.status === 'pending') {
          if (sessionItem.quantity > 1) {
             try { 
                 await updateOrderItem(sessionItem.id, { quantity: sessionItem.quantity - 1 });
                 setSessionItems(prev => prev.map(i => i.id === sessionItem.id ? {...i, quantity: i.quantity - 1} : i));
             } catch(e) { toast.error("Failed to update"); }
          } else {
             try {
                 await deleteOrderItem(sessionItem.id);
                 setSessionItems(prev => prev.filter(i => i.id !== sessionItem.id));
             } catch(e) { toast.error("Failed to delete"); }
          }
      } else {
          setItemToVoid(sessionItem);
          setIsVoidModalOpen(true);
      }
  };

  const onDeleteItem = async (itemId) => {
      const isDraft = draftItems.some(i => i.id === itemId);
      if (isDraft) {
          setDraftItems(prev => prev.filter(i => i.id !== itemId));
          return;
      }

      const item = sessionItems.find(i => i.id === itemId);
      if (!item) return;

      if (item.status === 'pending') {
          setSessionItems(prev => prev.filter(i => i.id !== itemId));
          try { await deleteOrderItem(itemId); toast.success(t('removedFromOrder')); } catch(e){}
      } else {
          setItemToVoid(item);
          setIsVoidModalOpen(true);
      }
  };

  const onUpdateQty = async (itemId, newQty) => {
      const isDraft = draftItems.some(i => i.id === itemId);
      if (isDraft) {
          if (newQty < 1) {
              setDraftItems(prev => prev.filter(i => i.id !== itemId));
          } else {
              setDraftItems(prev => prev.map(i => i.id === itemId ? {...i, quantity: newQty} : i));
          }
          return;
      }

      const isEditableInGroup = sessionItems.some(i => i.id === itemId && (i.status === 'confirmed' || i.status === 'pending'));
      if (isEditableInGroup) {
          if (newQty < 1) {
             onDeleteItem(itemId);
             setConfirmedEdits(prev => {
                 const next = { ...prev };
                 delete next[itemId];
                 return next;
             });
          } else {
             setConfirmedEdits(prev => ({ ...prev, [itemId]: newQty }));
          }
          return;
      }

      if(newQty < 1) return; 
      try { await updateOrderItem(itemId, { quantity: newQty }); } catch(e){}
  };

  return {
      handleMenuAdd,
      handleMenuRemove,
      onDeleteItem,
      onUpdateQty
  };
};
