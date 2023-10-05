/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search", "./rxrs_verify_staging_lib", "./rxrs_util"], /**
 * @param{record} record
 * @param{search} search
 * @param rxrsUtil_vl
 */ (record, search, rxrsUtil_vl, rxrs_util) => {
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
      let { rrId, mrrId } = options;
      log.error(
        "isRR Verified",
        rxrsUtil_vl.checkIfRRIsVerified({ rrId: rrId })
      );
      if (rxrsUtil_vl.checkIfRRIsVerified({ rrId: rrId }) != true) return;
      log.audit("createInventoryAdjustment", options);
      /**
       * Set the return request to approve since all the items are verified
       */
      record.submitFields({
        type: rxrs_util.getReturnRequestType(rrId),
        id: rrId,
        values: {
          transtatus: rxrs_util.rrStatus.Approved,
        },
      });
      let inventoryAdjRec;
      let IAExist = checkIfTransAlreadyExist({
        mrrId: mrrId,
        searchType: "InvAdjst",
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
        value: mrrId,
      });
      let IAId = addInventoryAdjustmentLine({
        inventoryAdjRec: inventoryAdjRec,
        rrId: rrId,
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
      let { inventoryAdjRec, rrId } = options;
      let items = getIRSLine({ rrId: rrId });
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
          value: +IRFields.quantity,
        });
        inventoryAdjRec.setCurrentSublistValue({
          sublistId: "inventory",
          fieldId: "unitcost",
          value: +IRFields.amount,
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
          value: IRFields.quantity,
        });

        subrec.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "receiptinventorynumber",
          value: IRFields.serialLotNumber,
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
      log.error("addInventoryAdjustmentLine", e.message);
    }
  }

  /**
   * Check transaction Already Exist
   *@param {number} options.mrrId - Internal Id of the Return Request
   *@param {string} options.searchType - Transaction Type
   *@param {number} options.finalPaymentSchedule - Final Payment Schedule
   *@param {string} options.status - Transaction Status
   *@return  null if no transaction is created yet | return the internal Id if the transaction exists
   */
  function checkIfTransAlreadyExist(options) {
    log.audit("checkIfTransAlreadyExist", options);
    let { searchType, mrrId, finalPaymentSchedule, status } = options;

    try {
      let tranId;
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["type", "anyof", searchType],
          "AND",
          ["custbody_kd_master_return_id", "anyof", mrrId],
          "AND",
          ["mainline", "is", "T"],
        ],
      });
      if (status) {
        transactionSearchObj.filters.push(
          search.createFilter({
            name: "status",
            operator: "anyof",
            values: "PurchOrd:H",
          })
        );
      }
      if (finalPaymentSchedule) {
        transactionSearchObj.filters.push(
          search.createFilter({
            name: "custbody_kodpaymentsched",
            operator: "anyof",
            values: finalPaymentSchedule,
          })
        );
      }

      const searchResultCount = transactionSearchObj.runPaged().count;
      if (searchResultCount < 1) return null;

      transactionSearchObj.run().each(function (result) {
        tranId = result.id;
        return true;
      });
      return tranId;
    } catch (e) {
      log.error("checkIfTransAlreadyExist", e.message);
    }
  }

  /**
   * Create PO if the type of the Return Request is RRPO
   * @param {number}options.mrrId
   * @param {number}options.rrId
   * @param {number}options.entity
   */
  function createPO(options) {
    let { mrrId, rrId, entity } = options;
    let poLinesInfo = [];
    try {
      log.debug("createPO", options);
      let poId = checkIfTransAlreadyExist({
        mrrId: mrrId,
        searchType: "PurchOrd",
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
        value: entity,
      });
      poRec.setValue({
        fieldId: "custbody_kd_master_return_id",
        value: +mrrId,
      });
      let rrIds = poRec.getValue("custbody_kd_return_request2"); // add multiple return request
      if (rrIds.length > 0) {
        rrIds.push(rrId);
        poRec.setValue({
          fieldId: "custbody_kd_return_request2",
          value: rrIds,
        });
      } else {
        poRec.setValue({
          fieldId: "custbody_kd_return_request2",
          value: rrId,
        });
      }

      let poLines = getIRSLine({ rrId: rrId });
      log.audit("poLines", poLines);
      if (poLines.length < 1) throw "No Lines can be set on the Purchase Order";
      let line = 0;
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
            fieldId: "custcol_rsrs_itemscan_link",
            value: +item.id,
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
          const subRec = poRec.getCurrentSublistSubrecord({
            sublistId: "item",
            fieldId: "inventorydetail",
          });
          setInventoryDetails({
            inventoryDetailSubrecord: subRec,
            quantity: item.quantity,
            serialLotNumber: item.serialLotNumber,
          });
          poLinesInfo.push({
            line: line,
            quantity: +item.quantity,
          });
          poRec.commitLine("item");
          line++;
        } catch (e) {
          log.error("Setting PO Lines", e.message);
        }
      });
      let POID = poRec.save({
        ignoreMandatoryFields: true,
      });
      if (POID) {
        let resMessage;
        const IRId = transformRecord({
          fromType: record.Type.PURCHASE_ORDER,
          toType: record.Type.ITEM_RECEIPT,
          fromId: POID,
          isDynamic: true,
          rrId: rrId,
        });

        // log.audit("IRID", IRId);
        // log.audit("PO Id", POID);
        resMessage = `Successfully Created PO: ${POID}`;
        if (IRId) {
          resMessage += ` And Successfully Created PO: ${IRId}`;
        }
        return {
          resMessage: resMessage,
        };
      }
    } catch (e) {
      log.error("createPO", e.message);
      return { error: e.message };
    }
  }

  /**
   * Get Item Return Scan Details
   * @param {number}options.rrId - Return Request Id
   * @param {number}options.mrrId - Master Return Request Id
   * @param {number}options.finalyPaymentSchedule
   * @return {array} return list of verified Item Return Scan
   */
  function getIRSLine(options) {
    let { rrId, finalyPaymentSchedule, mrrId } = options;
    try {
      let poLines = [];
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [],
        columns: [
          search.createColumn({
            name: "custrecord_cs_return_req_scan_item",
            label: "Item",
          }),
          search.createColumn({
            name: "custrecord_cs_expiration_date",
            label: "Expiration Date",
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
          search.createColumn({
            name: "custrecord_scanorginallotnumber",
          }),
        ],
      });
      if (rrId) {
        customrecord_cs_item_ret_scanSearchObj.filters.push(
          search.createFilter({
            name: "custrecord_cs_ret_req_scan_rrid",
            operator: "anyof",
            values: rrId,
          })
        );
      }
      if (finalyPaymentSchedule) {
        customrecord_cs_item_ret_scanSearchObj.filters.push(
          search.createFilter({
            name: "custrecord_final_payment_schedule",
            operator: "anyof",
            values: finalyPaymentSchedule,
          })
        );
      }
      if (finalyPaymentSchedule) {
        customrecord_cs_item_ret_scanSearchObj.filters.push(
          search.createFilter({
            name: "custrecord_final_payment_schedule",
            operator: "anyof",
            values: finalyPaymentSchedule,
          })
        );
      }
      if (mrrId) {
        customrecord_cs_item_ret_scanSearchObj.filters.push(
          search.createFilter({
            name: "custrecord_irs_master_return_request",
            operator: "anyof",
            values: mrrId,
          })
        );
      }

      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let amount = 0;

        amount = result.getValue("custrecord_irc_total_amount");
        poLines.push({
          id: result.id,
          item: result.getValue("custrecord_cs_return_req_scan_item"),
          manufacturer: result.getValue("custrecord_scanmanufacturer"),
          mfgProcessing: result.getValue("custrecord_cs__mfgprocessing"),
          pharmaProcessing: result.getValue("custrecord_cs__rqstprocesing"),
          quantity: result.getValue("custrecord_cs_qty"),
          amount: amount,
          expDate: result.getValue("custrecord_cs_expiration_date"),
          serialLotNumber: result.getValue("custrecord_scanorginallotnumber"),
        });
        return true;
      });
      return poLines;
    } catch (e) {
      log.error("getIRSLine", e.message);
    }
  }

  /**
   *Set inventory Detail Subrecord
   * @param {object}options.inventoryDetailSubrecord
   * @param {number}options.quantity
   * @param {string}options.serialLotNumber
   * @param {string}options.expirationDate
   */
  function setInventoryDetails(options) {
    let {
      inventoryDetailSubrecord,
      quantity,
      serialLotNumber,
      expirationDate,
    } = options;
    try {
      inventoryDetailSubrecord.selectNewLine({
        sublistId: "inventoryassignment",
      });
      inventoryDetailSubrecord.setCurrentSublistValue({
        sublistId: "inventoryassignment",
        fieldId: "receiptinventorynumber",
        value: serialLotNumber,
      });
      inventoryDetailSubrecord.setCurrentSublistValue({
        sublistId: "inventoryassignment",
        fieldId: "quantity",
        value: quantity,
      });
      expirationDate &&
        inventoryDetailSubrecord.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "expirationdate",
          value: expirationDate,
        });
      return inventoryDetailSubrecord.commitLine({
        sublistId: "inventoryassignment",
      });
    } catch (e) {
      log.error("Setting Inventory Details", e.message);
    }
  }

  /**
   * Transform Record
   * @param {string}options.fromType
   * @param {string}options.toType
   * @param {number}options.fromId
   * @param {number}options.rrId
   * @param {boolean}options.isDynamic
   */
  function transformRecord(options) {
    log.audit("transformRecord params", options);
    let { fromType, toType, fromId, rrId, isDynamic } = options;
    try {
      const objRecord = record.transform({
        fromType: fromType,
        fromId: fromId,
        toType: toType,
        isDynamic: isDynamic,
      });
      objRecord.setValue({
        fieldId: "custbody_kd_return_request2",
        value: rrId,
      });
      return objRecord.save({ ignoreMandatoryFields: true });
    } catch (e) {
      log.error("transfromRecord", e.message);
    }
  }

  /**
   * Create PO if the type of the Return Request is RRPO
   * @param {number}options.poId - Purchase Order Id
   * @param {number}options.finalPaymentSchudule - Final Payment Schedule
   */
  function createBill(options) {
    log.audit("createBill", options);
    let { finalPaymentSchudule, poId } = options;
    try {
      let VBID = transformRecord({
        fromType: record.Type.PURCHASE_ORDER,
        toType: record.Type.VENDOR_BILL,
        fromId: poId,
        isDynamic: true,
      });

      if (VBID) {
        removeVBLine({
          vbId: VBID,
          finalPaymentSchudule: finalPaymentSchudule,
        });
      }
      return { id: VBID };
    } catch (e) {
      log.error("createBill", e.message);
      return { error: e.message };
    }
  }

  /**
   * Remove the line for an speicific payment schedule
   * @param {object}options.vbId
   * @param {number}options.finalPaymentSchudule
   *
   */
  function removeVBLine(options) {
    log.audit("removeVBLine", options);

    let { vbId, finalPaymentSchudule } = options;
    const vbRec = record.load({
      type: record.Type.VENDOR_BILL,
      id: vbId,
    });

    vbRec.setValue({
      fieldId: "custbody_kodpaymentsched",
      value: finalPaymentSchudule,
    });
    try {
      for (let i = 0; i < vbRec.getLineCount("item"); i++) {
        let paymentSched = vbRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_kd_pymt_sched",
          line: i,
        });
        log.debug("VB Line info ", { i, paymentSched });
        if (paymentSched != finalPaymentSchudule) {
          vbRec.removeLine({ sublistId: "item", line: i });
        }
      }
      return vbRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("removeVBLine", e.message);
    }
  }

  return {
    createInventoryAdjustment: createInventoryAdjustment,
    createPO: createPO,
    checkIfTransAlreadyExist: checkIfTransAlreadyExist,
    createBill: createBill,
  };
});
