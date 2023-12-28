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
   * @param {string} options.creditMemoNumber
   * @param {number} options.amount
   * @param {string} options.invoiceId
   * @param {string} options.dateIssued
   * @param {boolean} options.saveWithoutReconcilingItems
   * @param {string} options.serviceFee
   * @param {string} options.fileId
   * @return internal id of the parent credit memo
   */
  function createCreditMemoRec(options) {
    let {
      creditMemoNumber,
      amount,
      serviceFee,
      saveWithoutReconcilingItems,
      invoiceId,
      dateIssued,
      fileId,
    } = options;

    try {
      const cmRec = record.create({
        type: "customrecord_creditmemo",
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
      return cmRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("createCreditMemoRec", e.message);
    }
  }

  return { lookForExistingCreditMemoRec, createCreditMemoRec };
});
