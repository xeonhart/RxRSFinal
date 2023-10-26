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
          mfgProcessing &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_kod_mfgprocessing",
              value: mfgProcessing,
            });
          pharmaProcessing &&
            poRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_kod_rqstprocesing",
              value: pharmaProcessing,
            });
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

      if (vbRec2) {
        let rclId = rxrs_rcl_lib.getRCLRecord(mrrId);
        vbId = addBillProcessingFee({
          rclId: rclId,
          vbRec: vbRec2,
        });
        return vbId;
      }
    } catch (e) {
      log.error("createBill", e.message);
      //  return { error: e.message };
    }
  }

  /**
   * Add service fee item in the bill
   * @param {object} options.vbRec vendor bill Rec
   * @param {string} options.rclId return cover letter Id
   * @param {number} options.nonReturnableFeeAmount return non-returnable fee amount
   */
  function addBillProcessingFee(options) {
    const RETURNABLESERVICEFEEITEM = 882;
    log.audit("addBillProcessingFee", options);
    let { rclId, vbRec, nonReturnableFeeAmount } = options;
    try {
      const rclRec = record.load({
        type: "customrecord_return_cover_letter",
        id: rclId,
      });
      let vbId = vbRec.save({
        ignoreMandatoryFields: true,
      });
      let vbRec2 = record.load({
        type: record.Type.VENDOR_BILL,
        id: vbId,
        isDynamic: true,
      });
      const returnableFeeRate =
        rclRec.getValue("custrecord_rcl_returnable_fee") / 100;
      const vbAmount = vbRec2.getValue("usertotal");
      log.debug("addBillProcessingFee values", { returnableFeeRate });
      if (!returnableFeeRate) {
        return vbRec2.id;
      } else {
        const serviceFeeAmount = +vbAmount * +returnableFeeRate;
        log.debug("addBillProcessingFee values", {
          returnableFeeRate,
          vbAmount,
          serviceFeeAmount,
        });
        try {
          vbRec2.selectNewLine({
            sublistId: "item",
          });

          vbRec2.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",

            value: RETURNABLESERVICEFEEITEM,
          });
          vbRec2.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: 1,
          });
          vbRec2.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: serviceFeeAmount * -1,
          });
          vbRec2.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: serviceFeeAmount * -1,
          });
          vbRec2.commitLine("item");
        } catch (e) {
          log.error("addBillProcessingFee setting line", e.message);
        }
        return vbRec2.save({ ignoreMandatoryFields: true });
      }
    } catch (e) {
      log.error("addBillProcessingFee", e.message);
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
    // let id = vbRec.save({
    //   ignoreMandatoryFields: true,
    // });
    // log.emergency("Id", id);
    // if (id) {
    //   return id;
    // }
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

  return {
    createInventoryAdjustment: createInventoryAdjustment,
    createPO: createPO,
    checkIfTransAlreadyExist: checkIfTransAlreadyExist,
    createBill: createBill,
    deleteTransaction: deleteTransaction,
    addBillProcessingFee: addBillProcessingFee,
    removeVBLine: removeVBLine,
  };
});
