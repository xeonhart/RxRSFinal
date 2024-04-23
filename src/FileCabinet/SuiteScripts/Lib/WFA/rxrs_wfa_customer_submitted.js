/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define([
  "N/record",
  "../rxrs_custom_rec_lib",
  "../rxrs_transaction_lib",
  "../rxrs_util",
] /**
 * @param{record} record
 */, (record, customrec, tranlib, util) => {
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
    const newRec = scriptContext.newRecord;
    const mrrId = newRec.id;
    // let itemRequest = customrec.getC2ItemRequested(mrrId);
    //
    // rrId = tranlib.getReturnRequestPerCategory({
    //   mrrId: mrrId,
    //   category: util.RRCATEGORY.C2,
    // });
    // if (!rrId) return;
    // if (itemRequest.length == 0) return;
    // itemRequest.forEach((id) => {
    //   record.submitFields({
    //     id: id,
    //     type: "customrecord_kod_mr_item_request",
    //     values: {
    //       custrecord_kd_rir_return_request: rrId,
    //     },
    //   });
    // });
    category = customrec.getItemRequested(mrrId);
    category.forEach((val) => {
      let rrId = tranlib.getReturnRequestPerCategory({
        mrrId: mrrId,
        category: val.value,
      });
      log.audit("RR Id");
      let itemRequest = customrec.getItemRequestedPerCategory({
        mrrId: mrrId,
        category: val.value,
      });
      log.audit("itemRequest", itemRequest);
      if (itemRequest.length == 0) return;
      itemRequest.forEach((id) => {
        record.submitFields({
          id: id,
          type: "customrecord_kod_mr_item_request",
          values: {
            custrecord_kd_rir_return_request: rrId,
          },
        });
      });
    });
  };

  return { onAction };
});
