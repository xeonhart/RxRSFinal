/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/record",
  "N/search",
  "N/url",
  "N/ui/serverWidget",
  "../rxrs_verify_staging_lib",
], /**
 * @param{record} record
 * @param{search} search
 * @param url
 * @param{serverWidget} serverWidget
 * @param rxrs_vs_util
 */ (record, search, url, serverWidget, rxrs_vs_util) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {
    try {
      if (scriptContext.type == "create") return;
      let rec = scriptContext.newRecord;
      let id = rec.id;
      let mrrId = rec.getValue("custrecord_rcl_master_return");
      let form = scriptContext.form;
      let tranName = rec.getText("custrecord_rcl_master_return");

      let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
        finalPaymentSched: true,
        mrrId: mrrId,
        rclId: rec.id,
        inDated: true,
        isVerifyStaging: false,
        mrrName: tranName,
      });
      rxrs_vs_util.createReturnableSublist({
        form: form,
        rrTranId: mrrId,
        rrName: tranName,
        sublistFields: rxrs_vs_util.SUBLISTFIELDS.returnCoverLetterFields,
        value: itemsReturnScan,
        isMainInDated: false,
        inDate: true,
        returnList: itemsReturnScan,
        title: `Payments`,
      });
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
  const beforeSubmit = (scriptContext) => {
    let nonReturnableFeeAmount = 0;
    const rec = scriptContext.newRecord;
    try {
      let mrrId = rec.getValue("custrecord_rcl_master_return");
      let nonReturnableFeePercent = rec.getValue(
        "custrecord_rcl_non_returnable_fee"
      );
      let nonReturnableAmount = +rxrs_vs_util.getMrrIRSTotalAmount({
        mrrId: mrrId,
        mfgProcessing: "1",
      });
      let returnableAmount = +rxrs_vs_util.getMrrIRSTotalAmount({
        mrrId: mrrId,
        mfgProcessing: "2",
      });
      nonReturnableFeePercent = parseFloat(nonReturnableFeePercent) / 100;
      log.audit("amount", {
        returnableAmount,
        nonReturnableAmount,
        nonReturnableFeePercent,
      });
      nonReturnableFeeAmount = nonReturnableAmount * nonReturnableFeePercent;
      rec.setValue({
        fieldId: "custrecord_rcl_returnable_amount",
        value: returnableAmount,
      });
      rec.setValue({
        fieldId: "custrecord_rcl_non_returnable_amount",
        value: nonReturnableAmount,
      });
      rec.setValue({
        fieldId: "custrecord_rcl_non_returnable_fee_amt",
        value: nonReturnableFeeAmount.toFixed(4),
      });
    } catch (e) {
      log.error("beforeSubmit", e.message);
    }
  };

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {};

  return { beforeLoad, beforeSubmit, afterSubmit };
});
