/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record"], /**
 * @param{record} record
 */ (record) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {};

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {};

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {
    if (scriptContext.type != "create") return;
    try {
      const MANUFACTURER = 5;
      const rec = scriptContext.newRecord;

      if (rec.getValue("category") != MANUFACTURER) return;
      const customerId = rec.getValue("companyname");
      const companyName = rec.getValue("companyname");
      const id = rec.id;
      let manufId = createManufacturer({
        customerId: customerId,
        companyName: companyName,
        id: id,
      });
      log.debug("creating manufacturer", manufId);
      record.submitFields({
        type: record.Type.CUSTOMER,
        id: id,
        values: {
          csegmanufacturer: manufId,
        },
      });
    } catch (e) {
      log.error("afterSubmit", e.message);
    }
  };

  /**
   * Create manufacturer if the customer category is manufacturer
   * @param {string} options.customerId
   * @param {string} options.companyName
   * @param {string} options.id
   */
  function createManufacturer(options) {
    try {
      log.audit("createManufacturer", options);
      let { customerId, companyName, id } = options;
      const manufacturerRec = record.create({
        type: "customrecord_csegmanufacturer",
      });
      manufacturerRec.setValue({
        fieldId: "name",
        value: companyName,
      });
      manufacturerRec.setValue({
        fieldId: "custrecord_mfgaccountnumber",
        value: customerId,
      });
      manufacturerRec.setValue({
        fieldId: "custrecord_kod_customername",
        value: id,
      });
      return manufacturerRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("createManufacturer", e.message);
    }
  }

  return { afterSubmit };
});
