/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/file", "N/record", "N/search", "../rxrs_util"] /**
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */, (file, record, search, util) => {
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
    let { newRecord, type } = scriptContext;
    try {
      const PARENTFOLDERNAME = "222Form";
      const parentFolderId = util.getFolderId(PARENTFOLDERNAME);
      const mrrText = newRecord.getText("name");
      log.audit("values", { PARENTFOLDERNAME, parentFolderId, mrrText });
      log.audit(
        "Creating Folder",
        util.createFolder({
          name: mrrText,
          parent: parentFolderId,
        }),
      );
    } catch (e) {
      log.error("afterSubmit", e.message);
    }
  };

  return { afterSubmit };
});
