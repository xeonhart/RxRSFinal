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
  "../rxrs_transaction_lib",
  "../rxrs_return_cover_letter_lib",
], /**
 * @param{record} record
 * @param{search} search
 * @param{url} url
 * @param rxrs_util
 * @param serverWidget
 * @param file
 * @param tranlib
 */ (record, search, url, rxrs_util, serverWidget, file, tranlib, rclLib) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} context
   * @param {Record} context.newRecord - New record
   * @param {string} context.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} context.form - Current form
   * @param {ServletRequest} context.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (context) => {
    const rec = context.newRecord;
    const id = rec.id;
    let poId;
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
            let paramsRR = {
              url: forVerificationSLUrl,
              action: "verifyItems",
            };
            context.form.addButton({
              id: "custpage_verify",
              label: "Verify Items",
              functionName: `openSuitelet(${JSON.stringify(paramsRR)})`,
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
            let paramsRRPO = {
              url: forVerificationSLUrlPO,
              action: "verifyItems",
            };
            context.form.addButton({
              id: "custpage_verify",
              label: "Verify Items",
              functionName: `openSuitelet(${JSON.stringify(paramsRRPO)})`,
            });
            let approveParams = {
              mrrId: rrpoMrrId,
              rrId: rrpoId,
              entity: customer,
              action: "createPO",
            };

            poId = tranlib.checkIfTransAlreadyExist({
              mrrId: rrpoMrrId,
              searchType: "PurchOrd",
            });
            log.debug("POID", poId);
            let poRec;
            if (poId) {
              poRec = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: poId,
                isDynamic: true,
              });
              let returnRequestValues = poRec.getValue(
                "custbody_kd_return_request2"
              );
              log.debug(
                "poId",
                returnRequestValues.indexOf(JSON.stringify(rrpoId))
              );
              if (returnRequestValues.indexOf(JSON.stringify(rrpoId)) === -1) {
                context.form.addButton({
                  id: "custpage_approve",
                  label: "Approve",
                  functionName: `createTransaction(${JSON.stringify(
                    approveParams
                  )})`,
                });
              }
            } else {
              context.form.addButton({
                id: "custpage_approve",
                label: "Approve",
                functionName: `createTransaction(${JSON.stringify(
                  approveParams
                )})`,
              });
            }

            break;

          case "customrecord_return_cover_letter":
            if (context.type === "create") return;
            let mrrId = rec.getValue("custrecord_rcl_master_return");
            let tranId = rec.getText("custrecord_rcl_master_return");
            let entity = rec.getValue("custrecord_rcl_customer");
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
            let paramSplitPayment = {
              url: rclSuiteletURL,
              action: "splitPayment",
            };
            context.form.addButton({
              id: "custpage_split_payment",
              label: "Split Payment",
              functionName: `openSuitelet(${JSON.stringify(
                paramSplitPayment
              )})`,
            });

            let printReturnSummaryURL = url.resolveScript({
              scriptId: "customscript_sl_print_return_summary",
              deploymentId: "customdeploy_sl_print_return_summary",
              returnExternalUrl: false,
              params: {
                rclId: rec.id,
              },
            });
            let paramPrintReturnSummary = {
              url: printReturnSummaryURL,
            };
            context.form.addButton({
              id: "custpage_print_return_summary",
              label: "Print Return Summary",
              functionName: `openSuitelet(${JSON.stringify(
                paramPrintReturnSummary
              )})`,
            });

            /**
             * Create Print Return Cover Letter Button
             */

            let printReturnCoverLetterURL = url.resolveScript({
              scriptId: "customscript_sl_print_return_cover_lette",
              deploymentId: "customdeploy_sl_print_return_cover_lette",
              returnExternalUrl: false,
              params: {
                rclId: rec.id,
              },
            });
            let paramprintReturnCoverLetter = {
              url: printReturnCoverLetterURL,
            };
            context.form.addButton({
              id: "custpage_print_cover_letter",
              label: "Print Return Cover Letter",
              functionName: `openSuitelet(${JSON.stringify(
                paramprintReturnCoverLetter
              )})`,
            });

            /**
             * Create Bill Button
             */

            //Check if the purchase order is fully billed/Closed
            let isBilled = tranlib.checkIfTransAlreadyExist({
              mrrId: mrrId,
              searchType: "PurchOrd",
              status: "PurchOrd:G",
            });
            let isPOExist = tranlib.checkIfTransAlreadyExist({
              mrrId: mrrId,
              searchType: "PurchOrd",
            });
            log.debug("create Bill Button", { isPOExist, isBilled });

            if (isPOExist && !isBilled) {
              let createBillParams = {
                mrrId: mrrId,
                rclId: rec.id,
                poId: isPOExist,
                action: "createBill",
              };
              context.form.addButton({
                id: "custpage_create_bill",
                label: "Bill All Remaining",
                functionName: `createTransaction(${JSON.stringify(
                  createBillParams
                )})`,
              });
            }

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
