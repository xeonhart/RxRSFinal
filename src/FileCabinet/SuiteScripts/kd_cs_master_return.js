/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
  "N/currentRecord",
  "N/record",
  "N/url",
  "N/search",
  "./Lib/rxrs_util",
], /**
 * @param{currentRecord} currentRecord
 * @param record
 * @param url
 * @param search
 */ function (currentRecord, record, url, search, rxrs_util) {
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(context) {
    var rec = context.currentRecord;
    log.debug("Rec ", rec);
    var status = rec.getValue("custrecord_kod_mr_status");
    log.debug("Status", status);
    if (status == 9) {
      if (rec.getValue("customform") != 119) {
        log.debug("Setting Custom Form Value");
        rec.setValue({ fieldId: "customform", value: 119 });
        if (rec.getValue("custrecord_kd_ready_for_approval") !== true) {
          alert(
            "Please select and edit the Return Request and enter a reject reason that you want to adjust."
          );
        }
      }
    }
  }

  function saveRecord(scriptContext) {
    try {
      var curRec = scriptContext.currentRecord;
      if (
        curRec.getValue("custrecord_kod_mr_status") ===
        rxrs_util.mrrStatus.CustomerSubmitted
      ) {
        console.log("entering validation")
        var rxNumberOfLabel = 0;
        var c3to5NumberOfLabel = 0;
        var c2NumberOfLabel = 0;
        rxNumberOfLabel = curRec.getValue("custrecord_kd_mrr_rx_otc_no_labels");
        c3to5NumberOfLabel = curRec.getValue(
          "custrecord_kd_mrr_c3_5_no_labels"
        );
        c2NumberOfLabel = curRec.getValue("custrecord_kd_mrr_c2_no_labels");
        var totalNumberOfLabels =
          rxNumberOfLabel + c3to5NumberOfLabel + c2NumberOfLabel;

        console.log("totalNumberOfLabels " + totalNumberOfLabels);
        if (totalNumberOfLabels > 50) {
         var isRunning = rxrs_util.checkInstanceInstnaceMR()
          if (isRunning) {
            alert(
              "There's still a current process of creation of inbound packages. Please wait until the process is completed before saving record again."
            );
            return false;
          } else {
            alert(
              "Creation of inbound packages will be processed in the backend. This may take some time. Please wait..."
            );
            return true;
          }
        }
      }
      return true;
    } catch (e) {
      console.log("saveRecord", e.message);
    }
  }

  function generateFinalStatement(scriptContext) {
    //alert('redirecting');
    var suiteletURL = url.resolveScript({
      scriptId: "customscript_kd_sl_gen_final_statement",
      deploymentId: "customdeploy_kd_sl_gen_final_statement",
      returnExternalUrl: false,
      params: {
        custscript_kd_mrr_id: currentRecord.get().id,
      },
    });
    location.href = suiteletURL;
  }

  function approve() {
    var suiteletURL = url.resolveScript({
      scriptId: "customscript_kd_sl_gen_final_statement",
      deploymentId: "customdeploy_kd_sl_gen_final_statement",
      returnExternalUrl: false,
      params: {
        custscript_kd_mrr_id: currentRecord.get().id,
      },
    });
    location.href = suiteletURL;
    /*record.submitFields({
                                        type: 'customrecord_kod_masterreturn',
                                        id: currentRecord.get().id,
                                        values: {
                                            'custrecord_kod_mr_status': 10
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields : true
                                        }
                                    });
                        
                                    redirect.toRecord({
                                        type: 'customrecord_kod_masterreturn',
                                        id: currentRecord.get().id
                                    });*/
  }

  return {
    pageInit: pageInit,
    generateFinalStatement: generateFinalStatement,
    saveRecord: saveRecord,
    approve: approve,
  };
});
