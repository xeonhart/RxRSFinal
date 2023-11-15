/**
 * @NApiVersion 2.1
 */
define([
  "N/record",
  "N/search",
  "N/url",
  "N/https",
  "./rxrs_verify_staging_lib",
  "./rxrs_util",
  "./rxrs_return_cover_letter_lib",
], /**
 * @param{record} record
 * @param{search} search
 * @param url
 * @param https
 * @param rxrsUtil_vl
 * @param rxrs_util
 * @param rxrs_rcl_lib
 */ (record, search, url, https, rxrsUtil_vl, rxrs_util, rxrs_rcl_lib) => {
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
   *@param {(string || number)} options.finalPaymentSchedule - Final Payment Schedule
   *@param {string} options.status - Transaction Status
   *@param {string} options.irsId Item return Scan Id - Transaction Status
   *@return  null if no transaction is created yet | return the internal Id if the transaction exists
   */
  function checkIfTransAlreadyExist(options) {
    log.audit("checkIfTransAlreadyExist", options);
    let { searchType, mrrId, irsId, finalPaymentSchedule, status } = options;
    log.audit("finalPaymentSchedule", { finalPaymentSchedule, options });
    try {
      let tranId;
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [["type", "anyof", searchType]],
      });
      let mainLine = irsId === undefined ? "T" : "F";
      transactionSearchObj.filters.push(
        search.createFilter({
          name: "mainline",
          operator: "is",
          values: mainLine,
        })
      );
      mrrId &&
        transactionSearchObj.filters.push(
          search.createFilter({
            name: "custbody_kd_master_return_id",
            operator: "anyof",
            values: mrrId,
          })
        );
      status &&
        transactionSearchObj.filters.push(
          search.createFilter({
            name: "status",
            operator: "anyof",
            values: status,
          })
        );
      if (finalPaymentSchedule) {
        transactionSearchObj.filters.push(
          search.createFilter({
            name: "custbody_kodpaymentsched",
            operator: "anyof",
            values: finalPaymentSchedule,
          })
        );
      }

      log.emergency("filters", transactionSearchObj.filters);
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
      poLines.forEach((itemInfo) => {
        try {
          let {
            item,
            id,
            manufacturer,
            mfgProcessing,
            pharmaProcessing,
            quantity,
            amount,
            expDate,
            serialLotNumber,
          } = itemInfo;
          poRec.selectNewLine({
            sublistId: "item",
          });
          item &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "item",
              value: item,
            });
          id &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_rsrs_itemscan_link",
              value: id,
            });
          manufacturer &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "csegmanufacturer",
              value: manufacturer,
            });
          // mfgProcessing &&
          //   poRec.setCurrentSublistValue({
          //     sublistId: "item",
          //     fieldId: "custcol_kod_mfgprocessing",
          //     value: mfgProcessing,
          //   });
          // pharmaProcessing &&
          //   poRec.setCurrentSublistValue({
          //     sublistId: "item",
          //     fieldId: "custcol_kod_rqstprocesing",
          //     value: pharmaProcessing,
          //   });
          quantity &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              value: quantity,
            });
          amount &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: amount ? amount : 0,
            });
          try {
            const subRec = poRec.getCurrentSublistSubrecord({
              sublistId: "item",
              fieldId: "inventorydetail",
            });
            if (subRec) {
              setInventoryDetails({
                inventoryDetailSubrecord: subRec,
                quantity: quantity,
                serialLotNumber: serialLotNumber,
                expirationDate: expDate,
              });
            }
          } catch (e) {
            log.error("Setting Inventory Detail", {
              error: e.message,
              item: item,
            });
          }

          poLinesInfo.push({
            line: line,
            quantity: +item.quantity,
          });
          poRec.commitLine("item");
          line++;
        } catch (e) {
          log.error("Setting PO Lines", { item: itemInfo, error: e.message });
        }
      });
      let POID = poRec.save({
        ignoreMandatoryFields: true,
      });
      if (POID) {
        rxrs_rcl_lib.updateReturnCoverRecord(mrrId);
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
   * Add Vendor Bill Line
   * @param {number}options.existingBillId Vendor Bill ID
   * @param {*[]}options.lineInfo Item Return Scan Details
   */
  function addVendorBillLine(options) {
    log.audit("addVendorBillLine", options);
    let { existingBillId, lineInfo } = options;
    try {
      let vbRec = record.load({
        type: record.Type.VENDOR_BILL,
        id: existingBillId,
        isDynamic: true,
      });
      let line = 0;
      lineInfo.forEach((item) => {
        try {
          vbRec.selectNewLine({
            sublistId: "item",
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: +item.item,
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_rsrs_itemscan_link",
            value: +item.id,
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "csegmanufacturer",
            value: +item.manufacturer,
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_kod_mfgprocessing",
            value: +item.mfgProcessing,
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_kod_rqstprocesing",
            value: +item.pharmaProcessing,
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: +item.quantity,
          });
          vbRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: item.amount ? item.amount : 0,
          });
          const subRec = vbRec.getCurrentSublistSubrecord({
            sublistId: "item",
            fieldId: "inventorydetail",
          });
          setInventoryDetails({
            inventoryDetailSubrecord: subRec,
            quantity: item.quantity,
            serialLotNumber: item.serialLotNumber,
          });

          vbRec.commitLine("item");
          line++;
        } catch (e) {
          log.error(" addVendorBillLine Setting VB Lines", e.message);
        }
      });
    } catch (e) {
      log.error("addVendorBillLine", e.message);
    }
  }

  /**
   * Get Item Return Scan Details
   * @param {number}options.rrId - Return Request Id
   * @param {number}options.mrrId - Master Return Request Id
   * @param {number}options.finalyPaymentSchedule
   * @param {number}options.irsId Item Return Scan Id
   * @return {array} return list of verified Item Return Scan
   */
  function getIRSLine(options) {
    log.audit("getIRSLine", getIRSLine);
    let { rrId, finalyPaymentSchedule, mrrId, irsId } = options;
    try {
      let poLines = [];
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: ["custrecord_cs__rqstprocesing", "anyof", [1, 2]],
        columns: [
          search.createColumn({
            name: "custrecord_final_payment_schedule",
            sort: search.Sort.ASC,
            label: "Final Payment Schedule",
          }),
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

      if (mrrId) {
        customrecord_cs_item_ret_scanSearchObj.filters.push(
          search.createFilter({
            name: "custrecord_irs_master_return_request",
            operator: "anyof",
            values: mrrId,
          })
        );
      }
      if (irsId) {
        customrecord_cs_item_ret_scanSearchObj.filters.push(
          search.createFilter({
            name: "internalid",
            operator: "anyof",
            values: irsId,
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
          expDate: result.getText("custrecord_cs_expiration_date"),
          serialLotNumber: result.getValue("custrecord_scanorginallotnumber"),
        });
        return true;
      });
      log.debug("POLINE", poLines);
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
    log.audit("setInventoryDetails", options);
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
      serialLotNumber &&
        inventoryDetailSubrecord.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "receiptinventorynumber",
          value: serialLotNumber,
        });
      quantity &&
        inventoryDetailSubrecord.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "quantity",
          value: quantity,
        });
      expirationDate &&
        inventoryDetailSubrecord.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "expirationdate",
          value: new Date(expirationDate),
        });
      return inventoryDetailSubrecord.commitLine({
        sublistId: "inventoryassignment",
      });
    } catch (e) {
      log.error("Setting Inventory Details", e.message);
    }
  }

  /**
   * Get trancation status
   * @param {string}options.type
   * @param {string}options.id
   * @param {string}options.columns
   */
  function getCertainField(options) {
    let { type, id, columns } = options;
    try {
      const tranSearch = search.lookupFields({
        type: type,
        id: id,
        columns: [columns],
      });
      return tranSearch[columns][0].value;
    } catch (e) {
      log.error("getTransactionStatus", e.message);
    }
  }

  /**
   * Transform Record
   * @param {string}options.fromType
   * @param {string}options.toType
   * @param {number}options.fromId
   * @param {number}options.rrId
   * @param {boolean}options.isDynamic
   * @param {number}options.finalPaymentSchedule
   */
  function transformRecord(options) {
    log.audit("transformRecord params", options);
    let { fromType, finalPaymentSchedule, toType, fromId, rrId, isDynamic } =
      options;
    try {
      const objRecord = record.transform({
        fromType: fromType,
        fromId: fromId,
        toType: toType,
        isDynamic: isDynamic,
      });

      rrId &&
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
   * @param {number}options.finalPaymentSchedule - Final Payment Schedule
   */
  function createBill(options) {
    log.audit("createBill", options);
    let { finalPaymentSchedule, poId } = options;
    try {
      if (finalPaymentSchedule == undefined) return;
      let vbId;
      vbId = transformRecord({
        fromType: record.Type.PURCHASE_ORDER,
        toType: record.Type.VENDOR_BILL,
        fromId: poId,
        isDynamic: false,
      });
      let vbRec = record.load({
        type: record.Type.VENDOR_BILL,
        id: vbId,
        isDynamic: false,
      });
      let mrrId = vbRec.getValue("custbody_kd_master_return_id");

      vbRec.setValue({
        fieldId: "tranid",
        value: mrrId + "_" + options.finalPaymentSchedule,
      });
      vbRec.setValue({
        fieldId: "custbody_kodpaymentsched",
        value: options.finalPaymentSchedule,
      });
      let vbRec2 = removeVBLine({
        vbRec: vbRec,
        updateLine: false,
        finalPaymentSchedule: finalPaymentSchedule,
      });

      if (vbRec2 && finalPaymentSchedule === 12) {
        vbId = addBillProcessingFee({
          vbRecId: vbRec2.save({ ignoreMandatoryFields: true }),
        });
        return vbId;
      } else {
        return vbRec2.save({ ignoreMandatoryFields: true });
      }
    } catch (e) {
      log.error("createBill", e.message);
      //  return { error: e.message };
    }
  }

  function createServiceItemLines(newVBRec) {
    log.emergency("createServiceItemLines", newVBRec);
    const ACCRUEDPURCHASEITEM = 916;
    const RETURNABLE = 2;
    const NONRETURNABLE = 1;
    const RETURNABLESERVICEFEEITEM = 882;

    let returnableAmount = 0;
    const returnableFeeRate =
      newVBRec.getValue("custbody_rxrs_returnable_fee") / 100;
    let accruedAmount = 0;
    try {
      for (let i = 0; i < newVBRec.getLineCount("item"); i++) {
        const mfgProcessing = newVBRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_rxrs_mfg_processing",
          line: i,
        });
        const pharmaProcessing = newVBRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_rxrs_pharma_processing",
          line: i,
        });
        let quantity = newVBRec.getSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          line: i,
        });
        let rate = newVBRec.getSublistValue({
          sublistId: "item",
          fieldId: "rate",
          line: i,
        });
        log.debug("processing", {
          line: i,
          pharma: pharmaProcessing,
          mfg: mfgProcessing,
        });
        if (pharmaProcessing == NONRETURNABLE && mfgProcessing == RETURNABLE) {
          let amount = newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
          amount = amount === 0 ? rate * quantity : amount;
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: amount,
            line: i,
          });
          accruedAmount += newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
        }
        if (
          pharmaProcessing == NONRETURNABLE &&
          mfgProcessing == NONRETURNABLE
        ) {
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: 0,
            line: i,
          });
        }

        if (pharmaProcessing == RETURNABLE) {
          let amount = newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
          amount = amount === 0 ? rate * quantity : amount;
          log.emergency("returnable line: ", { i, amount });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: amount,
            line: i,
          });
          returnableAmount += newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
        }
      }
      if (returnableFeeRate) {
        const serviceFeeAmount = +returnableAmount * +returnableFeeRate;
        log.debug("addBillProcessingFee values", {
          returnableFeeRate,
          serviceFeeAmount,
          returnableAmount,
        });
        let returnableServiceFeeIndex = newVBRec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "item",
          value: RETURNABLESERVICEFEEITEM,
        });
        if (returnableServiceFeeIndex != -1) {
          newVBRec.removeLine({
            sublistId: "item",
            line: returnableServiceFeeIndex,
          });
          const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
          newVBRec.insertLine({ sublistId: "item", line: lastIndex });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: RETURNABLESERVICEFEEITEM,
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
        } else {
          const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
          newVBRec.insertLine({ sublistId: "item", line: lastIndex });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: RETURNABLESERVICEFEEITEM,
            line: lastIndex,
          });

          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
        }
      }
      if (accruedAmount > 0) {
        let accruedItemIndex = newVBRec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "item",
          value: ACCRUEDPURCHASEITEM,
        });
        if (accruedItemIndex != -1) {
          newVBRec.removeLine({
            sublistId: "item",
            line: accruedItemIndex,
          });
          const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
          newVBRec.insertLine({ sublistId: "item", line: lastIndex });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: ACCRUEDPURCHASEITEM,
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
        } else {
          const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
          newVBRec.insertLine({ sublistId: "item", line: lastIndex });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: ACCRUEDPURCHASEITEM,
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
          newVBRec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
        }
      }
      return newVBRec.save({ ignoreMandatoryFields: true });
    } catch (e) {
      log.error("createServiceItem", e.message);
    }
  }

  /**
   * Update the mfgprocessing/pharmaprocessing
   * @param {string}options.type - The type of transaction
   * @param {number}options.id - transaction Id
   * @param {string}options.pharmaProcessing - Pharma processing
   * @param {string}options.mfgProcessing - MFG processing
   * @param {string} options.IRSId - Item Return Scan Id
   */
  function updateProcessing(options) {
    log.audit("updateProcessing params", options);
    let { type, id, IRSId, pharmaProcessing, mfgProcessing } = options;
    try {
      const tranRec = record.load({
        type: type,
        id: id,
      });
      if (type === record.Type.VENDOR_BILL) {
        let newVBRec = removeVBLine({
          finalPaymentSchedule: tranRec.getValue("custbody_kodpaymentsched"),
          vbRec: tranRec,
        });
        const ACCRUEDPURCHASEITEM = 916;
        const RETURNABLE = 2;
        const NONRETURNABLE = 1;
        const RETURNABLESERVICEFEEITEM = 882;

        let returnableAmount = 0;
        const returnableFeeRate =
          newVBRec.getValue("custbody_rxrs_returnable_fee") / 100;
        let accruedAmount = 0;
        try {
          for (let i = 0; i < newVBRec.getLineCount("item"); i++) {
            const mfgProcessing = newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_rxrs_mfg_processing",
              line: i,
            });
            const pharmaProcessing = newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_rxrs_pharma_processing",
              line: i,
            });
            let quantity = newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: i,
            });
            let rate = newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "rate",
              line: i,
            });
            log.debug("processing", {
              line: i,
              pharma: pharmaProcessing,
              mfg: mfgProcessing,
            });
            if (
              pharmaProcessing == NONRETURNABLE &&
              mfgProcessing == RETURNABLE
            ) {
              let amount = newVBRec.getSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: i,
              });
              amount = amount === 0 ? rate * quantity : amount;
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: amount,
                line: i,
              });
              accruedAmount += newVBRec.getSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: i,
              });
            }
            if (
              pharmaProcessing == NONRETURNABLE &&
              mfgProcessing == NONRETURNABLE
            ) {
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: 0,
                line: i,
              });
            }

            if (pharmaProcessing == RETURNABLE) {
              let amount = newVBRec.getSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: i,
              });
              amount = amount === 0 ? rate * quantity : amount;
              log.emergency("returnable line: ", { i, amount });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: amount,
                line: i,
              });
              returnableAmount += newVBRec.getSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: i,
              });
            }
          }
          if (returnableFeeRate) {
            const serviceFeeAmount = +returnableAmount * +returnableFeeRate;
            log.debug("addBillProcessingFee values", {
              returnableFeeRate,
              serviceFeeAmount,
              returnableAmount,
            });
            let returnableServiceFeeIndex = newVBRec.findSublistLineWithValue({
              sublistId: "item",
              fieldId: "item",
              value: RETURNABLESERVICEFEEITEM,
            });
            if (returnableServiceFeeIndex != -1) {
              newVBRec.removeLine({
                sublistId: "item",
                line: returnableServiceFeeIndex,
              });
              const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
              newVBRec.insertLine({ sublistId: "item", line: lastIndex });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                value: RETURNABLESERVICEFEEITEM,
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: -Math.abs(serviceFeeAmount),
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: -Math.abs(serviceFeeAmount),
                line: lastIndex,
              });
            } else {
              const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
              newVBRec.insertLine({ sublistId: "item", line: lastIndex });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                value: RETURNABLESERVICEFEEITEM,
                line: lastIndex,
              });

              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: -Math.abs(serviceFeeAmount),
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: -Math.abs(serviceFeeAmount),
                line: lastIndex,
              });
            }
          }
          if (accruedAmount > 0) {
            let accruedItemIndex = newVBRec.findSublistLineWithValue({
              sublistId: "item",
              fieldId: "item",
              value: ACCRUEDPURCHASEITEM,
            });
            if (accruedItemIndex != -1) {
              newVBRec.removeLine({
                sublistId: "item",
                line: accruedItemIndex,
              });
              const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
              newVBRec.insertLine({ sublistId: "item", line: lastIndex });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                value: ACCRUEDPURCHASEITEM,
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: -Math.abs(accruedAmount),
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: -Math.abs(accruedAmount),
                line: lastIndex,
              });
            } else {
              const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
              newVBRec.insertLine({ sublistId: "item", line: lastIndex });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                value: ACCRUEDPURCHASEITEM,
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: -Math.abs(accruedAmount),
                line: lastIndex,
              });
              newVBRec.setSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: -Math.abs(accruedAmount),
                line: lastIndex,
              });
            }
          }
        } catch (e) {
          log.error("update service item", e.message);
        }
        return newVBRec.save({ ignoreMandatoryFields: true });
      } else {
        return tranRec.save({
          ignoreMandatoryFields: true,
        });
      }
    } catch (e) {
      log.error("updateProcessing", e.message);
    }
  }

  /**
   * Add service fee item in the bill
   * @param {object} options.vbRecId vendor bill Rec
   * @param {string} options.rclId return cover letter Id
   * @param {number} options.nonReturnableFeeAmount return non-returnable fee amount
   */
  function addBillProcessingFee(options) {
    log.audit("addBillProcessingFee", options);
    let { rclId, vbRecId } = options;
    try {
      const newVBRec = record.load({
        type: record.Type.VENDOR_BILL,
        id: vbRecId,
      });
      log.emergency("addBillProcessingFee", newVBRec);
      const ACCRUEDPURCHASEITEM = 916;
      const RETURNABLE = 2;
      const NONRETURNABLE = 1;
      const RETURNABLESERVICEFEEITEM = 882;

      let returnableAmount = 0;
      const returnableFeeRate =
        newVBRec.getValue("custbody_rxrs_returnable_fee") / 100;
      let accruedAmount = 0;
      try {
        for (let i = 0; i < newVBRec.getLineCount("item"); i++) {
          const mfgProcessing = newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_rxrs_mfg_processing",
            line: i,
          });
          const pharmaProcessing = newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_rxrs_pharma_processing",
            line: i,
          });
          let quantity = newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          let rate = newVBRec.getSublistValue({
            sublistId: "item",
            fieldId: "rate",
            line: i,
          });
          log.debug("processing", {
            line: i,
            pharma: pharmaProcessing,
            mfg: mfgProcessing,
          });
          if (
            pharmaProcessing == NONRETURNABLE &&
            mfgProcessing == RETURNABLE
          ) {
            let amount = newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "amount",
              line: i,
            });
            amount = amount === 0 ? rate * quantity : amount;
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: amount,
              line: i,
            });
            accruedAmount += newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "amount",
              line: i,
            });
          }
          if (
            pharmaProcessing == NONRETURNABLE &&
            mfgProcessing == NONRETURNABLE
          ) {
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "rate",
              value: 0,
              line: i,
            });
          }

          if (pharmaProcessing == RETURNABLE) {
            let amount = newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "amount",
              line: i,
            });
            amount = amount === 0 ? rate * quantity : amount;
            log.emergency("returnable line: ", { i, amount });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: amount,
              line: i,
            });
            returnableAmount += newVBRec.getSublistValue({
              sublistId: "item",
              fieldId: "amount",
              line: i,
            });
          }
        }
        if (returnableFeeRate) {
          const serviceFeeAmount = +returnableAmount * +returnableFeeRate;
          log.debug("addBillProcessingFee values", {
            returnableFeeRate,
            serviceFeeAmount,
            returnableAmount,
          });
          let returnableServiceFeeIndex = newVBRec.findSublistLineWithValue({
            sublistId: "item",
            fieldId: "item",
            value: RETURNABLESERVICEFEEITEM,
          });
          if (returnableServiceFeeIndex != -1) {
            newVBRec.removeLine({
              sublistId: "item",
              line: returnableServiceFeeIndex,
            });
            const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
            newVBRec.insertLine({ sublistId: "item", line: lastIndex });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "item",
              value: RETURNABLESERVICEFEEITEM,
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: -Math.abs(serviceFeeAmount),
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "rate",
              value: -Math.abs(serviceFeeAmount),
              line: lastIndex,
            });
          } else {
            const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
            newVBRec.insertLine({ sublistId: "item", line: lastIndex });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "item",
              value: RETURNABLESERVICEFEEITEM,
              line: lastIndex,
            });

            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "rate",
              value: -Math.abs(serviceFeeAmount),
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: -Math.abs(serviceFeeAmount),
              line: lastIndex,
            });
          }
        }
        if (accruedAmount > 0) {
          let accruedItemIndex = newVBRec.findSublistLineWithValue({
            sublistId: "item",
            fieldId: "item",
            value: ACCRUEDPURCHASEITEM,
          });
          if (accruedItemIndex != -1) {
            newVBRec.removeLine({
              sublistId: "item",
              line: accruedItemIndex,
            });
            const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
            newVBRec.insertLine({ sublistId: "item", line: lastIndex });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "item",
              value: ACCRUEDPURCHASEITEM,
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: -Math.abs(accruedAmount),
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "rate",
              value: -Math.abs(accruedAmount),
              line: lastIndex,
            });
          } else {
            const lastIndex = newVBRec.getLineCount({ sublistId: "item" });
            newVBRec.insertLine({ sublistId: "item", line: lastIndex });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "item",
              value: ACCRUEDPURCHASEITEM,
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: -Math.abs(accruedAmount),
              line: lastIndex,
            });
            newVBRec.setSublistValue({
              sublistId: "item",
              fieldId: "rate",
              value: -Math.abs(accruedAmount),
              line: lastIndex,
            });
          }
        }
        return newVBRec.save({ ignoreMandatoryFields: true });
      } catch (e) {
        log.error("createServiceItem", e.message);
      }
    } catch (e) {
      log.error("addBillProcessingFee", e.message);
    }
  }

  /**
   * Get bill id based on payment sche and master return id
   * @param {string} options.paymentId
   * @param {string} options.masterReturnId
   * @return {string|null} return bill internal id
   */
  function getBillId(options) {
    log.debug("getBillId", options);
    let { paymentId, masterReturnId } = options;
    try {
      let billId;
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["custbody_kodpaymentsched", "anyof", paymentId],
          "AND",
          ["custbody_kd_master_return_id", "anyof", masterReturnId],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          ["type", "anyof", "VendBill"],
        ],
      });
      const searchResultCount = transactionSearchObj.runPaged().count;
      if (searchResultCount === 0) return null;
      transactionSearchObj.run().each(function (result) {
        billId = result.id;
      });
      return billId;
    } catch (e) {
      log.error("getBillId", e.message);
    }
  }

  /**
   * Get all bill based on master return id
   * @param {string} masterReturnId
   * @return {array|null} return bill internal ids
   */
  function getAllBills(masterReturnId) {
    log.audit("getAllBills", masterReturnId);
    try {
      let billIds = [];
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["custbody_kd_master_return_id", "anyof", masterReturnId],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          ["type", "anyof", "VendBill"],
        ],
      });
      const searchResultCount = transactionSearchObj.runPaged().count;
      if (searchResultCount === 0) return null;
      transactionSearchObj.run().each(function (result) {
        billIds.push(result.id);
        return true;
      });
      return billIds;
    } catch (e) {
      log.error("getBillId", e.message);
    }
  }

  /**
     * Remove the line for an speicific payment schedule
     * @param {number}options.finalPaymentSchedule
     * @param {object}options.vbRec

     */
  function removeVBLine(options) {
    let { finalPaymentSchedule, vbRec } = options;
    log.audit("removeVBLine", finalPaymentSchedule);
    let lineCount = vbRec.getLineCount("item");
    //  log.audit("lineCount", lineCount);
    if (lineCount === 1) {
      return vbRec.id;
    }
    try {
      for (let i = 0; i < lineCount; i++) {
        let paymentSched = vbRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_kd_pymt_sched",
          line: i,
        });
        // log.audit("VB Line info ", { i, paymentSched, finalPaymentSchedule });
        if (paymentSched == finalPaymentSchedule) continue;
        // log.audit("removing Line " + i, paymentSched);
        vbRec.removeLine({
          sublistId: "item",
          line: i,
        });
      }
    } catch (e) {
      log.error("removeVBLine", {
        paymentSched: finalPaymentSchedule,
        error: e.message,
      });
      removeVBLine(options);
    }
    return vbRec;
  }

  /**
   * Delete Transaction
   * @param options.type Transaction Type
   * @param options.id Transaction ID
   */
  function deleteTransaction(options) {
    let { type, id } = options;
    try {
      return record.delete({
        type: type,
        id: id,
      });
    } catch (e) {
      log.error("deleteTransaction", e.message);
    }
  }

  /**
   * Set adjustment fee item to the vbRec in Standard mode
   * @param {object} options.vbRec
   * @param {number} options.adjustmentAmount
   * @param {number} options.irsId
   * @param {number} options.lastIndex
   */
  function setAdjustmentFee(options) {
    log.audit("setAdjustmentFee", options);
    let { vbRec, adjustmentAmount, irsId, lastIndex } = options;
    const ADJUSTMENTITEM = 917;
    try {
      vbRec.insertLine({ sublistId: "item", line: lastIndex });
      vbRec.setSublistValue({
        sublistId: "item",
        fieldId: "item",
        value: ADJUSTMENTITEM,
        line: lastIndex,
      });

      vbRec.setSublistValue({
        sublistId: "item",
        fieldId: "rate",
        value: -Math.abs(adjustmentAmount),
        line: lastIndex,
      });
      vbRec.setSublistValue({
        sublistId: "item",
        fieldId: "custcol_rsrs_itemscan_link",
        value: irsId,
        line: lastIndex,
      });
      return vbRec;
    } catch (e) {
      log.error("setAdjustmentFee", e.message);
    }
  }

  /**
   * Add accrued purchase item
   * @param {object}options.vbRec
   * @param {string}options.ACCRUEDPURCHASEITEM
   * @param {string}options.lastIndex
   * @param {number}options.accruedAmount
   */
  function addAccruedPurchaseItem(options) {
    log.audit("addAccruedPurchaseItem", options);
    let { vbRec, ACCRUEDPURCHASEITEM, lastIndex, accruedAmount } = options;
    try {
      let accruedItemIndex = vbRec.findSublistLineWithValue({
        sublistId: "item",
        fieldId: "item",
        value: ACCRUEDPURCHASEITEM,
      });
      if (accruedItemIndex != -1) {
        vbRec.removeLine({
          sublistId: "item",
          line: accruedItemIndex,
        });
        // const lastIndex = vbRec.getLineCount({ sublistId: "item" });
        vbRec.insertLine({ sublistId: "item", line: lastIndex });
        vbRec.setSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: ACCRUEDPURCHASEITEM,
          line: lastIndex,
        });
        vbRec.setSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: -Math.abs(accruedAmount),
          line: lastIndex,
        });
        vbRec.setSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: -Math.abs(accruedAmount),
          line: lastIndex,
        });
      } else {
        //  const lastIndex = rec.getLineCount({ sublistId: "item" });
        vbRec.insertLine({ sublistId: "item", line: lastIndex });
        vbRec.setSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: ACCRUEDPURCHASEITEM,
          line: lastIndex,
        });
        vbRec.setSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: -Math.abs(accruedAmount),
          line: lastIndex,
        });
        vbRec.setSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: -Math.abs(accruedAmount),
          line: lastIndex,
        });
      }
      return vbRec;
    } catch (e) {
      log.error("addAccruedPurchaseItem", e.message);
    }
  }

  return {
    createInventoryAdjustment: createInventoryAdjustment,
    createPO: createPO,
    checkIfTransAlreadyExist: checkIfTransAlreadyExist,
    createBill: createBill,
    deleteTransaction: deleteTransaction,
    addBillProcessingFee: addBillProcessingFee,
    removeVBLine: removeVBLine,
    getCertainField: getCertainField,
    updateProcessing: updateProcessing,
    getBillId: getBillId,
    getAllBills: getAllBills,
    setAdjustmentFee: setAdjustmentFee,
    addAccruedPurchaseItem: addAccruedPurchaseItem,
  };
});
