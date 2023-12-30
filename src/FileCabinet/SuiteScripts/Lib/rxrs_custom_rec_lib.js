/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 * @param{search} search
 */ (record, search) => {
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
        createCreditMemoLines({ cmParentId: cmId, cmLines: cmLines });
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
        createCreditMemoLines({ cmParentId: cmId, cmLines: cmLines });
      }
      return cmId;
    } catch (e) {
      log.error("createCreditMemoRec", e.message);
    }
  }

  /**
   * Create credit memo child
   * @param {string} options.cmParentId
   * @param{[]} options.cmLines
   */
  function createCreditMemoLines(options) {
    log.audit("createCreditMemoLines", options);
    let { cmParentId, cmLines } = options;
    try {
      if (!cmParentId) throw "No Credit Memo Parent is created";

      cmLines.forEach((cm) => {
        const cmChildRec = record.create({
          type: "customrecord_credit_memo_line_applied",
          isDynamic: true,
        });
        let { lineUniqueKey, NDC, unitPrice, amountApplied } = cm;
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
        cmChildRec.save({ ignoreMandatoryFields: true });
      });
    } catch (e) {
      log.error("createCreditMemoLines", e.message);
    }
  }

  return { lookForExistingCreditMemoRec, createCreditMemoRec };
});
