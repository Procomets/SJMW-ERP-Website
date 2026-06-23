"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCostDeleted = exports.onCostUpdated = exports.onCostCreated = exports.onProductionDeleted = exports.onProductionUpdated = exports.onProductionCreated = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// ─── Collection names ────────────────────────────────────────────────────────
const PRODUCTION_COL = 'productionLedger';
const COST_COL = 'costLedger';
const FG_COL = 'finishedGoods';
// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getFGDocByHeat(heatNo) {
    var _a;
    const snap = await db
        .collection(FG_COL)
        .where('heatNo', '==', heatNo)
        .limit(1)
        .get();
    return (_a = snap.docs[0]) !== null && _a !== void 0 ? _a : null;
}
async function getProdDocByHeat(heatNo) {
    var _a;
    const snap = await db
        .collection(PRODUCTION_COL)
        .where('heatNo', '==', heatNo)
        .limit(1)
        .get();
    return (_a = snap.docs[0]) !== null && _a !== void 0 ? _a : null;
}
async function getCostDocByHeat(heatNo) {
    var _a;
    const snap = await db
        .collection(COST_COL)
        .where('heatNo', '==', heatNo)
        .limit(1)
        .get();
    return (_a = snap.docs[0]) !== null && _a !== void 0 ? _a : null;
}
// ══════════════════════════════════════════════════════════════════════════════
// SYNC PRODUCTION FIELDS → FINISHED GOODS
//
// Only writes production-derived fields.
// NEVER touches: dispatchedWeightKg, status, productionCostPerKg,
//                estimatedSellingPrice, costLedgerId
// ══════════════════════════════════════════════════════════════════════════════
async function syncProductionFields(heatNo, oldHeatNo) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    // ── Sync the current (new) heat ──────────────────────────────────────────
    if (heatNo) {
        const h = heatNo.trim();
        const prodDoc = await getProdDocByHeat(h);
        const fgDoc = await getFGDocByHeat(h);
        if (prodDoc) {
            const prod = prodDoc.data();
            const goodOutputKg = (_a = prod.goodIngots) !== null && _a !== void 0 ? _a : 0;
            if (fgDoc) {
                // UPDATE — only production-derived fields, preserve dispatch tracking
                const existing = fgDoc.data();
                const dispatchedKg = (_b = existing.dispatchedWeightKg) !== null && _b !== void 0 ? _b : 0;
                const remainingKg = Math.max(0, goodOutputKg - dispatchedKg);
                await fgDoc.ref.update({
                    heatNo: prod.heatNo,
                    productionDate: prod.date,
                    alloyType: (_c = prod.alloyType) !== null && _c !== void 0 ? _c : '',
                    grossWeightKg: (_d = prod.totalInput) !== null && _d !== void 0 ? _d : 0,
                    goodOutputKg,
                    numberOfPieces: (_f = (_e = prod.noOfPieces) !== null && _e !== void 0 ? _e : prod.totalPieces) !== null && _f !== void 0 ? _f : 0,
                    efficiencyPercentage: (_g = prod.efficiencyPercentage) !== null && _g !== void 0 ? _g : 0,
                    availableWeightKg: goodOutputKg,
                    remainingWeightKg: remainingKg,
                    productionLedgerId: prodDoc.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    // ✖ NOT touched: dispatchedWeightKg, status,
                    //   productionCostPerKg, estimatedSellingPrice, costLedgerId
                });
            }
            else {
                // CREATE — new finished good record
                await db.collection(FG_COL).add({
                    heatNo: prod.heatNo,
                    productionDate: (_h = prod.date) !== null && _h !== void 0 ? _h : admin.firestore.Timestamp.now(),
                    alloyType: (_j = prod.alloyType) !== null && _j !== void 0 ? _j : '',
                    grossWeightKg: (_k = prod.totalInput) !== null && _k !== void 0 ? _k : 0,
                    goodOutputKg,
                    numberOfPieces: (_m = (_l = prod.noOfPieces) !== null && _l !== void 0 ? _l : prod.totalPieces) !== null && _m !== void 0 ? _m : 0,
                    efficiencyPercentage: (_o = prod.efficiencyPercentage) !== null && _o !== void 0 ? _o : 0,
                    availableWeightKg: goodOutputKg,
                    dispatchedWeightKg: 0,
                    remainingWeightKg: goodOutputKg,
                    status: 'Available',
                    productionCostPerKg: 0,
                    estimatedSellingPrice: 0,
                    productionLedgerId: prodDoc.id,
                    costLedgerId: null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
    }
    // ── Handle old heat (rename or delete) ───────────────────────────────────
    if (oldHeatNo) {
        const oh = oldHeatNo.trim();
        if (oh && oh !== heatNo.trim()) {
            const prodDocForOld = await getProdDocByHeat(oh);
            const fgDocForOld = await getFGDocByHeat(oh);
            if (!prodDocForOld && fgDocForOld) {
                const existing = fgDocForOld.data();
                const dispatchedKg = (_p = existing.dispatchedWeightKg) !== null && _p !== void 0 ? _p : 0;
                if (dispatchedKg > 0) {
                    // Goods already dispatched — keep record, just clear production link
                    await fgDocForOld.ref.update({
                        productionLedgerId: null,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                else {
                    // Nothing dispatched — safe to delete
                    await fgDocForOld.ref.delete();
                }
            }
        }
    }
}
// ══════════════════════════════════════════════════════════════════════════════
// SYNC COST FIELDS → FINISHED GOODS
//
// Only writes cost/pricing fields.
// NEVER touches any other field.
// ══════════════════════════════════════════════════════════════════════════════
async function syncCostFields(heatNo, isCostDeleted = false) {
    var _a;
    if (!heatNo)
        return;
    const h = heatNo.trim();
    const fgDoc = await getFGDocByHeat(h);
    if (!fgDoc) {
        // No Finished Goods record yet — skip. Production must be added first.
        return;
    }
    if (isCostDeleted) {
        await fgDoc.ref.update({
            productionCostPerKg: 0,
            estimatedSellingPrice: 0,
            costLedgerId: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    else {
        const costDoc = await getCostDocByHeat(h);
        if (!costDoc)
            return;
        const cost = costDoc.data();
        const productionCostPerKg = (_a = cost.productionCostPerKg) !== null && _a !== void 0 ? _a : 0;
        const estimatedSellingPrice = productionCostPerKg > 0
            ? parseFloat((productionCostPerKg * 1.06).toFixed(2))
            : 0;
        await fgDoc.ref.update({
            productionCostPerKg,
            estimatedSellingPrice,
            costLedgerId: costDoc.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // ✖ NOT touched: anything else
        });
    }
}
// ══════════════════════════════════════════════════════════════════════════════
// CLOUD FUNCTION TRIGGERS — Production Ledger
// ══════════════════════════════════════════════════════════════════════════════
exports.onProductionCreated = (0, firestore_1.onDocumentCreated)(`${PRODUCTION_COL}/{docId}`, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!(data === null || data === void 0 ? void 0 : data.heatNo))
        return;
    await syncProductionFields(data.heatNo);
});
exports.onProductionUpdated = (0, firestore_1.onDocumentUpdated)(`${PRODUCTION_COL}/{docId}`, async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!(after === null || after === void 0 ? void 0 : after.heatNo))
        return;
    const oldHeatNo = before === null || before === void 0 ? void 0 : before.heatNo;
    await syncProductionFields(after.heatNo, oldHeatNo);
});
exports.onProductionDeleted = (0, firestore_1.onDocumentDeleted)(`${PRODUCTION_COL}/{docId}`, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!(data === null || data === void 0 ? void 0 : data.heatNo))
        return;
    // Pass empty string as heatNo to trigger cleanup of old heat
    await syncProductionFields('', data.heatNo);
});
// ══════════════════════════════════════════════════════════════════════════════
// CLOUD FUNCTION TRIGGERS — Cost Ledger
// ══════════════════════════════════════════════════════════════════════════════
exports.onCostCreated = (0, firestore_1.onDocumentCreated)(`${COST_COL}/{docId}`, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!(data === null || data === void 0 ? void 0 : data.heatNo))
        return;
    await syncCostFields(data.heatNo);
});
exports.onCostUpdated = (0, firestore_1.onDocumentUpdated)(`${COST_COL}/{docId}`, async (event) => {
    var _a;
    const after = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    if (!(after === null || after === void 0 ? void 0 : after.heatNo))
        return;
    await syncCostFields(after.heatNo);
});
exports.onCostDeleted = (0, firestore_1.onDocumentDeleted)(`${COST_COL}/{docId}`, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!(data === null || data === void 0 ? void 0 : data.heatNo))
        return;
    await syncCostFields(data.heatNo, true);
});
//# sourceMappingURL=index.js.map