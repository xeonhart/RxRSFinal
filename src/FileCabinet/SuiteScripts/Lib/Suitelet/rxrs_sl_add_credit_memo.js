/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/ui/serverWidget",
  "../rxrs_sl_custom_module",
  "../rxrs_transaction_lib",
  "../rxrs_verify_staging_lib",
  "../rxrs_util",
  "../rxrs_custom_rec_lib",
  "N/cache",
  "N/file",
  "N/record",
  "N/redirect",
], /**
 * @param{serverWidget} serverWidget
 * @param rxrs_sl_module
 * @param rxrs_tran_lib
 * @param cache
 * @param file
 * @param record
 * @param redirect
 */ (
  serverWidget,
  rxrs_sl_module,
  rxrs_tran_lib,
  rxrs_vb_lib,
  rxrs_util,
  rxrs_custom_rec,
  cache,
  file,
  record,
  redirect
) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (context) => {
    let params = context.request.parameters;
    log.debug("params", params);
    if (context.request.method === "GET") {
      try {
        let form = displayForms(params);
        context.response.writePage(form);
      } catch (e) {
        log.error("GET", e.message);
      }
    } else {
    }
  };

  /**
   * Creates a form, creates header fields, and then creates a sublist of
   * @param {object}params - parameters
   * @returns {object} form object is being returned.
   */
  function displayForms(params) {
    try {
      log.debug("objClientParams", params);
      let form = serverWidget.createForm({
        title: "Credit Memos",
        hideNavBar: true,
      });
      log.audit("form", form);

      form = createHeaderFields({ form, params });
      return form;
    } catch (e) {
      log.error("displayForms", e.message);
    }
  }

  /**
   * Create the header fields of the Suitelet
   * @param {object}options.form Object form
   * @param {object}options.params paramters passed to the suitelet
   * @return {*}
   */
  const createHeaderFields = (options) => {
    let form = options.form;

    let { invId, type, tranId, total } = options.params;

    log.debug("createHeaderFields", options.params);

    try {
      let htmlFileId = rxrs_sl_module.getFileId("SL_loading_html.html"); // HTML file for loading animation
      if (htmlFileId) {
        const dialogHtmlField = form.addField({
          id: "custpage_jqueryui_loading_dialog",
          type: serverWidget.FieldType.INLINEHTML,
          label: "Dialog HTML Field",
        });
        dialogHtmlField.defaultValue = file
          .load({
            id: htmlFileId,
          })
          .getContents();
      }
      let creditMemoId = rxrs_custom_rec.lookForExistingCreditMemoRec(invId);
      if (!creditMemoId) {
        const creditMemoNumberField = form.addField({
          id: "custpage_credit_memo_number",
          label: "Credit Memo Number",
          type: serverWidget.FieldType.TEXT,
        });
      } else {
        const creditMemoNumberField = form
          .addField({
            id: "custpage_credit_memo",
            label: "Credit Memo",
            type: serverWidget.FieldType.SELECT,
            source: "customrecord_creditmemo",
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE,
          });
        creditMemoNumberField.defaultValue = creditMemoId;
      }

      const packingSlipTotalField = form
        .addField({
          id: "custpage_packing_slip_total",
          label: "Packing Slip Total",
          type: serverWidget.FieldType.CURRENCY,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });
      packingSlipTotalField.defaultValue = total ? total : 0;
      const serviceFeeField = form.addField({
        id: "custpage_service_fee",
        label: "Service Fee (%)",
        type: serverWidget.FieldType.PERCENT,
      });
      const fileUpload = form.addField({
        id: "custpage_file_upload",
        label: "File Upload",
        type: serverWidget.FieldType.FILE,
      });
      const issuedOnField = form.addField({
        id: "custpage_issued_on",
        label: "Issued On",
        type: serverWidget.FieldType.DATE,
      });

      const amountField = form.addField({
        id: "custpage_amount",
        label: "Amount",
        type: serverWidget.FieldType.CURRENCY,
      });

      form.clientScriptFileId = rxrs_util.getFileId(
        "rxrs_cs_credit_memo_sl.js"
      );
      const invoiceId = (form
        .addField({
          id: "custpage_invoice_id",
          label: "Invoice Internal Id",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        }).defaultValue = invId);

      let numOfRes = " ";

      let soLine = rxrs_tran_lib.getSalesTransactionLine({
        type: type,
        id: invId,
      });
      if (soLine) {
        numOfRes = soLine.length ? soLine.length : 0;
      }
      let sublistFields = rxrs_sl_module.ADDCREDITMEMOSUBLIST;
      rxrs_sl_module.createSublist({
        form: form,
        sublistFields: sublistFields,
        creditMemoId: creditMemoId,
        value: soLine,
        clientScriptAdded: true,
        title: `Item: ${numOfRes}`,
      });
      form.addButton({
        id: "custpage_save",
        label: "Save",
        functionName: `createCreditMemo(${invId})`,
      });
      return form;
    } catch (e) {
      log.error("createHeaderFields", e.message);
    }
  };

  return { onRequest };
});
