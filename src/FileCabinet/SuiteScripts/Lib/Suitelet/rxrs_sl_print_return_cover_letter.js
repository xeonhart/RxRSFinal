/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/render",
  "N/https",
  "N/runtime",
  "../lib_template_handler",
  "../rxrs_util",
  "../rxrs_print_inventory_lib",
  "N/record",
  "N/file",
], /**
 * @param{render} render
 * @param https
 * @param{runtime} runtime
 * @param templateHandler
 * @param rxrsUtil
 * @param rxrs_PI_util
 * @param record
 * @param file
 */ (
  render,
  https,
  runtime,
  templateHandler,
  rxrsUtil,
  rxrs_PI_util,
  record,
  file
) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (context) => {
    try {
      const objRequest = context.request;
      let rclId = objRequest.parameters.rclId;

      const RETURNCOVERLETTER_TMPLT = "return_cover_letter_pdf.xml";
      const xmlFileId = rxrsUtil.getFileId(RETURNCOVERLETTER_TMPLT);

      let rec = record.load({
        type: "customrecord_return_cover_letter",
        id: rclId,
      });
      let date = rec.getText("created");

      date = date.split(" ");

      let data = {
        address: rec.getValue("custrecord_rcl_address"),
        custrecord_rcl_master_return: rec.getValue(
          "custrecord_rcl_master_return"
        ),
        custrecord_rcl_phone: rec.getValue("custrecord_rcl_phone"),
        custrecord_rcl_dea_number: rec.getValue("custrecord_rcl_dea_number"),
        custrecord_rcl_returnable_amount: rec.getValue(
          "custrecord_rcl_returnable_amount"
        ),
        custrecord_rcl_non_returnable_amount: rec.getValue(
          "custrecord_rcl_non_returnable_amount"
        ),
        custrecord_rcl_non_returnable_fee: rec.getValue(
          "custrecord_rcl_non_returnable_fee"
        ),
        custrecord_rcl_returnable_fee: rec.getValue(
          "custrecord_rcl_returnable_fee"
        ),
        custrecord_rcl_total_customer_credit_amt: rec.getValue(
          "custrecord_rcl_total_customer_credit_amt"
        ),
        custrecord_rcl_non_returnable_fee_amt: rec.getValue(
          "custrecord_rcl_non_returnable_fee_amt"
        ),
        custrecord_rcl_dea_222_form: rec.getValue(
          "custrecord_rcl_dea_222_form"
        ),
        custrecord_rcl_credit_discount: rec.getValue(
          "custrecord_rcl_credit_discount"
        ),
        custrecord_rcl_service_fee: rec.getValue("custrecord_rcl_service_fee"),
        created: date[0],
        custrecord_rcl_customer: rec.getText("custrecord_rcl_customer"),
        custrecord_rcl_customer_number: rec.getValue(
          "custrecord_rcl_customer_number"
        ),
      };
      data.payments = [];
      for (
        let i = 0;
        i <= rec.getLineCount("custpage_items_sublist") - 2;
        i++
      ) {
        let dateCreated = rec.getSublistValue({
          sublistId: "custpage_items_sublist",
          fieldId: "custpage_due_created",
          line: i,
        });
        dateCreated = dateCreated.split(" ");
        let paymentType = rec.getSublistValue({
          sublistId: "custpage_items_sublist",
          fieldId: "custpage_payment_type",
          line: i,
        });
        paymentType = getPaymentTypeName(paymentType);
        let amount = rec.getSublistValue({
          sublistId: "custpage_items_sublist",
          fieldId: "custpage_amount",
          line: i,
        });
        data.payments.push({
          tranid: paymentType,
          date: rxrsUtil.formatDate(dateCreated[0]),
          amount: amount,
        });
      }
      log.audit("data", data);

      const folderId = rxrsUtil.getFolderId("Return Summary PDF");
      //  log.debug("folderId", folderId);
      // log.audit("Folder ID", folderId);
      let fileName = `RetrunCoverLetter_${data.custrecord_rcl_master_return}.pdf`;
      const XMLCOntent = templateHandler.buildFileFromTemplate({
        templateID: xmlFileId,
        content: data,
        fileName: fileName,
        outputFolder: folderId,
      });

      let pdfFile = file.load(XMLCOntent);
      context.response.writeFile({
        file: pdfFile,
        isInline: true,
      });
    } catch (e) {
      context.response.write(e.message);
      log.error("onRequest", e.message);
    }
  };

  /**
   * Get the payment name using
   * @param {string} paymentLink
   */
  function getPaymentTypeName(paymentLink) {
    try {
      let paymentName;
      paymentName = paymentLink.split("&");
      paymentName = paymentName[4];
      paymentName = paymentName.split("=");
      paymentName = paymentName[1].replaceAll("+", " ");
      log.debug("paymentName", paymentName);
      return paymentName;
    } catch (e) {
      log.error("getPaymentTypeName", e.message);
    }
  }

  return { onRequest };
});
