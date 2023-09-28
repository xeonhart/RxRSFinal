/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "../rxrs_transaction_lib"], /**
 * @param{serverWidget} serverWidget
 */ (serverWidget, tranLib) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (context) => {
    let params = context.request.parameters;
    log.error("params", params);
    if (context.request.method === "POST") {
      let { rrId, mrrId, entity, action } = params;
      try {
        let returnObj;
        log.audit("POST", params);
        if (action == "createPO") {
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
        }
      } catch (e) {
        context.response.writeLine("ERROR:" + e.message);
        log.error("creating invoice", e.message);
      }
    }
  };

  return { onRequest };
});
