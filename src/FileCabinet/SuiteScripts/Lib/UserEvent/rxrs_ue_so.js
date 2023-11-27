/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/ui/serverWidget"], (serverWidget) => {
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
      log.debug(context.type);
      if (context.type === "view" || context.type === "edit") {
        const curRec = context.newRecord;
        const status = curRec.getText("custbody_orderstatus");
        log.debug("status", status);
        if (status) {
          var hideFld = context.form.addField({
            id: "custpage_hide_buttons",
            label: "not shown - hidden",
            type: serverWidget.FieldType.INLINEHTML,
          });
          var scr = ""; //ext-element-22
          // scr += `jQuery("#ext-element-21").text("${status}");`;
          //$('div.total-title').text('test');
          scr += `jQuery('div.uir-record-status').text('${status}');`;
          hideFld.defaultValue =
            "<script>jQuery(function($){require([], function(){" +
            scr +
            "})})</script>";
        }
      }
    } catch (e) {
      log.error("beforeLoad", e.message);
    }
  };

  return { beforeLoad };
});
