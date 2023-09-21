/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/ui/serverWidget",
  "../rxrs_return_cover_letter_lib",
  "../rxrs_verify_staging_lib",
  "../rxrs_payment_sched_lib",
  "N/cache",
  "N/file",
  "N/record",
  "N/redirect",
], /**
 * @param{serverWidget} serverWidget
 * @param rxrs_rcl_util
 * @param rxrs_vs_util
 * @param rxrs_ps_util
 * @param cache
 * @param file
 * @param record
 * @param redirect
 */ (
  serverWidget,
  rxrs_rcl_util,
  rxrs_vs_util,
  rxrs_ps_util,
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
          "rxrs_cs_verify_staging.js"
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
      customize,
      returnList,
      createdPaymentId,
      initialSplitpaymentPage,
      returnableFee,
      nonReturnableFeeAmount,
    } = options.params;
    try {
      /**
       * Removes the final payment type
       */
      if (remove == true || remove == "true") {
        try {
          let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
            mrrId: mrrId,
            paymentSchedId: paymentId,
            isVerifyStaging: true,
            finalPaymentSched: finalPaymentSched,
          });
          updateFinalPayment({
            itemsReturnScan: itemsReturnScan,
            paymentId: 12,
            isUpdated: false,
          });
          /**
           * delete payment schedule assigned and set back to default payment type
           */
          rxrs_ps_util.deletePaymentSched(paymentId);
        } catch (e) {
          log.error("Removing Final Payment", e.message);
        }
        redirect.toRecord({
          id: rclId,
          type: "customrecord_return_cover_letter",
          isEditMode: false,
        });
      }
      /**
       * If user clicks a specific payment type
       */
      if (paymentSchedId) {
        /**
         * Hide unnecessary column
         */
        let sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnableManufacturer;
        sublistFields = rxrs_rcl_util.hideSublist({
          sublistToHide: rxrs_rcl_util.SUBLIST_TO_HIDE_IN_RCL,
          sublist: sublistFields,
          showSelect: customize == "true",
        });

        let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
          mrrId: mrrId,
          paymentSchedId: paymentSchedId,
          isVerifyStaging: true,
          finalPaymentSched: finalPaymentSched,
          returnableFee: returnableFee,
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
          title: `Payment Schedule: ${paymentSchedText}`,
        });
      } else {
        let sublistFields;
        if (finalPaymentSched != true || finalPaymentSched != "true") {
          /**
           * Hide Sublist and rename the verifiy column to Select
           */
          sublistFields = rxrs_vs_util.SUBLISTFIELDS.INDATED_INVENTORY;
          sublistFields = rxrs_rcl_util.hideSublist({
            sublistToHide: rxrs_rcl_util.SUBLIST_TO_HIDE_IN_RCL,
            sublist: sublistFields,
            showSelect: false,
          });
        } else {
          /**
           * Initial Sublist Display in the Return Cover Page
           */
          sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnCoverLetterFields;
        }

        if (returnList) {
          /**
           * If splitpayment in the line column of the suitelet is click the action below will execute
           */
          try {
            if (!createdPaymentId) return;
            returnList = JSON.parse(returnList);
            returnList = returnList.split("_");
            returnList.forEach((id) => {
              /**
               * Assign the payment Id selected by the user
               */
              record.submitFields.promise({
                type: "customrecord_cs_item_ret_scan",
                id: id,
                values: {
                  custrecord_final_payment_schedule: +createdPaymentId,
                  custrecord_payment_schedule_updated: true,
                },
                enablesourcing: true,
                ignoreMandatoryFields: true,
              });
            });
          } catch (e) {
            log.error("returnList", e.message);
          }
        }
        let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
          finalPaymentSched: finalPaymentSched,
          mrrId: mrrId,
          inDated: inDated,
          isVerifyStaging: isVerifyStaging,
          initialSplitpaymentPage: initialSplitpaymentPage,
          returnableFee: returnableFee,
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
      if (customize == "true") {
        /**
         * If the the user clicks the cuztomized button in the Split Payment page
         */
        form
          .addField({
            id: "custpage_payment_name",
            label: "Payment Name",
            type: serverWidget.FieldType.TEXT,
          })
          .updateDisplayType({
            displayType: "NORMAL",
          }).defaultValue = paymentSchedText;
        form
          .addField({
            id: "custpage_due_date",
            label: "Due Date",
            type: serverWidget.FieldType.DATE,
          })
          .updateDisplayType({
            displayType: "NORMAL",
          });

        form.addButton({
          id: "custpage_create_payment",
          label: "Create Payment",
          functionName: `createPayment(${mrrId})`,
        });
      }
      if (splitPayment == "true") {
        /**
         * If the user clicks the Split Payment action column
         */
        try {
          let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
            mrrId: mrrId,
            paymentSchedId: paymentId,
            isVerifyStaging: true,
            finalPaymentSched: finalPaymentSched,
            initialSplitpaymentPage: initialSplitpaymentPage,
          });
          updateFinalPayment({
            itemsReturnScan: itemsReturnScan,
            paymentId: +paymentId,
            isUpdated: true,
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

  /**
   * Update the final payment in the item return scan
   * @param {array}options.itemsReturnScan
   * @param {number}options.paymentId
   * @param {boolean}options.isUpdated - Update PAYMENT SCHEDULE UPDATED field
   */
  function updateFinalPayment(options) {
    try {
      let { itemsReturnScan, paymentId, isUpdated } = options;
      itemsReturnScan.forEach((item) => {
        record.submitFields.promise({
          type: "customrecord_cs_item_ret_scan",
          id: item.internalId,
          values: {
            custrecord_final_payment_schedule: +paymentId,
            custrecord_payment_schedule_updated: isUpdated,
          },
          enablesourcing: true,
          ignoreMandatoryFields: true,
        });
      });
    } catch (e) {
      log.error("updateFinalPayment", e.message);
    }
  }

  return { onRequest };
});
