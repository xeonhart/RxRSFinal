/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search", "./rxrs_verify_staging_lib"], /**
 * @param{record} record
 * @param{search} search
 * @param rxrsUtil_vl
 */ (record, search, rxrsUtil_vl) => {
  const SUBSIDIARY = 2; //Rx Return Services
  const ACCOUNT = 212; //50000 Cost of Goods Sold
  const LOCATION = 1; //Clearwater

  /**
   * Create Inventory Adjustment for verified Item Return Scan
   * @param {number}options.rrId Internal I'd of the Return Request
   * @param {number} options.mrrId Internal I'd of the Master Return Request
   */
  function createInventoryAdjustment(options) {
    try {
      log.error(
        "isRR Verified",
        rxrsUtil_vl.checkIfRRIsVerified({ rrId: options.rrId })
      );
      if (rxrsUtil_vl.checkIfRRIsVerified({ rrId: options.rrId }) != true)
        return;
      log.audit("createInventoryAdjustment", options);
      let inventoryAdjRec;
      let IAExist = checkITransAlreadyExist({
        mrrId: options.mrrId,
        searchType: "so",
      });
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
   * @param {number}options.rrId - Return Request I'd
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
   * Check if the PO or Inventory Adjustment Already Exist
   *@param {number} options.mrrId - Internal Id of the Return Request
   *@param {string} options.searchType - Use po or so
   *@return  null if no IA created | return the internal Id if the IA exists
   */
  function checkITransAlreadyExist(options) {
    try {
      let Searchtype = options.searchType == "po" ? "PurchOrd" : "InvAdjst";
      let invAdId;
      const inventoryadjustmentSearchObj = search.create({
        type: "transaction",
        filters: [
          ["type", "anyof", Searchtype],
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
      log.error("checkITransAlreadyExist", e.message);
    }
  }

  /**
   * Create PO if the type of the Return Request is RRPO
   * @param {number}options.mrrId
   * @param {string}options.rrId
   */
  function createPO(options) {
    try {
      log.debug("createPO", options);
      let poId = checkITransAlreadyExist({
        mrrId: options.mrrId,
        searchType: "po",
      });
      let poRec;
      if (poId !== null) {
        poRec = record.load({
          type: record.Type.PURCHASE_ORDER,
          id: poId,
          isDynamic: true,
        });
      } else {
        poRec = record.create({
          type: record.Type.PURCHASE_ORDER,
          isDynamic: true,
        });
      }
      poRec.setValue({
        fieldId: "entity",
        value: rxrsUtil_vl.getEntityFromMrr({ mrrId: options.mrrId }),
      });
      poRec.setValue({
        fieldId: "custbody_kd_master_return_id",
        value: +options.mrrId,
      });
      poRec.setValue({
        fieldId: "custbody_kd_return_request2",
        value: options.rrId,
      });
      let poLines = getIRSPOLine({ rrId: options.rrId });
      log.audit("poLines", poLines);
      if (poLines.length < 1) throw "No Lines can be set on the Purchase Order";

      poLines.forEach((item) => {
        try {
          poRec.selectNewLine({
            sublistId: "item",
          });
          poRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: +item.item,
          });
          poRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "csegmanufacturer",
            value: +item.manufacturer,
          });
          poRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_kod_mfgprocessing",
            value: +item.mfgProcessing,
          });
          poRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_kod_rqstprocesing",
            value: +item.pharmaProcessing,
          });
          poRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: +item.quantity,
          });
          poRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: item.amount ? item.amount : 0,
          });
          poRec.commitLine("item");
        } catch (e) {
          log.error("Setting PO Lines", e.message);
        }
      });
      let POID = poRec.save({
        ignoreMandatoryFields: true,
      });
      log.audit("PO Id", POID);
    } catch (e) {
      log.error("createPO", e.message);
    }
  }

  /**
   * Get verified Item Return Scan Details for PO
   * @param {number}options.rrId - Return Request Id
   * @return {array} return list of verified Item Return Scan
   */
  function getIRSPOLine(options) {
    try {
      let poLines = [];
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [["custrecord_cs_ret_req_scan_rrid", "anyof", options.rrId]],
        columns: [
          search.createColumn({
            name: "custrecord_cs_return_req_scan_item",
            label: "Item",
          }),
          search.createColumn({
            name: "custrecord_scanmanufacturer",
            label: "Manufacturer",
          }),
          search.createColumn({
            name: "custrecord_cs__mfgprocessing",
            label: "Mfg Processing",
          }),
          search.createColumn({
            name: "custrecord_cs__rqstprocesing",
            label: "Pharmacy Processing",
          }),
          search.createColumn({ name: "custrecord_cs_qty", label: "Qty" }),
          search.createColumn({ name: "custrecord_scanrate", label: "Rate" }),
          search.createColumn({
            name: "custrecord_irc_total_amount",
            label: "Amount ",
          }),
        ],
      });

      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let amount = 0;
        amount = result.getValue("amount");
        poLines.push({
          item: result.getValue("custrecord_cs_return_req_scan_item"),
          manufacturer: result.getValue("custrecord_scanmanufacturer"),
          mfgProcessing: result.getValue("custrecord_cs__mfgprocessing"),
          pharmaProcessing: result.getValue("custrecord_cs__rqstprocesing"),
          quantity: result.getValue("custrecord_cs_qty"),
          amount: amount,
        });
        return true;
      });
      return poLines;
    } catch (e) {
      log.error("getIRSPOLine", e.message);
    }
  }

  return {
    createInventoryAdjustment: createInventoryAdjustment,
    createPO: createPO,
  };
});
