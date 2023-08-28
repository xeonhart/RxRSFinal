/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/ui/serverWidget",
  "../rxrs_return_cover_letter_lib",
  "../rxrs_verify_staging_lib",
  "N/cache",
  "N/file",
  "N/record",
  "N/redirect",
], /**
 * @param{serverWidget} serverWidget
 * @param rxrs_rcl_util
 * @param rxrs_vs_util
 * @param cache
 * @param file
 * @param record
 * @param redirect
 */ (
  serverWidget,
  rxrs_rcl_util,
  rxrs_vs_util,
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
    if (context.request.method === "GET") {
      try {
        let form = displayForms(params);
        context.response.writePage(form);
      } catch (e) {
        log.error("GET", e.message);
      }
    }
  };

  /**
   * Creates a form, adds a client script to it, creates header fields, and then creates a sublist of
   * @param params - parameters
   * @returns The form object is being returned.
   */
  function displayForms(params) {
    try {
      log.debug("objClientParams", params);
      let form = serverWidget.createForm({
        title: "Return Cover Letter",
        hideNavBar: true,
      });
      try {
        form.clientScriptFileId = rxrs_vs_util.getFileId(
          "rxrs_cs_validate_return.js"
        );
      } catch (e) {
        log.error("setting client script Id", e.message);
      }
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
    log.debug("createHeaderFields", options.params);
    let {
      finalPaymentSched,
      mrrId,
      inDated,
      isVerifyStaging,
      tranId,
      paymentSchedId,
      paymentSchedText,
      paymentId,
      splitPayment,
      remove,
      title,
      rclId,
    } = options.params;
    try {
      if (remove == true || remove == "true") {
        try {
          let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
            mrrId: mrrId,
            paymentSchedId: paymentId,
            inDated: true,
            isVerifyStaging: true,
            finalPaymentSched: finalPaymentSched,
          });
          log.error("itemReturnScan", itemsReturnScan);
          itemsReturnScan.forEach((item) => {
            record.submitFields.promise({
              type: "customrecord_cs_item_ret_scan",
              id: item.internalId,
              values: {
                custrecord_final_payment_schedule: 12,
                custrecord_payment_schedule_updated: false,
              },
              enablesourcing: true,
              ignoreMandatoryFields: true,
            });
          });
        } catch (e) {
          log.error("Removing Final Payment", e.message);
        }
        redirect.toRecord({
          id: rclId,
          type: "customrecord_return_cover_letter",
          isEditMode: false,
        });
      }
      if (paymentSchedId) {
        let sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnableManufacturer;

        let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
          mrrId: mrrId,
          paymentSchedId: paymentSchedId,
          inDated: true,
          isVerifyStaging: true,
          finalPaymentSched: finalPaymentSched,
        });
        log.emergency("itemsReturnScan", itemsReturnScan);
        rxrs_vs_util.createReturnableSublist({
          form: form,
          rrTranId: mrrId,
          rrName: tranId,
          sublistFields: sublistFields,
          value: itemsReturnScan,
          isMainInDated: false,
          inDate: true,
          returnList: itemsReturnScan,
          title: `Payment Schedule: ${paymentSchedText}`,
        });
      } else {
        let sublistFields;
        if (finalPaymentSched != true || finalPaymentSched != "true") {
          sublistFields = rxrs_vs_util.SUBLISTFIELDS.INDATED_INVENTORY;
        } else {
          sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnCoverLetterFields;
        }
        let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
          finalPaymentSched: finalPaymentSched,
          mrrId: mrrId,
          inDated: inDated,
          isVerifyStaging: isVerifyStaging,
        });
        rxrs_vs_util.createReturnableSublist({
          form: form,
          rrTranId: mrrId,
          rrName: tranId,
          sublistFields: sublistFields,
          value: itemsReturnScan,
          isMainInDated: false,
          inDate: true,
          returnList: itemsReturnScan,
          title: `In-Dated Inventory`,
        });
      }
      if (splitPayment == "true") {
        try {
          let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
            mrrId: mrrId,
            paymentSchedId: paymentId,
            inDated: true,
            isVerifyStaging: true,
            finalPaymentSched: finalPaymentSched,
          });
          itemsReturnScan.forEach((item) => {
            record.submitFields.promise({
              type: "customrecord_cs_item_ret_scan",
              id: item.internalId,
              values: {
                custrecord_final_payment_schedule: +paymentId,
                custrecord_payment_schedule_updated: true,
              },
              enablesourcing: true,
              ignoreMandatoryFields: true,
            });
          });
        } catch (e) {
          log.error("spliting payment", e.message);
        }
      }
      return form;
    } catch (e) {
      log.error("createHeaderFields", e.message);
    }
  };

  return { onRequest };
});
