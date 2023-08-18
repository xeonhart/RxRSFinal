/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */
/**
 * Author: James Gumapac
 * Date: 08/15/2023
 * Update:
 */
define(["N/record", "N/url"], /**
 * @param{record} record
 * @param{url} url
 */ (record, url) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (context) => {
    try {
      if (context.type == "view") {
        const rec = context.newRecord;
        const id = rec.id;
        const tranid = rec.getValue("tranid");
        const customer = rec.getValue("entity");
        const mrrId = rec.getValue("custbody_kd_master_return_id");
        let forVerificationSLUrl = url.resolveScript({
          scriptId: "customscript_sl_returnable_page",
          deploymentId: "customdeploy_sl_returnable_page",
          returnExternalUrl: false,
          params: {
            selectionType: "Returnable",
            rrId: id,
            tranid: tranid,
            mrrId: mrrId,
            rrType: rec.type,
          },
        });
        let output = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
        });
        let urlLink = `https://${output}${forVerificationSLUrl}`;
        context.form.addButton({
          id: "custpage_verify",
          label: "For Verification",
          functionName:
            'window.open("' + urlLink + ' ","_blank","width=1900,height=1200")',
        });
        let returnCoverLetterURL = url.resolveScript({
          scriptId: "customscript_sl_return_cover_letter",
          deploymentId: "customdeploy_sl_return_cover_letter",
          returnExternalUrl: false,
          params: {
            selectionType: "Returnable",
            rrId: id,
            tranid: tranid,
            mrrId: mrrId,
            rrType: rec.type,
            customer: customer,
          },
        });
        context.form.addButton({
          id: "custpage_return_cover_letter",
          label: "Return Cover Letter",
          functionName: 'window.open("' + returnCoverLetterURL + ' ","_blank")',
        });
      }
    } catch (e) {
      log.error("beforeLoad", e.message);
    }
  };

  return { beforeLoad };
});
