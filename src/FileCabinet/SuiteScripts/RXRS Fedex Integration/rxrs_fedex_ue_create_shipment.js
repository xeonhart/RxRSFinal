/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/record",
  "N/runtime",
  "./Lib/rxrs_fedex_create_shipment",
  "./Lib/util/rxrs_util_lib",
], (record, runtime, createShipmentApi, rxrsUtilLib) => {
  const beforeLoad = (scriptContext) => {
    try {
      const { newRecord } = scriptContext;
      const { form } = scriptContext;
      form.clientScriptFileId = rxrsUtilLib.getFileId(
        "rxrs_cs_fedex_functions.js",
      );
      const currRec = record.load({
        type: "customrecord_kod_mr_packages",
        id: newRecord.id,
      });
      if (scriptContext.type === "create") return;
      if (
        rxrsUtilLib.isEmpty(
          currRec.getValue({
            fieldId: "custrecord_rxrs_fedex_ship_rec",
          }),
        )
      ) {
        form.addButton({
          label: "Create Fedex Shipment",
          id: "custpage_create_fedex_shipment",
          functionName: `createShipmentApi(${newRecord.id})`,
        });
      }

      form.addButton({
        label: "Cancel Fedex Shipment",
        id: "custpage_cancel_fedex_shipment",
        functionName: `cancelShipment(${newRecord.id})`,
      });
    } catch (e) {
      log.error("afterSubmit", e.message);
    }
  };
  const afterSubmit = (scriptContext) => {
    const { newRecord } = scriptContext;
    const recId = newRecord.id;
    try {
      // const headlightSettingId = getParamets();
      // if (scriptContext.type === 'CREATE' && scriptContext.type === 'EDIT') {
      log.debug({
        title: "AS Attempt",
        details: JSON.stringify(createShipmentApi),
      });
      createShipmentApi.procRetPackShip(scriptContext, newRecord, recId);
      // }
    } catch (e) {
      newRecord.setValue({
        fieldId: "custrecord_failed_fedex_shipment_creatio",
        value: true,
      });
      log.error("afterSubmit", e.message);
    }
  };

  function getParamets() {
    const scriptObj = runtime.getCurrentScript();
    // return scriptObj.getParameter({
    //   name: 'custscript_serp_headlight_settings',
    // });
  }

  return { beforeLoad, afterSubmit };
});
