/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/currentRecord", "N/record", "N/search"], function (
  currentRecord,
  record,
  search
) {
  function pageInit(context) {
    try {
      const currentRec = context.currentRecord;
      setTimeout(function () {
        const inv = GetParameterFromURL("inv");
        console.log(inv);
        if (inv) {
          let index = currentRec.findSublistLineWithValue({
            sublistId: "apply",
            fieldId: "internalid",
            value: inv,
          });
          if (index == -1) return;
          log.debug("index", index);
          currentRec.selectLine({
            sublistId: "apply",
            line: index,
          });
          let total = getInvPaymentAmount(inv);
          log.debug("total", total);

          currentRec.setSublistValue({
            sublistId: "apply",
            fieldId: "total",
            line: index,
            value: total,
          });
        }
      }, 3000);
    } catch (exInit) {
      log.error("Page Init", exInit.message);
    }
  }

  function getInvPaymentAmount(inv) {
    let totalAmount = 0;
    try {
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["type", "anyof", "Custom107"],
          "AND",
          ["custbody_payment_invoice_link", "anyof", inv],
        ],
        columns: [
          search.createColumn({
            name: "debitamount",
            summary: "SUM",
            label: "Amount (Debit)",
          }),
        ],
      });
      const searchResultCount = transactionSearchObj.runPaged().count;
      if (searchResultCount == 0) return 0;

      transactionSearchObj.run().each(function (result) {
        totalAmount = result.getValue({
          name: "debitamount",
          summary: "SUM",
        });
      });
      log.debug("amount", totalAmount);
      return totalAmount;
    } catch (e) {
      log.error("getInvPaymentAmount", e.message);
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
    pageInit: pageInit,
  };
});
