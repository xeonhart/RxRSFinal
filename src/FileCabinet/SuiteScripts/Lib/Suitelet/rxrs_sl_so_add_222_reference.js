/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/ui/serverWidget",
  "../rxrs_sl_custom_module",
  "../rxrs_transaction_lib",
  "../rxrs_verify_staging_lib",
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
      //   let {
      //     customer,
      //     subsidiary,
      //     action,
      //     department,
      //     location,
      //     itemsInfo,
      //     invoiceId,
      //     Class,
      //   } = params;
      //   try {
      //     log.audit("POST", params);
      //     if (action == "createInvoice") {
      //       let returnObj = serp_bill_lib.createInvoice({
      //         customer: customer,
      //         Class: Class,
      //         subsidiary: subsidiary,
      //         location: location,
      //         department: department,
      //         itemsInfo: itemsInfo,
      //       });
      //       let { invId, error } = returnObj;
      //       if (invId) {
      //         context.response.writeLine("INVOICE:" + invId);
      //       }
      //       if (error) {
      //         context.response.writeLine("ERROR:" + error);
      //       }
      //     }
      //     if (action == "updateInvoice") {
      //       let returnObj = serp_bill_lib.createInvoice({
      //         invoiceId: invoiceId,
      //         Class: Class,
      //         subsidiary: subsidiary,
      //         location: location,
      //         department: department,
      //         itemsInfo: itemsInfo,
      //       });
      //       let { invId, error } = returnObj;
      //       if (invId) {
      //         serp_bill_lib.updateBill(invId);
      //         context.response.writeLine("INVOICE:" + invId);
      //       }
      //       if (error) {
      //         context.response.writeLine("ERROR:" + error);
      //       }
      //     }
      //   } catch (e) {
      //     context.response.writeLine("ERROR:" + e.message);
      //     log.error("creating invoice", e.message);
      //   }
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
        title: "Add 222 Form Refrence",
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

    let { soId, type, tranId } = options.params;

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
      const Form222Field = form.addField({
        id: "custpage_form222_field",
        label: "222 Form Number",
        type: serverWidget.FieldType.TEXT,
      });
      let soLink = rxrs_vb_lib.generateRedirectLink({
        type: "salesorder",
        id: soId,
      });
      const soIdField = form
        .addField({
          id: "custpage_sales_order_link",
          label: "Sales Order",
          type: serverWidget.FieldType.TEXT,
        })
        .updateDisplayType({
          displayType: "INLINE",
        });

      soIdField.defaultValue = `<a href =${soLink}>${tranId}<a>`;
      form.addButton({
        id: "custpage_save",
        label: "Save",
        functionName: `updateSO222FormReference(${soId})`,
      });

      form.addButton({
        id: "custpage_apply",
        label: "Apply 222 Form Number",
        functionName: `update222FormReference()`,
      });

      let soLine = rxrs_tran_lib.getItemTransactionLine({
        type: type,
        id: soId,
      });
      log.debug("soLine", soLine);
      let numOfRes = " ";
      if (soLine) {
        numOfRes = soLine.length ? soLine.length : 0;
      }

      let sublistFields = rxrs_sl_module.SOFORM222SUBLIST;
      rxrs_sl_module.createSublist({
        form: form,
        sublistFields: sublistFields,
        value: soLine,
        title: `Item: ${numOfRes}`,
      });
      return form;
    } catch (e) {
      log.error("createHeaderFields", e.message);
    }
  };

  return { onRequest };
});
