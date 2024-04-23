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
  "N/redirect",
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
  file,
  redirect,
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
      const objRequest = context.request.parameters;
      log.audit("objRequest", objRequest);
      const f2rnRec = record.load({
        type: "customrecord_kd_222formrefnum", //'customsale_kod_returnrequest',
        id: objRequest.custscript_kd_2frn_id,
      });
      const masterRecText = f2rnRec.getText("custrecord_222_form_ref_mrr");
      const INVENTORY_REPORT_TMPLT = "kd_rxrs_2frn_pdfhtml_tmplt.xml";
      const xmlFileId = rxrsUtil.getFileId(INVENTORY_REPORT_TMPLT);
      log.audit("xmlFileId", xmlFileId);
      const folderId = rxrsUtil.getFolderId(masterRecText);
      log.audit("Folder ID", folderId);
      let fileName = `${f2rnRec.getValue("name")}.pdf`;
      const XMLCOntent = templateHandler.buildFileFromTemplate({
        templateID: xmlFileId,
        record: f2rnRec,
        fileName: fileName,
        outputFolder: folderId,
      });

      let pdfFile = file.load(XMLCOntent);
      log.audit("pdfFile", pdfFile);

      f2rnRec.setValue({
        fieldId: "custrecord_kd_2frn_222_form_pdf",
        value: XMLCOntent,
      });
      f2rnRec.setValue({
        fieldId: "custrecord_kd_2frn_for_222_regeneration",
        value: false,
      });
      f2rnRec.save({
        ignoreMandatoryFields: true,
      });

      redirect.toRecord({
        type: "customrecord_kd_222formrefnum",
        id: objRequest.custscript_kd_2frn_id,
      });
    } catch (e) {
      context.response.write(e.message);
      log.error("onRequest", e.message);
    }
  };

  return { onRequest };
});
