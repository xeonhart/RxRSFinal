/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/render",
  "N/https",
  "N/runtime",
  "./Lib/lib_template_handler",
  "./Lib/rxrs_util",
  "N/record",
], /**
 * @param{render} render
 * @param{runtime} runtime
 */ (render,https, runtime, templateHandler, rxrsUtil, record) => {
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
      const tagLabelId = parseInt(objRequest.parameters.recId);
      const TAG_LABEL_TEMPLATE = "taglabel_pdf.xml";
      const xmlFileId = rxrsUtil.getFileId(TAG_LABEL_TEMPLATE);
      let tagLabelRec = record.load({
        type: "customrecord_kd_taglabel",
        id: tagLabelId,
      });
      let data = {
        internalid: tagLabelId,
        custrecord_kd: tagLabelRec.getText("custrecord_kd"),
        custrecord_tagentity: tagLabelRec.getText("custrecord_tagentity"),
        custrecord_kd_mfgname : tagLabelRec.getText("custrecord_kd_mfgname"),
        custrecord_kd_putaway_loc: tagLabelRec.getText("custrecord_kd_putaway_loc"),
        custrecord_kd_mrr_link: tagLabelRec.getText("custrecord_kd_mrr_link"),
        custrecord_kd_mrr_date: tagLabelRec.getText("custrecord_kd_mrr_date"),
        custrecord_kd_tag_return_request: tagLabelRec.getText("custrecord_kd_tag_return_request")
      }
      log.debug("data",data)
      const folderId = -15;
      let fileName = `TAG_LABEL_${tagLabelId}`;
      const XMLCOntent = templateHandler.buildFileFromTemplate({
        templateID: xmlFileId,
        content: data,
        fileName: fileName,
        outputFolder: folderId,
      });
      context.response.sendRedirect({
        type: https.RedirectType.MEDIA_ITEM,
        identifier: XMLCOntent,
      });
    } catch (e) {
      log.error("onRequest", e.message);
    }
  };

  return { onRequest };
});
