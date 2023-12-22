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
  const columnToDisable = [
    "custpage_full_partial",
    "custpage_package_size",
    "custpage_full",
    "custpage_partial",
    "custpage_unit_price",
    "custpage_amount_paid",
    "custpage_packing_slip_value",
    "custpage_packing_slip_price",
  ];
  const columnToDisableEnabled = [
    "custpage_unit_price",
    "custpage_amount_paid",
  ];

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

    for (let i = 0; i < suitelet.getLineCount("custpage_items_sublist"); i++) {
      columnToDisable.forEach((fieldId) => {
        const itemField = suitelet.getSublistField({
          sublistId: "custpage_items_sublist",
          fieldId: fieldId,
          line: i,
        });
        itemField.isDisabled = true;
      });
    }
    let arrTemp = window.location.href.split("?");
    urlParams = new URLSearchParams(arrTemp[1]);
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
    try {
      if (scriptContext.sublistId === "custpage_items_sublist") {
        console.log("FieldId" + scriptContext.fieldId);
        const currIndex = suitelet.getCurrentSublistIndex({
          sublistId: "custpage_items_sublist",
        });
        if (scriptContext.fieldId == "custpage_select") {
          let isSelected = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_select",
          });
          let fullPartial = suitelet.getCurrentSublistText({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_full_partial",
          });

          if (fullPartial.includes("Part")) {
            columnToDisableEnabled.push("custpage_partial");
          } else {
            columnToDisableEnabled.push("custpage_full");
            console.table(columnToDisableEnabled);
          }
          columnToDisableEnabled.forEach((fieldId) => {
            const itemField = suitelet.getSublistField({
              sublistId: "custpage_items_sublist",
              fieldId: fieldId,
              line: currIndex,
            });
            itemField.isDisabled = !JSON.parse(isSelected);
          });
        }

        if (scriptContext.fieldId === "custpage_unit_price") {
          let unitPrice = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_unit_price",
          });
          let packageSize = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_package_size",
          });
          console.log("packageSize", packageSize);
          let quantity = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_full",
          });
          let partialCount = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_partial",
          });
          let fullPartial = suitelet.getCurrentSublistText({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_full_partial",
          });

          console.table([
            unitPrice,
            packageSize,
            quantity,
            partialCount,
            fullPartial,
          ]);
          let newAmount = 0;
          if (fullPartial.includes("Part")) {
            newAmount =
              (Number(partialCount) / Number(packageSize)) * Number(unitPrice);
          } else {
            newAmount = Number(quantity) * Number(unitPrice);
          }

          const totalLineAmount = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_packing_slip_value",
          });
          console.table(newAmount, totalLineAmount);
          if (Number(newAmount) > Number(totalLineAmount)) {
            alert(
              "Amount to be Paid must not be greater than Packing Slip Value"
            );
            suitelet.setCurrentSublistValue({
              sublistId: "custpage_items_sublist",
              fieldId: "custpage_unit_price",
              value: 0,
            });
          } else {
            suitelet.setCurrentSublistValue({
              sublistId: "custpage_items_sublist",
              fieldId: "custpage_amount_paid",
              value: newAmount.toFixed(2),
            });
            let totalAmount = 0;
            for (
              let i = 0;
              i < suitelet.getLineCount("custpage_items_sublist");
              i++
            ) {
              let isSelected = suitelet.getSublistValue({
                sublistId: "custpage_items_sublist",
                fieldId: "custpage_select",
                line: i,
              });
              if (isSelected == true || isSelected == "true") {
                let amount = 0;
                amount = suitelet.getSublistValue({
                  sublistId: "custpage_items_sublist",
                  fieldId: "custpage_amount_paid",
                  line: i,
                });
                totalAmount += Number(amount);
              }
            }
            totalAmount &&
              suitelet.setValue({
                fieldId: "custpage_amount",
                value: totalAmount,
              });
          }
        }
        if (scriptContext.fieldId === "custpage_amount_paid") {
          let amountPaid = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_amount_paid",
          });
          const packageSize = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_package_size",
          });
          console.log("packageSize", packageSize);
          let quantity = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_full",
          });
          let partialCount = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_partial",
          });
          let fullPartial = suitelet.getCurrentSublistText({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_full_partial",
          });

          console.table([
            amountPaid,
            packageSize,
            quantity,
            partialCount,
            fullPartial,
          ]);
          let unitPrice = 0;
          if (fullPartial.includes("Part")) {
            unitPrice =
              Number(amountPaid) / (Number(partialCount) / Number(packageSize));
          } else {
            unitPrice = Number(amountPaid) / Number(quantity);
          }

          const totalLineAmount = suitelet.getCurrentSublistValue({
            sublistId: "custpage_items_sublist",
            fieldId: "custpage_packing_slip_value",
          });
          console.table(amountPaid, totalLineAmount);
          if (Number(amountPaid) > Number(totalLineAmount)) {
            alert(
              "Amount to be Paid must not be greater than Packing Slip Value"
            );
            suitelet.setCurrentSublistValue({
              sublistId: "custpage_items_sublist",
              fieldId: "custpage_unit_price",
              value: 0,
            });
          } else {
            suitelet.setCurrentSublistValue({
              sublistId: "custpage_items_sublist",
              fieldId: "custpage_unit_price",
              value: unitPrice.toFixed(2),
            });
            let totalAmount = 0;
            for (
              let i = 0;
              i < suitelet.getLineCount("custpage_items_sublist");
              i++
            ) {
              let isSelected = suitelet.getSublistValue({
                sublistId: "custpage_items_sublist",
                fieldId: "custpage_select",
                line: i,
              });
              if (isSelected == true || isSelected == "true") {
                let amount = 0;
                amount = suitelet.getSublistValue({
                  sublistId: "custpage_items_sublist",
                  fieldId: "custpage_amount_paid",
                  line: i,
                });
                totalAmount += Number(amount);
              }
            }
            totalAmount &&
              suitelet.setValue({
                fieldId: "custpage_amount",
                value: totalAmount,
              });
          }
        }
      }
    } catch (e) {
      console.error("fieldChanged", e.message);
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
          "Cannot change payment schedule, related bill record is already paid in full"
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
    showMessage: showMessage,
    markAll: markAll,
  };
});
