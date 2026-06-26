import { useState, useEffect, useRef, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { fetchProductionLedger } from '../../productionLedger/services/productionLedger.service';
import { fetchCostLedger } from '../../costLedger/services/costLedger.service';
import { fetchFinishedGoods } from '../../finishedGoods/services/finishedGoods.service';
import { fetchInventory, fetchMaterialReceipts } from '../../warehouse/services/warehouse.service';
import { fetchDispatches } from '../../dispatch/services/dispatch.service';
import { fetchQualityControlEntries } from '../../qualityControl/services/qualityControl.service';
import type { ProductionLedgerEntry } from '../../productionLedger/types/productionLedger.types';
import type { CostLedgerEntry } from '../../costLedger/types/costLedger.types';
import type { FinishedGoodEntry } from '../../finishedGoods/types/finishedGoods.types';
import type { InventoryItem, MaterialReceipt } from '../../warehouse/types/warehouse.types';
import type { DispatchEntry } from '../../dispatch/types/dispatch.types';
import type { QualityControlEntry } from '../../qualityControl/types/qualityControl.types';

export interface DashboardRawData {
  productionEntries: ProductionLedgerEntry[];
  costEntries: CostLedgerEntry[];
  finishedGoods: FinishedGoodEntry[];
  inventoryItems: InventoryItem[];
  materialReceipts: MaterialReceipt[];
  dispatches: DispatchEntry[];
  qcEntries: QualityControlEntry[];
}

const EMPTY_DATA: DashboardRawData = {
  productionEntries: [],
  costEntries: [],
  finishedGoods: [],
  inventoryItems: [],
  materialReceipts: [],
  dispatches: [],
  qcEntries: [],
};

const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardRawData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [
        productionEntries,
        costEntries,
        finishedGoods,
        inventoryItems,
        materialReceipts,
        dispatches,
        qcEntries,
      ] = await Promise.all([
        fetchProductionLedger(),
        fetchCostLedger(),
        fetchFinishedGoods(),
        fetchInventory(),
        fetchMaterialReceipts(),
        fetchDispatches(),
        fetchQualityControlEntries(),
      ]);
      setData({ productionEntries, costEntries, finishedGoods, inventoryItems, materialReceipts, dispatches, qcEntries });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(false);
    intervalRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return { data, loading, lastRefreshed, refresh: () => fetchAll(false) };
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
export const tsToDate = (ts: Timestamp | null | undefined): Date | null => {
  if (!ts) return null;
  try { return ts.toDate(); } catch { return null; }
};
