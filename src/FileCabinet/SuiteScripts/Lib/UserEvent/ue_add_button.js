/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/record",
  "N/search",
  "N/url",
  "../rxrs_util",
  "N/ui/serverWidget",
  "N/file",
], /**
 * @param{record} record
 * @param{search} search
 * @param{url} url
 * @param rxrs_util
 * @param serverWidget
 * @param file
 */ (record, search, url, rxrs_util, serverWidget, file) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (context) => {
    const rec = context.newRecord;
    const id = rec.id;

    try {
      context.form.clientScriptFileId = rxrs_util.getFileId("rxrs_cs_rr.js");
      let htmlFileId = rxrs_util.getFileId("SL_loading_html.html"); // HTML file for loading animation
      if (htmlFileId) {
        const dialogHtmlField = context.form.addField({
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
      if (context.type == "view") {
        switch (rec.type) {
          case "customsale_kod_returnrequest":
            const rrId = rec.getValue("tranid");

            const rrMrrId = rec.getValue("custbody_kd_master_return_id");
            const DEA222Fees = rec.getValue("custbody_kd_total_222_form_fee");
            let forVerificationSLUrl = url.resolveScript({
              scriptId: "customscript_sl_returnable_page",
              deploymentId: "customdeploy_sl_returnable_page",
              returnExternalUrl: false,
              params: {
                selectionType: "Returnable",
                rrId: id,
                tranId: rrId,
                mrrId: rrMrrId,
                rrType: rec.type,
              },
            });
            context.form.addButton({
              id: "custpage_verify",
              label: "Verify Items",
              functionName:
                'window.open("' +
                forVerificationSLUrl +
                ' ","_blank","width=1900,height=1200")',
            });
            break;
          case "custompurchase_returnrequestpo":
            const rrpoId = rec.id;
            const rrpoMrrId = rec.getValue("custbody_kd_master_return_id");
            const customer = rec.getValue("entity");
            const DEA222Feespo = rec.getValue("custbody_kd_total_222_form_fee");
            let forVerificationSLUrlPO = url.resolveScript({
              scriptId: "customscript_sl_returnable_page",
              deploymentId: "customdeploy_sl_returnable_page",
              returnExternalUrl: false,
              params: {
                selectionType: "Returnable",
                rrId: id,
                tranId: rrpoId,
                mrrId: rrpoMrrId,
                rrType: rec.type,
              },
            });
            let params = {
              url: forVerificationSLUrlPO,
              action: "verifyItems",
            };
            context.form.addButton({
              id: "custpage_verify",
              label: "Verify Items",
              functionName: `openSuitelet(${JSON.stringify(params)})`,
            });
            let approveParams = {
              mrrId: rrpoMrrId,
              rrId: rrpoId,
              entity: customer,
            };
            context.form.addButton({
              id: "custpage_approve",
              label: "Approve",
              functionName: `approveRR(${JSON.stringify(approveParams)})`,
            });
            break;

          case "customrecord_return_cover_letter":
            if (context.type === "create") return;
            let mrrId = rec.getValue("custrecord_rcl_master_return");
            let tranId = rec.getText("custrecord_rcl_master_return");
            let nonReturnableFeeAmount = 0;
            let returnableFeePercent = 0;
            nonReturnableFeeAmount = rec.getValue(
              "custrecord_rcl_non_returnable_fee_amt"
            );
            returnableFeePercent = rec.getValue(
              "custrecord_rcl_returnable_fee"
            );
            let returnableFee = 100 - parseFloat(returnableFeePercent);
            let rclSuiteletURL = url.resolveScript({
              scriptId: "customscript_sl_return_cover_letter",
              deploymentId: "customdeploy_sl_return_cover_letter",
              returnExternalUrl: false,
              params: {
                finalPaymentSched: false,
                mrrId: mrrId,
                tranId: tranId,
                isVerifyStaging: false,
                initialSplitpaymentPage: false,
                returnableFee: returnableFee,
                nonReturnableFeeAmount: nonReturnableFeeAmount,
                title: "In-Dated Inventory",
              },
            });

            context.form.addButton({
              id: "custpage_split_payment",
              label: "Split Payment",
              functionName:
                'window.open("' +
                rclSuiteletURL +
                ' ","_blank","width=1500,height=1200,left=100,top=1000")',
            });
            let printReturnSummaryURL = url.resolveScript({
              scriptId: "customscript_sl_print_return_summary",
              deploymentId: "customdeploy_sl_print_return_summary",
              returnExternalUrl: false,
              params: {
                rclId: rec.id,
              },
            });

            context.form.addButton({
              id: "custpage_print_return_summary",
              label: "Print Return Summary",
              functionName:
                'window.open("' + printReturnSummaryURL + ' ","_blank",)',
            });
            let printReturnCoverLetterURL = url.resolveScript({
              scriptId: "customscript_sl_print_return_cover_lette",
              deploymentId: "customdeploy_sl_print_return_cover_lette",
              returnExternalUrl: false,
              params: {
                rclId: rec.id,
              },
            });
            context.form.addButton({
              id: "custpage_print_cover_letter",
              label: "Print Return Cover Letter",
              functionName:
                'window.open("' + printReturnCoverLetterURL + ' ","_blank",)',
            });
            break;
        }
      }
    } catch (e) {
      log.error("beforeLoad", e.message);
    }
  };

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {};

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {};

  return { beforeLoad };
});
