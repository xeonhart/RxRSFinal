/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 * @param{search} search
 */ (record, search) => {
  /**
   * Get Item Return Scan Details
   * @param {number}options.id Internal Id of the item return scan
   * @return {object} returns the item return scan field values
   */
  function itemReturnScanFieldsSearch(options) {
    try {
      let irsSearch = search.lookupFields({
        type: "customrecord_cs_item_ret_scan",
        id: options.id,
        columns: [
          "custrecord_cs_expiration_date",
          "custrecord_cs_lotnum",
          "custrecord_cs_qty",
          "custrecord_cs_return_req_scan_item",
          "custrecord_wac_amount",
        ],
      });
      const item = irsSearch["custrecord_cs_return_req_scan_item"][0].value;
      const expDate = irsSearch["custrecord_cs_expiration_date"];
      const serialLot = irsSearch["custrecord_cs_lotnum"];
      const qty = irsSearch["custrecord_cs_qty"];
      const wacAmount = irsSearch["custrecord_wac_amount"];
      return {
        item: +item,
        expDate: expDate || "",
        serialLot: serialLot || "",
        qty: qty,
        wacAmount: +wacAmount,
      };
    } catch (e) {
      log.error("itemReturnScanFieldsSearch", e.message);
    }
  }

  /**
   * Create Inventory Adjustment for verified Item Return Scan
   * @param {number}options.id Internal Id of the Item Return Scan
   */
  function createInventoryAdjustment(options) {
    try {
      log.audit("createInventoryAdjustment",options)
      const SUBSIDIARY = 2; //Rx Return Services
      const ACCOUNT = 212; //50000 Cost of Goods Sold
      const LOCATION = 1; //Clearwater
      const IRFields = itemReturnScanFieldsSearch({ id: options.id });
      log.audit("itemReturnScanFieldsSearch",IRFields)
      let inventoryAdjRec = record.create({
        type: record.Type.INVENTORY_ADJUSTMENT,
        isDynamic: true,
      });
      inventoryAdjRec.setValue({
        fieldId: "subsidiary",
        value: SUBSIDIARY,
      });
      inventoryAdjRec.setValue({
        fieldId: "account",
        value: ACCOUNT,
      });
      inventoryAdjRec.selectNewLine({
        sublistId: "inventory",
      });
      inventoryAdjRec.setCurrentSublistValue({
        sublistId: "inventory",
        fieldId: "location",
        value: LOCATION,
      });
      inventoryAdjRec.setCurrentSublistValue({
        sublistId: "inventory",
        fieldId: "item",
        value: +IRFields.item,
      });
      inventoryAdjRec.setCurrentSublistValue({
        sublistId: "inventory",
        fieldId: "adjustqtyby",
        value: +IRFields.qty,
      });
      inventoryAdjRec.setCurrentSublistValue({
        sublistId: "inventory",
        fieldId: "unitcost",
        value: +IRFields.wacAmount,
      });

      /**
       * Adding Inventory Details
       */
      let subrec = inventoryAdjRec.getCurrentSublistSubrecord({
        sublistId: 'inventory',
        fieldId: 'inventorydetail'
      });
      subrec.selectNewLine({
        sublistId: 'inventoryassignment',
      });

      subrec.setCurrentSublistValue({
        sublistId: 'inventoryassignment',
        fieldId: 'quantity',
        value: IRFields.qty
      });

      subrec.setCurrentSublistValue({
        sublistId: 'inventoryassignment',
        fieldId: 'receiptinventorynumber',
        value: IRFields.serialLot
      });
      let expDate = new Date( IRFields.expDate);
      subrec.setCurrentSublistValue({
        sublistId: 'inventoryassignment',
        fieldId: 'expirationdate',
        value: expDate
      });

      subrec.commitLine({
        sublistId: 'inventoryassignment'
      });

      inventoryAdjRec.commitLine("inventory");
     let IAId = inventoryAdjRec.save({
        ignoreMandatoryFields: true
      })
      log.audit("IAId",IAId)
    } catch (e) {
      log.error("createInventoryAdjustment", e.message);
    }
  }

  return { createInventoryAdjustment: createInventoryAdjustment };
});
