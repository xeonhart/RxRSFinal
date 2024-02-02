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
 * @param rxrs_vb_lib
 * @param rxrs_util
 * @param rxrs_custom_rec
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
        title: "Payment Info",
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

    let { invoiceId, type, lineCount, total, creditMemoId } = options.params;
    let cmParentInfo;
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
      const creditMemoNumberField = form.addField({
        id: "custpage_credit_memo",
        label: "Credit Memo",
        type: serverWidget.FieldType.SELECT,
      });
      const amountField = form.addField({
        id: "custpage_amount",
        label: "Payment Amount",
        type: serverWidget.FieldType.CURRENCY,
      });
      amountField.isMandatory = true;
      const paymentDateField = form.addField({
        id: "custpage_payment_date_received",
        label: "Date Payment Received",
        type: serverWidget.FieldType.DATE,
      });

      const cmNumOfLinesWithAmountAppliedField = form
        .addField({
          id: "custpage_num_of_lines_with_amt",
          label: "Inv Line count with Amount Applied",
          type: serverWidget.FieldType.INTEGER,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
      paymentDateField.isMandatory = true;
      const cmPaymentAmountField = form
        .addField({
          id: "custpage_cm_amount",
          label: "CM Amount",
          type: serverWidget.FieldType.CURRENCY,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });
      const cmNumOfLinesField = form
        .addField({
          id: "custpage_num_of_lines",
          label: "Total Inv Line count",
          type: serverWidget.FieldType.INTEGER,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
      const totalCMAmountField = form
        .addField({
          id: "custpage_total_cm_amount",
          label: "CM Total Amount",
          type: serverWidget.FieldType.CURRENCY,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
      totalCMAmountField.defaultValue =
        rxrs_custom_rec.getALlCMTotalAmount(invoiceId);

      const cmIds = rxrs_custom_rec.getAllCM(invoiceId);
      log.emergency("cmIds", cmIds);
      let cmInternalIds = [];
      if (cmIds.length > 0) {
        creditMemoNumberField.addSelectOption({
          value: " ",
          text: " ",
        });

        for (let i = 0; i < cmIds.length; i++) {
          cmInternalIds.push(cmIds[i].value);
          if (!isEmpty(creditMemoId) && cmIds[i].value == creditMemoId) {
            creditMemoNumberField.addSelectOption({
              value: cmIds[i].value,
              text: cmIds[i].text,
              isSelected: true,
            });
          } else {
            creditMemoNumberField.addSelectOption({
              value: cmIds[i].value,
              text: cmIds[i].text,
            });
          }
        }
      }

      if (!isEmpty(creditMemoId)) {
        let existingPaymentInfo = rxrs_tran_lib.checkExistingPayment({
          invId: invoiceId,
          cmId: creditMemoId,
        });
        log.emergency("existingPaymentInfo", existingPaymentInfo);
        cmParentInfo = rxrs_custom_rec.getCMParentInfo(creditMemoId);

        if (!isEmpty(existingPaymentInfo)) {
          const paymentIdField = form
            .addField({
              id: "custpage_payment_id",
              label: "Payment Id",
              type: serverWidget.FieldType.SELECT,
              source: "transaction",
            })
            .updateDisplayType({
              displayType: serverWidget.FieldDisplayType.INLINE,
            });
          paymentIdField.defaultValue = existingPaymentInfo.id;
          amountField.defaultValue = existingPaymentInfo.amount;
          paymentDateField.defaultValue = new Date(existingPaymentInfo.date);
        }

        if (cmParentInfo.total) {
          cmPaymentAmountField.defaultValue = cmParentInfo.total;
        }
      }
      cmNumOfLinesWithAmountAppliedField.defaultValue =
        rxrs_tran_lib.getInvoiceLineCountWithCmPayment(invoiceId);
      if (lineCount) {
        cmNumOfLinesField.defaultValue = lineCount;
      }
      form.clientScriptFileId = rxrs_util.getFileId(
        "rxrs_cs_custom_function.js"
      );

      const invoiceIdField = (form
        .addField({
          id: "custpage_invoice_id",
          label: "Invoice Internal Id",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        }).defaultValue = invoiceId);

      form.addButton({
        id: "custpage_save",
        label: "Save",
        functionName: `addPayment(${JSON.stringify(cmInternalIds)})`,
      });

      return form;
    } catch (e) {
      log.error("createHeaderFields", e.message);
    }
  };

  function isEmpty(stValue) {
    return (
      stValue === "" ||
      stValue == null ||
      false ||
      (stValue.constructor === Array && stValue.length == 0) ||
      (stValue.constructor === Object &&
        (function (v) {
          for (var k in v) return false;
          return true;
        })(stValue))
    );
  }

  return { onRequest };
});
