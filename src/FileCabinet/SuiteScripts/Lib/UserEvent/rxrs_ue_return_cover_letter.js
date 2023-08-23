/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/record",
  "N/search",
  "N/ui/serverWidget",
  "../rxrs_verify_staging_lib",
], /**
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 */ (record, search, serverWidget, rxrs_vs_util) => {
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
      let form = scriptContext.form;
      let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
        rrId: 10804,
        mrrId: 1181,
        inDated: true,
        isVerifyStaging: false,
      });
      rxrs_vs_util.createReturnableSublist({
        form: form,
        rrTranId: 10804,
        rrName: "RR0001814",
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

  return { beforeLoad, beforeSubmit, afterSubmit };
});
