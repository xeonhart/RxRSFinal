/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(["N/record", "../rxrs_transaction_lib"], /**
 * @param{record} record
 */ (record, rxrs_tran_lib) => {
  /**
   * Defines the WorkflowAction script trigger point.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
   * @param {string} scriptContext.type - Event type
   * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
   * @since 2016.1
   */
  const onAction = (scriptContext) => {
    try {
      const DENIEDCREDITITEMID = 924;
      const rec = scriptContext.newRecord;
      rxrs_tran_lib.createCreditMemoFromInv({
        invId: rec.id,
        amount: rec.getValue("total"),
        itemId: DENIEDCREDITITEMID,
        creditType: 1,
        invStatus: 6,
      });
    } catch (e) {
      log.error("onAction", e.message);
    }
  };

  return { onAction };
});
