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
  "../rxrs_return_cover_letter_lib",
], /**
 * @param{runtime} runtime
 * @param{url} url
 * @param currentRecord
 * @param message
 * @param record
 * @param https
 * @param rxrs_rcl_lib
 */ function (
  runtime,
  url,
  currentRecord,
  message,
  record,
  https,
  rxrs_rcl_lib
) {
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
          }
        }, 100);
      }
    }
  }

  window.onload = function () {
    //considering there aren't any hashes in the urls already
  };

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
          if (+amount > +maxAmount) {
            alert(
              `Line #${
                i + 1
              } exceeds the maximum SO amount of the Manufacturer. This will not get verified and bag will not be created for this line.`
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

  function handleButtonClick() {
    try {
      jQuery("body").loadingModal({
        position: "auto",
        text: "Updating Verify Status and Creating Bag Label. Please wait...",
        color: "#fff",
        opacity: "0.7",
        backgroundColor: "rgb(220,220,220)",
        animation: "doubleBounce",
      });
    } catch (e) {
      console.error("handleButtonClick", e.message);
    }
  }

  /**
   * Create Payment Record and Assign it to item return scan
   */
  function createPayment(mrrId, paymentText) {
    try {
      let internalIds = [];
      let rec = currentRecord.get();

      let paymentName = rec.getValue("custpage_payment_name");
      let dueDate = rec.getValue("custpage_due_date");
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
      if (paymentName == "" || paymentName == null) {
        alert("Please enter Payment name");
        return;
      }

      let returnList = JSON.stringify(internalIds.join("_"));

      if (paymentName == initialPaymentName) {
        alert("Please enter a different payment name");
        return;
      }
      let createdPaymentId = rxrs_rcl_lib.createPaymentSched({
        paymentName: paymentName,
        dueDate: dueDate,
      });
      console.log("createdPaymentId: " + createdPaymentId);

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
          createdPaymentId: createdPaymentId,
          title: "In-Dated Inventory",
          finalPaymentSched: false,
        },
      });
      window.open(`${rclSuiteletURL}`, "_self");
    } catch (e) {
      console.error("createPayment" + e.message);
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
  };
});
