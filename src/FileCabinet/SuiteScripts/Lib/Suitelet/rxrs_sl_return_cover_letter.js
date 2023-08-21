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
        hideNavBar: false,
      });
      form.clientScriptFileId = rxrs_vs_util.getFileId(
        "rxrs_cs_return_cover_letter.js"
      );

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
    try {
      let form = options.form;
      log.debug("createHeaderFields", options.params);
      let {
        rrId,
        tranid,
        mrrId,
        paymentSchedId,
        paymentSchedText,
        DEA222Fees,
      } = options.params;
      if (paymentSchedId) {
        let sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnableManufacturer;
        let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
          rrId: rrId,
          paymentSchedId: paymentSchedId,
          inDated: true,
          isVerifyStaging: true,
        });
        rxrs_vs_util.createReturnableSublist({
          form: form,
          rrTranId: rrId,
          rrName: tranid,
          sublistFields: sublistFields,
          value: itemsReturnScan,
          isMainInDated: false,
          inDate: true,
          returnList: itemsReturnScan,
          title: `Return Request ${tranid}: Payment Schedule: ${paymentSchedText}`,
        });
      } else {
        form.addFieldGroup({
          id: "rcl",
          label: "Return Cover Letter",
        });
        const today = new Date();
        let date =
          today.getFullYear() +
          "-" +
          (today.getMonth() + 1) +
          "-" +
          today.getDate();
        let time =
          today.getHours() +
          ":" +
          today.getMinutes() +
          ":" +
          today.getSeconds();
        let dateTime = date + " " + time;
        form
          .addField({
            id: "custpage_date",
            label: "Date",
            type: serverWidget.FieldType.TEXT,
            container: "rcl",
          })
          .updateDisplayType({
            displayType: "INLINE",
          }).defaultValue = dateTime;
        let customerInfo = rxrs_rcl_util.getCustomerInfo(
          options.params.customer
        );
        let customerInfoText = "";
        customerInfoText += customerInfo.name + "\n";
        customerInfoText += customerInfo.addr1 + "\n";
        customerInfoText +=
          customerInfo.state + " " + customerInfo.zipcode + "\n";
        customerInfoText += "CONTACT: " + customerInfo.contact + "\n";
        customerInfoText += "PHONE: " + customerInfo.phone + "\n";
        customerInfoText += "FAX: " + customerInfo.fax + "\n";

        log.audit("customerInfoText", customerInfoText);
        form
          .addField({
            id: "custpage_customer",
            label: "CUSTOMER",
            type: serverWidget.FieldType.TEXTAREA,
            container: "rcl",
          })
          .updateDisplayType({
            displayType: "INLINE",
          }).defaultValue = customerInfoText;

        form
          .addField({
            id: "custpage_return_num",
            label: "Return No.",
            type: serverWidget.FieldType.TEXT,
            container: "rcl",
          })
          .updateDisplayType({
            displayType: "INLINE",
          }).defaultValue = options.params.rrId;
        form
          .addField({
            id: "custpage_customer_num",
            label: "Customer No.",
            type: serverWidget.FieldType.TEXT,
            container: "rcl",
          })
          .updateDisplayType({
            displayType: "INLINE",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.STARTROW,
          }).defaultValue = options.params.customer;

        form
          .addField({
            id: "custpage_dea_num",
            label: "DEA No.",
            type: serverWidget.FieldType.TEXT,
            container: "rcl",
          })
          .updateDisplayType({
            displayType: "INLINE",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.STARTROW,
          }).defaultValue = customerInfo.dea;
        /**
         * Cover letter Line items
         */
        form.addFieldGroup({
          id: "cover_letter_line_item",
          label: "Cover Letter Line Item",
        });
        const returnableAndNonReturnableAmount =
          rxrs_rcl_util.getItemReturnScanTotal({
            rrId: rrId,
          });
        log.audit(
          "returnableAndNonReturnableAmount",
          returnableAndNonReturnableAmount
        );
        form
          .addField({
            id: "custpage_returnable_amount",
            label: "Returnable Amount",
            type: serverWidget.FieldType.CURRENCY,
            container: "cover_letter_line_item",
          })
          .updateDisplayType({
            displayType: "INLINE",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE,
          }).defaultValue = returnableAndNonReturnableAmount.returnableAmount
          ? returnableAndNonReturnableAmount.returnableAmount
          : 0;

        form
          .addField({
            id: "custpage_non_returnable_amount",
            label: "Non-Returnable Amount",
            type: serverWidget.FieldType.CURRENCY,
            container: "cover_letter_line_item",
          })
          .updateDisplayType({
            displayType: "INLINE",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE,
          }).defaultValue = returnableAndNonReturnableAmount.nonReturnableAmount
          ? returnableAndNonReturnableAmount.nonReturnableAmount
          : 0;

        form
          .addField({
            id: "custpage_dea_222_form",
            label: "DEA 222 Form",
            type: serverWidget.FieldType.CURRENCY,
            container: "cover_letter_line_item",
          })
          .updateDisplayType({
            displayType: "INLINE",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE,
          }).defaultValue = DEA222Fees;

        form
          .addField({
            id: "custpage_credit_discount",
            label: "Credit/Discount",
            type: serverWidget.FieldType.TEXT,
            container: "cover_letter_line_item",
          })
          .updateDisplayType({
            displayType: "NORMAL",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE,
          });
        form
          .addField({
            id: "custpage_service_fee",
            label: "Service Fee",
            type: serverWidget.FieldType.TEXT,
            container: "cover_letter_line_item",
          })
          .updateDisplayType({
            displayType: "NORMAL",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE,
          });

        let customerTotalAmount =
          rxrs_rcl_util.getCustomerTotalCreditAmount(rrId);
        log.audit("customer Total amount ", customerTotalAmount);
        form
          .addField({
            id: "custpage_total_customer_credit_amount",
            label: "Total Customer Credit Amount",
            type: serverWidget.FieldType.CURRENCY,
            container: "cover_letter_line_item",
          })
          .updateDisplayType({
            displayType: "INLINE",
          })
          .updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE,
          }).defaultValue = customerTotalAmount ? customerTotalAmount : 0;

        let itemsReturnScan = rxrs_vs_util.getReturnableItemScan({
          rrId: rrId,
          mrrId: mrrId,
          inDated: true,
          isVerifyStaging: false,
        });
        rxrs_vs_util.createReturnableSublist({
          form: form,
          rrTranId: rrId,
          rrName: tranid,
          sublistFields: rxrs_vs_util.SUBLISTFIELDS.returnCoverLetterFields,
          value: itemsReturnScan,
          isMainInDated: false,
          inDate: true,
          returnList: itemsReturnScan,
          title: `Payments`,
        });
      }
      return form;
    } catch (e) {
      log.error("createHeaderFields", e.message);
    }
  };

  return { onRequest };
});
