/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
  "N/runtime",
  "N/url",
  "N/currentRecord",
  "N/ui/message",
  "N/record",
  "N/https",
], /**
 * @param{runtime} runtime
 * @param{url} url
 * @param currentRecord
 * @param message
 * @param record
 * @param https
 * @param rxrs_rcl_lib
 * @param tranlib
 */ function (runtime, url, currentRecord, message, record, https) {
  let suitelet = null;
  const RETURNABLESUBLIST = "custpage_items_sublist";
  let urlParams;
  let lineTobeUpdated = [];
  let initialPaymentName;

  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(scriptContext) {
    suitelet = scriptContext.currentRecord;
    let arrTemp = window.location.href.split("?");
    urlParams = new URLSearchParams(arrTemp[1]);
    initialPaymentName = suitelet.getValue("custpage_payment_name");
    if (window.location.href.indexOf("isReload") != -1) {
      let isReload = urlParams.get("isReload");
      console.log("isReload" + isReload);
      if (isReload == true || isReload == "true") {
        setTimeout(function () {
          opener.location.reload();
          if (!window.location.hash) {
            //setting window location
            window.location = window.location + "#loaded";
            //using reload() method to reload web page
            window.location.reload();
            window.close();
          }
        }, 100);
      }
    }
  }

  window.onload = function () {
    //considering there aren't any hashes in the urls already
  };

  function updateIRS() {
    alert("SavingChanges");
    handleButtonClick("Please Wait..");
    let count = 0;
    try {
      let rec = currentRecord.get();
      let paymentSublistCount = rec.getLineCount({
        sublistId: RETURNABLESUBLIST,
      });

      for (let i = 0; i < paymentSublistCount; i++) {
        let setToNonReturnble = rec.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_settononreturnable",
          line: i,
        });
        if (setToNonReturnble == false) continue;
        count += 1;
        let id = rec.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_internalid",
          line: i,
        });

        let nonReturnableReason = rec.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_nonreturnable_reason",
          line: i,
        });

        const amount = rec.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_amount",
          line: i,
        });
        let values = [
          {
            fieldId: "custrecord_cs_cb_or_non_ret_reason",
            value: true,
          },
          {
            fieldId: "custrecord_scannonreturnreason",
            value: nonReturnableReason,
          },
          { fieldId: "custrecord_cs__rqstprocesing", value: 1 },
          {
            fieldId: "custrecord_irc_total_amount",
            value: amount,
          },
        ];
        let params = {
          action: "updateRecordHeader",
          type: "customrecord_cs_item_ret_scan",
          id: id,
          values: JSON.stringify(values),
        };
        console.table(params);
        let stSuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_cs_custom_function",
          deploymentId: "customdeploy_sl_cs_custom_function",
          returnExternalUrl: false,
          params: params,
        });
        let response = https.post({
          url: stSuiteletUrl,
        });
      }
    } catch (e) {
      console.error("updateIRS" + e.message);
    }

    setTimeout(function () {
      jQuery("body").loadingModal("destroy");
      window.onbeforeunload = null;
      location.reload();
    }, 5000 + count);
  }

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
  function fieldChanged(scriptContext) {
    let rrId = suitelet.getValue("custpage_rrid");
    let tranId = suitelet.getValue("custpage_tranid");
    let rrType = suitelet.getValue("custpage_rr_type");
    let mrrId = suitelet.getValue("custpage_mrrid");

    console.log("fieldChanged");
    console.log(scriptContext.fieldId);
    console.log(scriptContext.sublistId);
    console.log(rrId + tranId);
    let params = {};
    try {
      if (scriptContext.fieldId == "custpage_radio") {
        let selection = suitelet.getValue("custpage_radio");
        if (selection === "Returnable") {
          params.isMainReturnable = true;
        } else if (selection === "Destruction") {
          params.isMainDestruction = true;
        } else {
          params.isMainInDated = true;
        }
        params.selectionType = selection;
        params.tranId = tranId;
        params.rrId = rrId;
        params.rrType = rrType;
        params.mrrId = mrrId;
        console.log(params);
        let stSuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_returnable_page",
          deploymentId: "customdeploy_sl_returnable_page",
          returnExternalUrl: false,
          params: params,
        });
        window.ischanged = false;
        window.open(stSuiteletUrl, "_self");
      }
      /**
       * SO suitelet 222 form reference
       */
      if (scriptContext.sublistId === "custpage_items_sublist") {
        if (scriptContext.fieldId === "custpage_select") {
          let isSelected = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_select",
          });
          if (isSelected == false || isSelected == "false") {
            suitelet.setCurrentSublistValue({
              sublistId: "custpage_items_sublist",
              fieldId: "custpage_form222_ref",
              value: " ",
            });
          }
        }
      }
    } catch (e) {
      console.error("fieldChanged", e.message);
    }
  }

  /**
   * Return to returnable page group by Manufacturer
   */
  function backToReturnable() {
    let params = {};
    let rrId = suitelet.getValue("custpage_rrid");
    let tranId = suitelet.getValue("custpage_tranid");
    let rrType = suitelet.getValue("custpage_rr_type");
    let mrrId = suitelet.getValue("custpage_mrrid");
    params.tranId = tranId;
    params.rrId = rrId;
    params.rrType = rrType;
    params.mrrId = mrrId;
    params.selectionType = suitelet.getValue("custpage_radio");
    if (params.selectionType == "Returnable") {
      params.isMainReturnable = true;
    } else if (params.selectionType == "Desctruction") {
      params.isMainDestruction = true;
    } else {
      params.isMainInDated = true;
    }
    78;
    let stSuiteletUrl = url.resolveScript({
      scriptId: "customscript_sl_returnable_page",
      deploymentId: "customdeploy_sl_returnable_page",
      returnExternalUrl: false,
      params: params,
    });
    window.ischanged = false;
    window.open(stSuiteletUrl, "_self");
  }

  function verify() {
    try {
      let maxAmount = suitelet.getValue("custpage_manuf_max_so_amt");
      let returnItemScanIds = [];
      let returnType = suitelet.getValue("custpage_radio");
      console.log(returnType);
      for (
        let i = 0;
        i < suitelet.getLineCount("custpage_items_sublist");
        i++
      ) {
        let internalId = suitelet.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_internalid",
          line: i,
        });
        let amount = suitelet.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_amount",
          line: i,
        });
        let itemId = suitelet.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_item_id",
          line: i,
        });
        let prevBag = suitelet.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_bag_tag_label",
          line: i,
        });
        console.log(prevBag.length);
        if (prevBag.length <= 96) {
          prevBag = null;
        }
        if (returnType != "Destruction") {
          if (+amount > +maxAmount && +maxAmount != 0) {
            alert(
              `Line #${
                i + 1
              } exceeds the maximum SO amount of the Manufacturer. This will not get verified and bag will not be created for this line.`,
            );
            continue;
          }
        }
        console.log(typeof prevBag);
        returnItemScanIds.push({
          id: internalId,
          amount: amount || 0,
          itemId: itemId,
          prevBag: prevBag,
        });
      }
      console.table("returnItemScanIds: " + returnItemScanIds);
      let m = message.create({
        type: message.Type.WARNING,
        title: "WARNING",
        message: "NO ITEM TO PROCESS",
      });
      if (returnItemScanIds.length <= 0) {
        m.show({
          duration: 2000,
        });
        return;
      }
      let maximumAmount = suitelet.getValue("custpage_manuf_max_so_amt");
      let rrId = suitelet.getValue("custpage_rrid");
      let mrrId = suitelet.getValue("custpage_mrrid");
      let rrType = suitelet.getValue("custpage_rr_type");
      let manufId = suitelet.getValue("custpage_manuf_id");
      let params = {
        custscript_payload: JSON.stringify(returnItemScanIds),
        isVerify: true,
        maximumAmount: maximumAmount ? JSON.stringify(maximumAmount) : 0,
        rrId: rrId,
        mrrid: mrrId,
        rrType: rrType,
        manufId: manufId,
        returnType: returnType,
      };

      handleButtonClick();
      setTimeout(function () {
        let stSuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_validate_return",
          deploymentId: "customdeploy_sl_validate_return",
          params: params,
        });
        let response = https.post({
          url: stSuiteletUrl,
        });

        if (response.body) {
          if (response.body.includes("ERROR")) {
            alert(response.body);
          } else {
            setTimeout(function () {
              location.reload();
            }, 300);
          }
        }
      }, 100);
    } catch (e) {
      console.error("verify", e.message);
    }
  }

  function showMessage() {
    let m = message.create({
      type: message.Type.WARNING,
      title: "WARNING",
      message: "NO ITEM TO PROCESS",
    });
    m.show({
      duration: 2000,
    });
  }

  /**
   * Mark and Unmark the Sublist
   * @param {string} value
   */
  function markAll(value) {
    const SUBLIST = "custpage_items_sublist";
    let curRec = currentRecord.get();
    for (let i = 0; i < curRec.getLineCount(SUBLIST); i++) {
      curRec.selectLine({
        sublistId: SUBLIST,
        line: i,
      });
      curRec.setCurrentSublistValue({
        sublistId: SUBLIST,
        fieldId: "custpage_select",
        value: JSON.parse(value),
      });
      if (value == "false" || value == false)
        curRec.setCurrentSublistValue({
          sublistId: SUBLIST,
          fieldId: "custpage_form222_ref",
          value: " ",
        });
      curRec.commitLine(SUBLIST);
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

  function updateSO222Form() {
    try {
      jQuery("body").loadingModal({
        position: "auto",
        text: "Updating Sales Order. Please wait...",
        color: "#fff",
        opacity: "0.7",
        backgroundColor: "rgb(220,220,220)",
        animation: "wave",
      });
    } catch (e) {
      console.error("handleButtonClick", e.message);
    }
  }

  function handleButtonClick(str) {
    try {
      jQuery("body").loadingModal({
        position: "auto",
        text: str
          ? str
          : "Updating Verify Status and Creating Bag Label. Please wait...",
        color: "#fff",
        opacity: "0.7",
        backgroundColor: "rgb(220,220,220)",
        animation: "doubleBounce",
      });
    } catch (e) {
      console.error("handleButtonClick", e.message);
    }
  }

  function getCertainField(options) {
    console.table(options);
    let { type, id, columns } = options;
    try {
      const tranSearch = search.lookupFields({
        type: type,
        id: id,
        columns: [columns],
      });
      let vbStatus = tranSearch[columns][0].value;
      return JSON.stringify(vbStatus);
    } catch (e) {
      log.error("getTransactionStatus", e.message);
    }
  }

  /**
   * Create Payment Record and Assign it to item return scan
   * @param {number} options.mrrId Master Return Id
   * @param {number} options.billId Bill Id
   */
  function createPayment(options) {
    console.table(options);
    const curRec = currentRecord.get();
    const billStatus = curRec.getValue("custpage_bill_status");

    let { mrrId, billId } = options;
    try {
      console.log("billstatus " + billStatus);
      if (billStatus == "paidInFull") {
        alert(
          "Cannot change payment schedule, related bill record is already paid in full",
        );
        return;
      }
      let internalIds = [];
      let rec = currentRecord.get();

      let newPaymentId = rec.getValue("custpage_payment_name");
      let paymentSublistCount = rec.getLineCount({
        sublistId: RETURNABLESUBLIST,
      });
      for (let i = 0; i < paymentSublistCount; i++) {
        if (
          rec.getSublistValue({
            sublistId: RETURNABLESUBLIST,
            fieldId: "custpage_verified",
            line: i,
          }) !== true
        )
          continue;
        let internalId = rec.getSublistValue({
          sublistId: RETURNABLESUBLIST,
          fieldId: "custpage_internalid",
          line: i,
        });
        internalIds.push(internalId);
      }
      console.log(internalIds.length);
      if (internalIds.length == 0) {
        alert("Please select item");
        return;
      }

      let returnList = JSON.stringify(internalIds.join("_"));

      let rclSuiteletURL = url.resolveScript({
        scriptId: "customscript_sl_return_cover_letter",
        deploymentId: "customdeploy_sl_return_cover_letter",
        returnExternalUrl: false,
        params: {
          mrrId: mrrId,
          isReload: true,
          inDated: true,
          isVerifyStaging: false,
          returnList: returnList,
          createdPaymentId: newPaymentId,
          title: "In-Dated Inventory",
          finalPaymentSched: false,
          initialSplitpaymentPage: false,
        },
      });

      if (billId) {
        let params = {
          billId: billId,
          newPaymentId: newPaymentId,
          action: "deleteBill",
          mrrId: mrrId,
        };

        let functionSLURL = url.resolveScript({
          scriptId: "customscript_sl_cs_custom_function",
          deploymentId: "customdeploy_sl_cs_custom_function",
          returnExternalUrl: false,
          params: params,
        });

        postURL({ URL: functionSLURL });
      }

      window.open(`${rclSuiteletURL}`, "_self");
    } catch (e) {
      console.error("createPayment" + e.message);
    }
  }

  function updateSO222FormReference(soId) {
    try {
      let soDetails = {};
      soDetails.soId = soId;
      soDetails.soItemToUpdate = [];
      const SUBLIST = "custpage_items_sublist";
      try {
        for (
          let i = 0;
          i < suitelet.getLineCount("custpage_items_sublist");
          i++
        ) {
          let isSelected = suitelet.getSublistValue({
            sublistId: SUBLIST,
            fieldId: "custpage_select",
            line: i,
          });
          if (isSelected !== true) continue;

          let lineUniqueKey = suitelet.getSublistValue({
            sublistId: SUBLIST,
            fieldId: "custpage_linekey",
            line: i,
          });
          let form222Number = suitelet.getSublistValue({
            sublistId: SUBLIST,
            fieldId: "custpage_form222_ref",
            line: i,
          });
          if (form222Number) {
            soDetails.soItemToUpdate.push({
              lineUniqueKey: lineUniqueKey,
              form222Number: form222Number,
            });
          }
        }

        let m = message.create({
          type: message.Type.WARNING,
          title: "WARNING",
          message: "NO ITEM TO PROCESS",
        });
        if (soDetails.soItemToUpdate.length <= 0) {
          m.show({
            duration: 2000,
          });
          return;
        }

        let params = {
          soDetails: JSON.stringify(soDetails),
          action: "updateSOItem222FormReference",
          isReload: true,
        };

        updateSO222Form();
        let stSuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_cs_custom_function",
          deploymentId: "customdeploy_sl_cs_custom_function",
          params: params,
        });
        postURL({ URL: stSuiteletUrl });
        setTimeout(function () {
          let rclSuiteletURL = url.resolveScript({
            scriptId: "customscript_rxrs_sl_add_222_form_ref",
            deploymentId: "customdeploy_rxrs_sl_add_222_form_ref",
            returnExternalUrl: false,
            params: {
              isReload: true,
            },
          });
          window.ischanged = false;
          window.open(`${rclSuiteletURL}`, "_self");
        }, 2000);
      } catch (e) {
        console.error("updateSO222FormReference", e.message);
      }
    } catch (e) {
      console.error("updateSO222FormReference", e.message);
    }
  }

  function update222FormReference() {
    try {
      const SUBLIST = "custpage_items_sublist";
      const curRec = currentRecord.get();
      let lineCount = curRec.getLineCount(SUBLIST);
      console.log("Linecount" + lineCount);
      const form222Number = curRec.getValue("custpage_form222_field");
      if (!form222Number) {
        alert("Please enter 222 form number");
      }

      for (let i = 0; i < lineCount; i++) {
        curRec.selectLine({
          sublistId: SUBLIST,
          line: i,
        });
        if (
          curRec.getCurrentSublistValue({
            sublistId: SUBLIST,
            fieldId: "custpage_select",
          }) !== true
        )
          continue;
        curRec.setCurrentSublistValue({
          sublistId: SUBLIST,
          fieldId: "custpage_form222_ref",
          value: form222Number,
        });
      }
    } catch (e) {
      console.error("update222FormReference", e.message);
    }
  }

  function destroyModal() {
    jQuery("#_loading_dialog").dialog("destroy");
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    verify: verify,
    backToReturnable: backToReturnable,
    showMessage: showMessage,
    createPayment: createPayment,
    markAll: markAll,
    update222FormReference: update222FormReference,
    updateSO222FormReference: updateSO222FormReference,
    updateIRS: updateIRS,
  };
});
