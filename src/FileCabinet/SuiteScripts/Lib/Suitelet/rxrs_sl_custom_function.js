/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/ui/serverWidget",
  "../rxrs_transaction_lib",
  "../rxrs_return_cover_letter_lib",
], /**
 * @param{serverWidget} serverWidget
 * @param tranLib
 * @param rclLib
 */ (serverWidget, tranLib, rclLib) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (context) => {
    let params = context.request.parameters;
    log.audit("params", params);
    if (context.request.method === "POST") {
      let { rrId, mrrId, entity, action, rclId, poId } = params;
      try {
        let returnObj;
        log.audit("POST", params);
        switch (action) {
          case "createPO":
            returnObj = tranLib.createPO({
              rrId: rrId,
              mrrId: mrrId,
              entity: entity,
            });
            let { error, resMessage } = returnObj;
            if (resMessage) {
              context.response.writeLine(resMessage);
            } else {
              context.response.writeLine("ERROR:" + error);
            }
            break;
          case "createBill":
            let paymentIds = rclLib.getRCLFinalPayment({ rclId: rclId });

            let processVB = [];
            log.audit("createBill", { paymentIds, poId });
            paymentIds.forEach((paymentId) => {
              let isVBExist = tranLib.checkIfTransAlreadyExist({
                mrrId: mrrId,
                searchType: "VendBill",
                finalPaymentSchudule: paymentId,
              });
              log.emergency("isVBExist", { isVBExist, paymentId });
              if (!isVBExist) {
                let returnObj = tranLib.createBill({
                  mrrId: mrrId,
                  finalPaymentSchudule: paymentId,
                  poId: poId,
                });
                log.audit("returnObj", returnObj);
                if (returnObj.id) {
                  processVB.push(returnObj.id);
                }
              }
            });
            if (processVB.length != 0) {
              let resMessage = `Successfully created Vendor bill ${processVB.join(
                ","
              )}`;
              context.response.writeLine(resMessage);
            } else {
              context.response.writeLine(
                "ERROR:" + "Failed to create all vendor bill"
              );
            }

            break;
        }
      } catch (e) {
        context.response.writeLine("ERROR:" + e.message);
        log.error("creating transaction", e.message);
      }
    }
  };

  return { onRequest };
});
