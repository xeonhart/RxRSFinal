/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/url", "N/https"], function (record, url, https) {
  function beforeLoad(context) {
    var stSuiteletUrl = url.resolveScript({
      scriptId: "customscript1255",
      deploymentId: "customdeploy1",
      returnExternalUrl: true,
    });
    var response = https.get({ url: stSuiteletUrl });
    log.audit("response", response);
  }

  function afterSubmit(context) {}

  return {
    beforeLoad: beforeLoad /*,
            afterSubmit: afterSubmit*/,
  };
});
