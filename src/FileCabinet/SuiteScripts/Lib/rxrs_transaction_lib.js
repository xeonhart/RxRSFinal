/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search", "./rxrs_verify_staging_lib"], /**
 * @param{record} record
 * @param{search} search
 * @param rxrsUtil
 */ (record, search, rxrsUtil) => {
  const SUBSIDIARY = 2; //Rx Return Services
  const ACCOUNT = 212; //50000 Cost of Goods Sold
  const LOCATION = 1; //Clearwater

  /**
   * Create Inventory Adjustment for verified Item Return Scan
   * @param {number}options.rrId Internal Id of the Return Request
   * @param {number} options.mrrId Internal Id of the Master Return Request
   */
  function createInventoryAdjustment(options) {
    try {
      log.error(
        "isRR Verified",
        rxrsUtil.checkIfRRIsVerified({ rrId: options.rrId })
      );
      if (rxrsUtil.checkIfRRIsVerified({ rrId: options.rrId }) != true) return;
      log.audit("createInventoryAdjustment", options);
      let inventoryAdjRec;
      let IAExist = checkIfInvAdAlreadyExist({ mrrId: options.mrrId });
      log.debug("createInventoryAdjustment IAExist", IAExist);
      if (IAExist == null) {
        inventoryAdjRec = record.create({
          type: record.Type.INVENTORY_ADJUSTMENT,
          isDynamic: true,
        });
      } else {
        inventoryAdjRec = record.load({
          type: record.Type.INVENTORY_ADJUSTMENT,
          id: IAExist,
          isDynamic: true,
        });
      }

      inventoryAdjRec.setValue({
        fieldId: "subsidiary",
        value: SUBSIDIARY,
      });
      inventoryAdjRec.setValue({
        fieldId: "account",
        value: ACCOUNT,
      });
      inventoryAdjRec.setValue({
        fieldId: "adjlocation",
        value: LOCATION,
      });
      inventoryAdjRec.setValue({
        fieldId: "custbody_kd_master_return_id",
        value: options.mrrId,
      });
      let IAId = addInventoryAdjustmentLine({
        inventoryAdjRec: inventoryAdjRec,
        rrId: options.rrId,
      });
      log.audit("IAId", IAId);
    } catch (e) {
      log.error("createInventoryAdjustment", e.message);
    }
  }

  /**
   * Add Inventory Adjustment Line
   * @param {object}options.inventoryAdjRec -  Inventory Adjustment Record
   * @param {number}options.rrId - Return Request Id
   */
  function addInventoryAdjustmentLine(options) {
    try {
      let inventoryAdjRec = options.inventoryAdjRec;
      let items = getReturnRequestLine(options.rrId);
      items.forEach((IRFields) => {
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
          sublistId: "inventory",
          fieldId: "inventorydetail",
        });
        subrec.selectNewLine({
          sublistId: "inventoryassignment",
        });

        subrec.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "quantity",
          value: IRFields.qty,
        });

        subrec.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "receiptinventorynumber",
          value: IRFields.serialLot,
        });
        let expDate = new Date(IRFields.expDate);
        subrec.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "expirationdate",
          value: expDate,
        });

        subrec.commitLine({
          sublistId: "inventoryassignment",
        });

        inventoryAdjRec.commitLine("inventory");
      });
      return inventoryAdjRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error(addInventoryAdjustmentLine, e.message);
    }
  }

  /**
   * Get the item return scan details
   * @param {number}rrid
   * @return {array} return the item return scan item list
   */
  function getReturnRequestLine(rrid) {
    try {
      let IRSItems = [];
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [["custrecord_cs_ret_req_scan_rrid", "anyof", rrid]],
        columns: [
          search.createColumn({
            name: "custrecord_cs_return_req_scan_item",
            label: "Item",
          }),
          search.createColumn({
            name: "custrecord_cs_lotnum",
            label: "Serial/Lot Number",
          }),
          search.createColumn({
            name: "custrecord_cs_expiration_date",
            label: "Expiration Date",
          }),
          search.createColumn({ name: "custrecord_cs_qty", label: "Qty" }),
          search.createColumn({
            name: "custrecord_wac_amount",
            sort: search.Sort.ASC,
            label: "Amount",
          }),
        ],
      });

      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        IRSItems.push({
          item: result.getValue("custrecord_cs_return_req_scan_item"),
          qty: result.getValue("custrecord_cs_qty"),
          serialLot: result.getValue("custrecord_cs_lotnum"),
          expDate: result.getValue("custrecord_cs_expiration_date"),
          wacAmount: result.getValue("custrecord_wac_amount"),
        });
        return true;
      });
      log.audit("IRSItems", IRSItems);
      return IRSItems;
    } catch (e) {
      log.error("getReturnRequestLine", e.message);
    }
  }

  /**
   * Check if the inventory Adjustment Already Exist
   *@param {number} options.mrrId - Internal Id of the Return Request
   *@return  null if no IA created | return the internal Id if the IA exists
   */
  function checkIfInvAdAlreadyExist(options) {
    try {
      let invAdId;
      const inventoryadjustmentSearchObj = search.create({
        type: "inventoryadjustment",
        filters: [
          ["type", "anyof", "InvAdjst"],
          "AND",
          ["custbody_kd_master_return_id", "anyof", options.mrrId],
          "AND",
          ["mainline", "is", "T"],
        ],
      });
      const searchResultCount = inventoryadjustmentSearchObj.runPaged().count;
      if (searchResultCount < 1) return null;

      inventoryadjustmentSearchObj.run().each(function (result) {
        invAdId = result.id;
        return true;
      });
      return invAdId;
    } catch (e) {
      log.error("checkIfInvAdAlreadyExist", e.message);
    }
  }

  return { createInventoryAdjustment: createInventoryAdjustment };
});
