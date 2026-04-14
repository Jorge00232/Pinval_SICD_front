import { useContext } from 'react';
import { InventoryContext } from './inventoryStore';

export function useInventory() {
  const context = useContext(InventoryContext);

  if (!context) {
    throw new Error('useInventory must be used inside InventoryProvider');
  }

  return context;
}
