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
    "./Lib/rxrs_print_inventory_lib",
    "N/record",
    "N/file"
], /**
 * @param{render} render
 * @param https
 * @param{runtime} runtime
 * @param templateHandler
 * @param rxrsUtil
 * @param rxrs_PI_util
 * @param record
 */ (render,https, runtime, templateHandler, rxrsUtil,rxrs_PI_util, record,file) => {
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
            let retList = JSON.parse(objRequest.parameters.returnList)
            retList = retList.split("_")
            const rrId = parseInt(objRequest.parameters.rrId);
            const rrType = objRequest.parameters.rrType
            const manufId = objRequest.parameters.manufId
            const returnList = objRequest.parameters.returnList
            const inventoryStatus = objRequest.parameters.inventoryStatus
            const INVENTORY_REPORT_TMPLT = "inventory_report_pdf.xml";
            const xmlFileId = rxrsUtil.getFileId(INVENTORY_REPORT_TMPLT);



           let data = rxrs_PI_util.getInventoryLocationObject({
                rrId:rrId ,
                rrType: rrType,
                manufId: manufId,
                returnList: retList,
                inventoryStatus: inventoryStatus
            })

            log.error("Print Inventory",data)
            const folderId = -15;
            let fileName = `InventoryReport_${rrId}.pdf`;
            const XMLCOntent = templateHandler.buildFileFromTemplate({
                templateID: xmlFileId,
                content: data,
                fileName: fileName,
                outputFolder: folderId,
            });

            let pdfFile = file.load(XMLCOntent)
            context.response.writeFile({
                file: pdfFile,
                isInline: true
            })

        } catch (e) {
            context.response.write(e.message)
            log.error("onRequest", e.message);
        }
    };

    return { onRequest };
});
