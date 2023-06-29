/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/runtime", "N/url", "N/currentRecord"], /**
 * @param{runtime} runtime
 * @param{url} url
 * @param currentRecord
 */ function (runtime, url, currentRecord) {
  let suitelet = null;

  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(scriptContext) {
    suitelet = scriptContext.currentRecord;
    let arrTemp = window.location.href.split("?");
    let urlParams = new URLSearchParams(arrTemp[1]);


  }

  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(scriptContext) {
    console.log("fieldChanged");
    console.log(scriptContext.fieldId);
    console.log(scriptContext.sublistId);
    let params = {};
    try {
      if (scriptContext.fieldId == "custpage_radio") {
        let selection = suitelet.getValue("custpage_radio");
        console.log(selection);
        params.selectionType = selection;
        params.isMainReturnable = true;
        let stSuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_returnable_page",
          deploymentId: "customdeploy_sl_returnable_page",
          returnExternalUrl: false,
          params: params,
        });
        window.ischanged = false;
        window.open(stSuiteletUrl, "_self");
      }

    } catch (e) {
      console.error("fieldChanged", e.message);
    }
  }



  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,


  };
});
