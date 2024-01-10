/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(["N/currentRecord", "N/record", "N/search"], function (
  currentRecord,
  record,
  search
) {
  function PageInIt(context) {
    try {
      var currentRec = context.currentRecord;
      //Get Parent Sales Order ID from URL parameter
      var soId = GetParameterFromURL("parentsoid");

      if (soId) {
        //Set Parent Sales Order field values in Child SO
        currentRec.setValue("custbody_parent_so_number", soId);
        //Get Parent SO record field values
        var fieldLookUp = search.lookupFields({
          type: record.Type.SALES_ORDER,
          id: soId,
          columns: ["entity", "salesrep"],
        });
        if (fieldLookUp) {
          currentRec.setValue("entity", fieldLookUp.entity[0].value);
          currentRec.setValue("salesrep", fieldLookUp.salesrep[0].value);
        }
      }
    } catch (exInit) {
      log.error("Error in Child Sales Order Page InIt()", exInit.message);
    }
  }

  /* Get URL Parameter value using parameter */
  function GetParameterFromURL(param) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }

  return {
    pageInit: PageInIt,
    OpenChildSalesOrderPage: OpenChildSalesOrderPage,
  };
});
