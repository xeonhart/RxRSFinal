/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search", "./rxrs_transaction_lib"], /**
 * @param{record} record
 * @param{search} search
 */ (record, search, tranlib) => {
  /**
   * Look if there is already a custom credit memo created for the invoice
   * @param invId
   * @return {*} credit memo Id
   */
  function lookForExistingCreditMemoRec(invId) {
    try {
      let creditMemoId;
      const customrecord_creditmemoSearchObj = search.create({
        type: "customrecord_creditmemo",
        filters: [["custrecord_invoice_applied", "anyof", invId]],
        columns: [
          search.createColumn({
            name: "id",
            sort: search.Sort.ASC,
            label: "ID",
          }),
          search.createColumn({ name: "scriptid", label: "Script ID" }),
        ],
      });

      customrecord_creditmemoSearchObj.run().each(function (result) {
        creditMemoId = result.id;
      });
      return creditMemoId;
    } catch (e) {
      log.error("lookForExistingCreditMemoRec", e.message);
    }
  }

  /**
   * Create Credit Memo Parent Record
   * @param  options.cmId
   * @param  options.creditMemoNumber
   * @param  options.amount
   * @param  options.invoiceId
   * @param  options.dateIssued
   * @param options.saveWithoutReconcilingItems
   * @param options.serviceFee
   * @param  options.fileId
   * @param options.cmLines
   * @return string id of the parent credit memo
   */
  function createCreditMemoRec(options) {
    let obj = JSON.parse(options);
    let response = {};
    log.audit("createCreditMemoRec", obj);

    try {
      let {
        creditMemoNumber,
        amount,
        serviceFee,
        saveWithoutReconcilingItems,
        invoiceId,
        dateIssued,
        fileId,
        cmId,
        cmLines,
      } = obj;
      log.audit("cmId", cmId);
      if (cmId) {
        log.audit("if");
        createCreditMemoLines({
          invId: invoiceId,
          cmParentId: cmId,
          cmLines: cmLines,
        });
      } else {
        log.audit("else");
        const cmRec = record.create({
          type: "customrecord_creditmemo",
          isDynamic: true,
        });
        if (!invoiceId) throw "No invoice Id. This is a required fields";
        invoiceId &&
          cmRec.setValue({
            fieldId: "custrecord_invoice_applied",
            value: invoiceId,
          });
        creditMemoNumber &&
          cmRec.setValue({
            fieldId: "custrecord_creditmemonum",
            value: creditMemoNumber,
          });
        amount &&
          cmRec.setValue({
            fieldId: "custrecord_amount",
            value: amount,
          });
        serviceFee &&
          cmRec.setValue({
            fieldId: "custrecord_servicefee",
            value: serviceFee,
          });
        dateIssued &&
          cmRec.setValue({
            fieldId: "custrecord_issuedon",
            value: new Date(dateIssued),
          });
        fileId &&
          cmRec.setValue({
            fieldId: "custrecord_fileupload",
            value: fileId,
          });
        saveWithoutReconcilingItems &&
          cmRec.setValue({
            fieldId: "custrecord_savewithoutreconitem",
            value: saveWithoutReconcilingItems,
          });
        cmId = cmRec.save({
          ignoreMandatoryFields: true,
        });
        if (cmId) {
          record.submitFields({
            type: record.Type.INVOICE,
            id: invoiceId,
            values: {
              custbody_credit_memos: cmId,
              custbody_invoice_status: 2, // Open Credit
            },
          });
          createCreditMemoLines({
            invId: invoiceId,
            cmParentId: cmId,
            cmLines: cmLines,
          });
        }
        response.successMessage =
          "Successfully Created Credit Memo Id: " + cmId;
      }

      return response;
    } catch (e) {
      log.error("createCreditMemoRec", e.message);
      return (response.error = e.message);
    }
  }

  /**
   * Get Parent CM details
   * @param {string} cmId
   * @return Parent Credit Memo Details
   */
  function getCMParentInfo(cmId) {
    let result = {};
    let total = 0;
    let lineCount = 0;
    try {
      const customrecord_credit_memo_line_appliedSearchObj = search.create({
        type: "customrecord_credit_memo_line_applied",
        filters: [["custrecord_credit_memo_id", "anyof", cmId]],
        columns: [
          search.createColumn({
            name: "custrecord_cm_amount_applied",
            summary: "SUM",
            label: "Amount Applied",
          }),
          search.createColumn({
            name: "internalid",
            summary: "COUNT",
            label: "Internal ID",
          }),
        ],
      });
      customrecord_credit_memo_line_appliedSearchObj
        .run()
        .each(function (result) {
          total = result.getValue({
            name: "custrecord_cm_amount_applied",
            summary: "SUM",
          });
          lineCount = result.getValue({
            name: "internalid",
            summary: "COUNT",
          });
        });
      result.total = total;
      result.lineCount = lineCount;
      const parentRecord = record.load({
        type: "customrecord_creditmemo",
        id: cmId,
      });

      result.dateIssued = parentRecord.getText("custrecord_issuedon");
      result.serviceFee = parentRecord.getValue("custrecord_servicefee");
      result.file = parentRecord.getValue("custrecord_fileupload");

      return result;
    } catch (e) {
      log.error("getCMParentInfo", e.message);
    }
  }

  /**
   * Get the CM lineCount that has the payment applied
   * @param {string}cmId
   */
  function getCMLineCountWithAmount(cmId) {
    try {
      let count = 0;
      const customrecord_credit_memo_line_appliedSearchObj = search.create({
        type: "customrecord_credit_memo_line_applied",
        filters: [
          ["custrecord_credit_memo_id", "anyof", cmId],
          "AND",
          ["custrecord_cm_amount_applied", "isnotempty", ""],
          "AND",
          ["custrecord_cm_amount_applied", "notequalto", "0.00"],
        ],
        columns: [
          search.createColumn({
            name: "internalid",
            summary: "COUNT",
            label: "Internal ID",
          }),
        ],
      });
      customrecord_credit_memo_line_appliedSearchObj
        .run()
        .each(function (result) {
          count = result.getValue({
            name: "internalid",
            summary: "COUNT",
          });
          return true;
        });
      return count;
    } catch (e) {
      log.error("getCMLineCountWithAmount", e.message);
    }
  }

  /**
   * Create credit memo child
   * @param {string} options.cmParentId
   * @param {string} options.invId
   * @param{[]} options.cmLines
   */
  function createCreditMemoLines(options) {
    log.audit("createCreditMemoLines", options);
    let { cmParentId, cmLines, invId } = options;

    try {
      if (!cmParentId) throw "No Credit Memo Parent is created";

      cmLines.forEach((cm) => {
        let { lineUniqueKey, NDC, unitPrice, amountApplied, cmLineId } = cm;

        if (cmLineId !== " ") {
          record.submitFields({
            type: "customrecord_credit_memo_line_applied",
            id: cmLineId,
            values: {
              custrecord_cm_amount_applied: amountApplied,
              custrecord_cm_unit_price: unitPrice,
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
        } else {
          const cmChildRec = record.create({
            type: "customrecord_credit_memo_line_applied",
            isDynamic: true,
          });
          try {
            cmChildRec.setValue({
              fieldId: "custrecord_credit_memo_id",
              value: cmParentId,
            });
            cmChildRec.setValue({
              fieldId: "custrecord_cm_lineuniquekey",
              value: lineUniqueKey,
            });
            cmChildRec.setValue({
              fieldId: "custrecord_cm_line_item",
              value: NDC,
            });
            cmChildRec.setValue({
              fieldId: "custrecord_cm_amount_applied",
              value: amountApplied,
            });
            cmChildRec.setValue({
              fieldId: "custrecord_cm_unit_price",
              value: unitPrice,
            });
          } catch (e) {
            log.error("createCreditMemoLines setting values", {
              error: e.message,
              value: cm,
            });
          }
          let cmChildId = cmChildRec.save({ ignoreMandatoryFields: true });

          if (cmChildId) {
            tranlib.updateTranLineCM({
              cmLineId: cmChildId,
              cmId: cmParentId,
              invId: invId,
              lineuniquekey: lineUniqueKey,
            });
          }
        }
      });
    } catch (e) {
      log.error("createCreditMemoLines", e.message);
      return "createCreditMemoLines " + e.message;
    }
  }

  return {
    lookForExistingCreditMemoRec,
    createCreditMemoRec,
    getCMParentInfo,
    getCMLineCountWithAmount,
  };
});
