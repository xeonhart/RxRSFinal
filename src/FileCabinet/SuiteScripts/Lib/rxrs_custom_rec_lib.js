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
   * Get All CM based on the invoice internal Id
   * @param {string}invId
   */
  function getAllCM(invId) {
    let cmIds = [];
    try {
      const customrecord_creditmemoSearchObj = search.create({
        type: "customrecord_creditmemo",
        filters: [["custrecord_invoice_applied", "anyof", invId]],
        columns: [
          search.createColumn({
            name: "id",
            sort: search.Sort.ASC,
            label: "ID",
          }),
          search.createColumn({
            name: "custrecord_creditmemonum",
            label: "Credit Memo No.",
          }),
        ],
      });
      customrecord_creditmemoSearchObj.run().each(function (result) {
        cmIds.push({
          text: result.getValue({ name: "custrecord_creditmemonum" }),
          value: result.id,
        });
        return true;
      });
      return cmIds;
    } catch (e) {
      log.error("getAllCM", e.message);
    }
  }

  /**
   * CM Parent Info
   * @param options.forUpdate
   * @param options.forCreation
   */
  function createUpdateCM(options) {
    let response = {};
    try {
      log.audit("createUpdateCM", options);
      let obj = JSON.parse(options);
      let { forUpdate, forCreation } = obj;
      if (forUpdate.length > 0) {
        createCreditMemoLines({ cmLines: forUpdate });
      }
      if (forCreation.cmLines.length > 0) {
        const cmId = createCreditMemoRec(forCreation);

        if (cmId) {
          createCreditMemoLines({
            cmLines: forCreation.cmLines,
            cmParentId: cmId,
            isGovernment: forCreation.isGovernment,
            invId: forCreation.invoiceId,
          });
        }
        response.sucessMessage = "Successfully Created Credit Memo ID: " + cmId;
      }
    } catch (e) {
      log.error("createUpdateCM", e.message);
      return (response.error = "Error: " + e.message);
    }
    return response;
  }

  /**
   * Create Credit Memo Parent Record
   * @param  {string}options.cmId
   * @param {string} options.creditMemoNumber
   * @param  {number}options.amount
   * @param  {number}options.invoiceId
   * @param  {string}options.dateIssued
   * @param options.saveWithoutReconcilingItems
   * @param {string}options.serviceFee
   * @param  {string}options.fileId
   * @param {number}options.packingSlipAmount
   * @param {boolean}options.isGovernment
   * @param options.cmLines
   *
   * @return string id of the parent credit memo
   */
  function createCreditMemoRec(options) {
    log.audit("createCreditMemoRec", options);

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
        packingSlipAmount,
        isGovernment,
      } = options;

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

      packingSlipAmount &&
        cmRec.setValue({
          fieldId: "custrecord_gross_credit_received",
          value: packingSlipAmount / 0.15,
        });
      isGovernment &&
        cmRec.setValue({
          fieldId: "custrecord_is_government",
          value: isGovernment,
        });
      creditMemoNumber &&
        cmRec.setValue({
          fieldId: "custrecord_creditmemonum",
          value: creditMemoNumber,
        });
      packingSlipAmount &&
        cmRec.setValue({
          fieldId: "custrecord_packing_slip_amount",
          value: packingSlipAmount,
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
            custbody_invoice_status: 2, // Open Credit
          },
        });
      }
      return cmId;
    } catch (e) {
      log.error("createCreditMemoRec", e.message);
    }
  }

  /**
   * Remove and delete credit memo including payment
   * @param {string} options.creditMemoId
   * @param {string} options.invId
   */
  function deleteCreditMemo(options) {
    log.audit("deleteCreditMemo", options);
    let { creditMemoId, invId } = JSON.parse(options);
    try {
      let updatedInvId = tranlib.removeCMFromInvoiceLine(options);
      if (updatedInvId) {
        let cmId = tranlib.checkIfTransAlreadyExist({
          searchType: "CustCred",
          creditMemoId: creditMemoId,
        });

        if (cmId) {
          let deletedCM = record.delete({
            type: record.Type.CREDIT_MEMO,
            id: cmId,
          });
          log.audit("deleted native cm", deletedCM);
          if (deletedCM) {
            let isCMLineDeleted = deleteCMLine(creditMemoId);
            log.audit("is cmLine Deleted", isCMLineDeleted);
            if (isCMLineDeleted) {
              log.audit("deleting credit memo");
              record.delete({
                type: "customrecord_creditmemo",
                id: creditMemoId,
              });
              let cmIds = getAllCM(invId);
              log.audit("cmIds", cmIds.length);
              if (cmIds.length == 0) {
                record.submitFields({
                  type: record.Type.INVOICE,
                  id: invId,
                  values: {
                    custbody_invoice_status: 1,
                  },
                });
              }
            }
          }
        }
      }
    } catch (e) {
      log.error("deleteCreditMemo", e.message);
    }
  }

  /**
   * Get the all invoice CM total amount
   * @param {string}invId
   */
  function getALlCMTotalAmount(invId) {
    log.audit("getALlCMTotalAmount", invId);
    try {
      let total = 0;
      const customrecord_creditmemoSearchObj = search.create({
        type: "customrecord_creditmemo",
        filters: [["custrecord_invoice_applied", "anyof", invId]],
        columns: [
          search.createColumn({
            name: "custrecord_amount",
            summary: "SUM",
            label: "Amount",
          }),
        ],
      });

      customrecord_creditmemoSearchObj.run().each(function (result) {
        total = result.getValue({
          name: "custrecord_amount",
          summary: "SUM",
        });
      });
      log.audit("getALlCMTotalAmount", total);
      return total;
    } catch (e) {
      log.error("getALlCMTotalAmount", e.message);
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
   * @param {array}cmId
   */
  function getCMLineCountWithAmount(cmId) {
    log.audit("getCMLineCountWithAmount", cmId);
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
   * Get the CM lineCount that has the payment applied
   * @param {string}creditMemoId
   */
  function deleteCMLine(creditMemoId) {
    log.audit("deleteCMLine", creditMemoId);
    let count;
    try {
      const customrecord_credit_memo_line_appliedSearchObj = search.create({
        type: "customrecord_credit_memo_line_applied",
        filters: [["custrecord_credit_memo_id", "anyof", creditMemoId]],
        columns: [
          search.createColumn({
            name: "internalid",
            label: "Internal ID",
          }),
        ],
      });
      let searchResultCount =
        customrecord_credit_memo_line_appliedSearchObj.runPaged().count;
      customrecord_credit_memo_line_appliedSearchObj
        .run()
        .each(function (result) {
          let id = result.getValue({
            name: "internalid",
          });
          log.debug("deleting cm line id", id);
          record.delete({
            type: "customrecord_credit_memo_line_applied",
            id: id,
          });

          searchResultCount -= 1;
          log.audit("searchResultCount", searchResultCount);
          return true;
        });
      if (searchResultCount == 0) {
        return true;
      }
    } catch (e) {
      log.error("deleteCMLine", e.message);
    }
  }

  /**
   * Create credit memo child
   * @param {string} options.invId
   * @param {boolean} options.isGovernemt
   * @param{[]} options.cmLines
   * @param{string} options.cmParentId
   */
  function createCreditMemoLines(options) {
    log.audit("createCreditMemoLines", options);
    let { cmLines, invId, cmParentId, isGovernment } = options;

    try {
      cmLines.forEach((cm) => {
        let {
          lineUniqueKey,
          NDC,
          unitPrice,
          amountApplied,
          cmLineId,
          isSelected,
          cmId,
          invId,
        } = cm;

        if (cmLineId != "") {
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
          reloadCM(cmId);
          tranlib.updateTranLineCM({
            cmLineId: cmLineId,
            invId: invId,
            lineuniquekey: lineUniqueKey,
            amount: amountApplied,
            unitPrice: unitPrice,
          });
        } else {
          const cmChildRec = record.create({
            type: "customrecord_credit_memo_line_applied",
            isDynamic: true,
          });
          try {
            log.audit("cmParentId", cmParentId);
            cmChildRec.setValue({
              fieldId: "custrecord_credit_memo_id",
              value: cmParentId,
            });
            cmChildRec.setValue({
              fieldId: "custrecord_government",
              value: isGovernment,
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
            if (isGovernment == true) {
              cmChildRec.setValue({
                fieldId: "custrecord_cmline_gross_amount",
                value: amountApplied / 0.15,
              });
              cmChildRec.setValue({
                fieldId: "custrecord_cmline_gross_unit_price",
                value: unitPrice / 0.15,
              });
            }
          } catch (e) {
            log.error("createCreditMemoLines setting values", {
              error: e.message,
              value: cm,
            });
          }
          let cmChildId = cmChildRec.save({ ignoreMandatoryFields: true });

          if (cmChildId) {
            reloadCM(cmParentId);
            tranlib.updateTranLineCM({
              cmLineId: cmChildId,
              invId: invId,
              lineuniquekey: lineUniqueKey,
              amount: amountApplied,
              unitPrice: unitPrice,
            });
          }
        }
      });
    } catch (e) {
      log.error("createCreditMemoLines", { error: e.message, params: options });
      return "createCreditMemoLines " + e.message;
    }
  }

  /**
   * Reload CM
   * @param cmId
   */
  function reloadCM(cmId) {
    log.audit("Reload Cm", cmId);
    try {
      const curRec = record.load({
        type: "customrecord_creditmemo",
        id: cmId,
        isDynamic: true,
      });

      return curRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("reloadCM", e.message);
    }
  }

  return {
    lookForExistingCreditMemoRec,
    createCreditMemoRec,
    deleteCreditMemo,
    getCMParentInfo,
    getCMLineCountWithAmount,
    createUpdateCM,
    getAllCM,
    getALlCMTotalAmount,
  };
});
