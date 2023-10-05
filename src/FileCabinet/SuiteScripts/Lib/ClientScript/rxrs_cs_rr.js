/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/url", "N/https", "N/ui/message"], /**
 * @param{currentRecord} currentRecord
 * @param{url} url
 * @param https
 * @param message
 */ function (currentRecord, url, https, message) {
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(scriptContext) {}

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
  function fieldChanged(scriptContext) {}

  /**
   * Function to be executed when field is slaved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   *
   * @since 2015.2
   */
  function postSourcing(scriptContext) {}

  /**
   * Function to be executed after sublist is inserted, removed, or edited.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function sublistChanged(scriptContext) {}

  /**
   * Function to be executed after line is selected.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function lineInit(scriptContext) {}

  /**
   * Validation function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @returns {boolean} Return true if field is valid
   *
   * @since 2015.2
   */
  function validateField(scriptContext) {}

  /**
   * Validation function to be executed when sublist line is committed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateLine(scriptContext) {}

  /**
   * Validation function to be executed when sublist line is inserted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateInsert(scriptContext) {}

  /**
   * Validation function to be executed when record is deleted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateDelete(scriptContext) {}

  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {}

  /**
   * Call a suitelet to perform custom action
   * @param options.mrrId Master Return Id
   * @param options.rrId  Return RequestId
   * @param options.rclId  Return Cover Letter Id
   * @param options.entity Entity Id
   * @param options.poId Transaction Id
   * @param options.action Specific action to call in the Suitelet
   */
  function createTransaction(options) {
    console.table(options);
    let { mrrId, rrId, entity, rclId, action, poId } = options;
    try {
      let params;
      handleButtonClick();
      switch (action) {
        case "createPO":
          params = {
            rrId: rrId,
            mrrId: mrrId,
            entity: entity,
            action: action,
          };
          break;
        case "createBill":
          params = {
            rclId: rclId,
            mrrId: mrrId,
            action: action,
            poId: poId,
          };
          break;
      }
      let functionSLURL = url.resolveScript({
        scriptId: "customscript_sl_cs_custom_function",
        deploymentId: "customdeploy_sl_cs_custom_function",
        returnExternalUrl: false,
        params: params,
      });

      postURL({ URL: functionSLURL });
    } catch (e) {
      log.error("createTransaction", e.message);
    }
  }

  /**
   * Show loading animation
   */
  function handleButtonClick() {
    try {
      jQuery("body").loadingModal({
        position: "auto",
        text: "Please wait...",
        color: "#fff",
        opacity: "0.8",
        backgroundColor: "rgb(100,116,156)",
        animation: "foldingCube",
      });
    } catch (e) {
      console.error("handleButtonClick", e.message);
    }
  }

  /**
   * Open suitelet URL
   * @param options.url URL
   * @param options.action
   */
  function openSuitelet(options) {
    let { url, action } = options;
    console.log(url);
    console.log(action);
    switch (action) {
      case "verifyItems":
        window.open(url, "_blank", "width=1500,height=1200,left=100,top=1000");
        break;
      case "splitPayment":
        window.open(url, "_blank", "width=1500,height=1200,left=100,top=1000");
        break;
      default:
        window.open(url, "_blank");
    }
  }

  /**
   * Post URL request
   * @param {string} options.URL Suitelet URL
   *
   */
  function postURL(options) {
    let { URL } = options;
    try {
      setTimeout(function () {
        let response = https.post({
          url: URL,
        });
        if (response) {
          console.log(response);
          jQuery("body").loadingModal("destroy");
          if (response.body.includes("ERROR")) {
            let m = message.create({
              type: message.Type.ERROR,
              title: "ERROR",
              message: response.body,
            });
            m.show(10000);
          } else {
            let m = message.create({
              type: message.Type.CONFIRMATION,
              title: "SUCCESS",
              message: response.body,
            });
            m.show(10000);
            setTimeout(function () {
              location.reload();
            }, 2000);
          }
        }
      }, 100);
    } catch (e) {
      console.error("postURL", e.message);
    }
  }

  return {
    createTransaction: createTransaction,
    pageInit: pageInit,
    openSuitelet: openSuitelet,
  };
});
