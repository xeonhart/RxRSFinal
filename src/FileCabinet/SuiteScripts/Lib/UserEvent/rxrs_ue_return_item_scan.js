/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/record",
  "N/search",
  "N/url",
  "N/https",
  "../rxrs_verify_staging_lib",
  "../rxrs_payment_sched_lib",
  "../rxrs_transaction_lib",
  "../rxrs_return_cover_letter_lib",
], /**
 * @param{record} record
 * @param{search} search
 * @param url
 * @param https
 * @param rxrs_util
 * @param rxrsPayment_lib
 * @param rxrs_tranlib
 * @param rxrs_rcl_lib
 */ (
  record,
  search,
  url,
  https,
  rxrs_util,
  rxrsPayment_lib,
  rxrs_tranlib,
  rxrs_rcl_lib
) => {
  const PACKAGESIZE = {
    PARTIAL: 2,
    FULL: 1,
  };
  const PHARMAPROCESSING = "custrecord_cs__rqstprocesing";
  const MFGPROCESSING = "custrecord_cs__mfgprocessing";
  const ACCRUEDPURCHASEITEM = 916;
  const beforeSubmit = (context) => {
    const rec = context.newRecord;
    const fulPartialPackage = rec.getValue(
      "custrecord_cs_full_partial_package"
    );
    const item = rec.getValue("custrecord_cs_return_req_scan_item");
    const qty = rec.getValue("custrecord_cs_qty");
    const packageSize = rec.getValue("custrecord_cs_package_size") || 0;
    const partialCount = rec.getValue("custrecord_scanpartialcount") || 0;
    try {
      const rate = rxrs_util.getWACPrice(item);
      let amount = 0;
      const isOverrideRate = rec.getValue("custrecord_isc_overriderate");
      const inputRate = rec.getValue("custrecord_isc_inputrate")
        ? rec.getValue("custrecord_isc_inputrate")
        : 0;
      const selectedRate = rec.getValue("custrecord_scanrate")
        ? rec.getValue("custrecord_scanrate")
        : 0;
      let WACAmount = 0;
      if (fulPartialPackage == PACKAGESIZE.FULL) {
        WACAmount = +qty * +rate;
        log.debug("values", { isOverrideRate, selectedRate, qty });
        amount =
          isOverrideRate == true ? +inputRate * +qty : +selectedRate * qty;
      } else {
        log.audit("else", {
          isOverrideRate,
          qty,
          partialCount,
          packageSize,
          inputRate,
        });
        //[Quantity x (Partial Count/Std Pkg Size (Item Record))] * Rate
        amount =
          isOverrideRate == true
            ? +qty * (partialCount / packageSize) * +inputRate
            : +qty * (partialCount / packageSize) * +selectedRate;
        WACAmount = qty * (partialCount / packageSize) * rate;
      }
      log.debug("beforeSubmit amount", { WACAmount, amount });
      rec.setValue({
        fieldId: "custrecord_wac_amount",
        value: WACAmount || 0,
      });
      rec.setValue({
        fieldId: "custrecord_irc_total_amount",
        value: amount || 0,
      });
    } catch (e) {
      log.error("beforeSubmit", e.message);
    }
  };

  function percentToDecimal(percentStr) {
    return parseFloat(percentStr) / 100;
  }

  const afterSubmit = (context) => {
    try {
      const DEFAULT = 12;
      const rec = context.newRecord;
      const oldRec = context.oldRecord;
      const RETURNABLE = 2;
      const NONRETURNABLE = 1;
      const ADJUSTMENTITEM = 917;
      /**
       * Update processing of the PO and Bill if there's changes in
       */
      const masterReturnId = rec.getValue(
        "custrecord_irs_master_return_request"
      );

      const billId = rec.getValue("custrecord_rxrs_bill_internal_id");
      const poId = rec.getValue("custrecord_rxrs_po_internal_id");
      let irsRec = record.load({
        type: "customrecord_cs_item_ret_scan",
        id: rec.id,
        isDefault: true,
      });
      let params = {};
      let adjustmentPercent;
      if (billId) {
        // log.debug("Update Processing");
        // params.id = billId;
        // params.type = record.Type.VENDOR_BILL;
        // rxrs_tranlib.updateProcessing(params);
        let rsSearch = search.lookupFields({
          type: "vendorbill",
          id: billId,
          columns: [
            "custbody_rxrs_returnable_fee",
            "custbody_rxrs_non_returnable_rate",
          ],
        });

        adjustmentPercent =
          percentToDecimal(rsSearch.custbody_rxrs_returnable_fee) -
          percentToDecimal(rsSearch.custbody_rxrs_non_returnable_rate);
        log.debug("adjustmentPercent", adjustmentPercent);
      }
      if (poId) {
        params.id = poId;
        params.type = record.Type.PURCHASE_ORDER;
        rxrs_tranlib.updateProcessing(params);
      }
      const oldPharmaProcessing = oldRec.getValue(
        "custrecord_cs__rqstprocesing"
      );
      const newPharmaProcessing = rec.getValue("custrecord_cs__rqstprocesing");
      // const oldMFGProcessing = oldRec.getValue("custrecord_cs__mfgprocessing");
      // const newMFGProcessing = rec.getValue("custrecord_cs__mfgprocessing");

      log.emergency("Pharma Processing", {
        oldPharmaProcessing,
        newPharmaProcessing,
      });
      let notEqualPharma =
        oldPharmaProcessing == RETURNABLE &&
        newPharmaProcessing == NONRETURNABLE;

      if (notEqualPharma) {
        let defaultBillId = rxrs_tranlib.getBillId({
          paymentId: DEFAULT,
          masterReturnId: masterReturnId,
        });
        const billStatus = rxrs_tranlib.getCertainField({
          id: defaultBillId,
          type: "vendorbill",
          columns: "status",
        });
        let accruedAmount = 0;
        let adjustmentAmount =
          adjustmentPercent * rec.getValue("custrecord_irc_total_amount");
        log.debug("adjustmentAmount", adjustmentAmount);
        if (billStatus == "paidInFull") {
          log.debug("billId", defaultBillId != billId);
          if (defaultBillId != billId) {
            try {
              let vbRec = record.load({
                type: record.Type.VENDOR_BILL,
                id: billId,
              });
              for (let i = 0; i < vbRec.getLineCount("item"); i++) {
                const mfgProcessing = vbRec.getSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_rxrs_mfg_processing",
                  line: i,
                });
                const pharmaProcessing = vbRec.getSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_rxrs_pharma_processing",
                  line: i,
                });

                log.debug("processing", {
                  line: i,
                  pharma: pharmaProcessing,
                  mfg: mfgProcessing,
                });
                if (
                  pharmaProcessing == NONRETURNABLE &&
                  mfgProcessing == RETURNABLE
                ) {
                  log.debug("processing", {
                    line: i,
                    pharma: pharmaProcessing,
                    mfg: mfgProcessing,
                  });
                  let amount = vbRec.getSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    line: i,
                  });

                  accruedAmount += amount;
                }
              }
              log.debug("accruedAmount", accruedAmount);
              let lastIndex = vbRec.getLineCount({ sublistId: "item" });
              vbRec = rxrs_tranlib.setAdjustmentFee({
                vbRec: vbRec,
                irsId: rec.id,
                adjustmentAmount: adjustmentAmount,
                lastIndex: lastIndex,
              });

              if (accruedAmount > 0) {
                let lastIndex = vbRec.getLineCount({ sublistId: "item" });
                vbRec = rxrs_tranlib.addAccruedPurchaseItem({
                  ACCRUEDPURCHASEITEM: ACCRUEDPURCHASEITEM,
                  vbRec: vbRec,
                  lastIndex: lastIndex,
                  accruedAmount: accruedAmount,
                });
              }
              rxrs_tranlib.addAcrruedAmountBasedonTransaction(vbRec);

              // vbRec.save({ ignoreMandatoryFields: true });
            } catch (e) {
              log.error("ADDING ADJUMENT AND ACCRUED PURCHASE", e.message);
            }
          }
        } else {
          log.emergency("Default Bill not paid in Full");
          let stSuiteletUrl = url.resolveScript({
            scriptId: "customscript_sl_cs_custom_function",
            deploymentId: "customdeploy_sl_cs_custom_function",
            returnExternalUrl: true,
            params: {
              action: "reloadBill",
              billId: "defaultBillId",
            },
          });
          let response = https.post({
            url: stSuiteletUrl,
          });
          log.emergency("reloadBill response", response);
          if (defaultBillId != billId) {
            log.debug("NOT DEFAULT BILL");
            let vbRec = record.load({
              type: record.Type.VENDOR_BILL,
              id: billId,
            });

            let vbRecDefault = record.load({
              type: record.Type.VENDOR_BILL,
              id: defaultBillId,
            });
            let lastIndex = vbRecDefault.getLineCount({ sublistId: "item" });
            vbRecDefault = rxrs_tranlib.setAdjustmentFee({
              vbRec: vbRecDefault,
              irsId: rec.id,
              adjustmentAmount: adjustmentAmount,
              lastIndex: lastIndex,
            });
            // vbRec = rxrs_tranlib.createAllServiceFees(
            //   record.load({
            //     type: record.Type.VENDOR_BILL,
            //     id: defaultBillId,
            //   })
            // );
            vbRecDefault.save({ ignoreMandatoryFields: true });
            rxrs_tranlib.addAcrruedAmountBasedonTransaction(vbRec);
          } else {
            log.audit("adjusting default bill");
            let vbRec = record.load({
              type: record.Type.VENDOR_BILL,
              id: defaultBillId,
            });
            let lastIndex = vbRec.getLineCount({ sublistId: "item" });
            vbRec = rxrs_tranlib.setAdjustmentFee({
              vbRec: vbRec,
              irsId: rec.id,
              adjustmentAmount: adjustmentAmount,
              lastIndex: lastIndex,
            });
            let vbId = vbRec.save({ ignoreMandatoryFields: true });

            rxrs_tranlib.createAllServiceFees(vbId);
          }
        }

        // log.emergency("defaultBillId", { defaultBillId, poId });
        // if (defaultBillId && poId) {
        //   let deletedBill = record.delete({
        //     type: record.Type.VENDOR_BILL,
        //     id: defaultBillId,
        //   });
        //   if (deletedBill) {
        //     let newDefaultBillId = rxrs_tranlib.createBill({
        //       poId: rec.getValue("custrecord_rxrs_po_internal_id"),
        //       finalPaymentSchedule: DEFAULT,
        //     });
        //     log.emergency("newDefaultBillId", newDefaultBillId);
        //   }
        // }
      }

      let inDays = rxrs_util.getIndays(rec.id);
      let isDefault = Math.sign(inDays) == -1;
      let paymentSchedId =
        isDefault == true
          ? rxrsPayment_lib.getPaymentSched(Math.abs(inDays))
          : 12;
      log.audit("InDays and Payment Sched", {
        inDays,
        paymentSchedId,
        isDefault,
      });
      if (paymentSchedId && isDefault === true) {
        irsRec.setValue({
          fieldId: "custrecord_scan_paymentschedule",
          value: +paymentSchedId,
        });
        irsRec.setValue({
          fieldId: "custrecord_final_payment_schedule",
          value: DEFAULT,
        });
        irsRec.setValue({
          fieldId: "custrecord_scanindated",
          value: true,
        });
      } else {
        log.audit("Setting indated to false", rec.id);
        irsRec.setValue({
          fieldId: "custrecord_scanindated",
          value: false,
        });
      }
      let isIndate = irsRec.getValue("custrecord_scanindated");
      let pharmaProcessing = irsRec.getValue("custrecord_cs__rqstprocesing");

      if (
        (isIndate == false && pharmaProcessing == 2) ||
        pharmaProcessing == 1
      ) {
        irsRec.setValue({
          fieldId: "custrecord_final_payment_schedule",
          value: DEFAULT,
        });
        irsRec.setValue({
          fieldId: "custrecord_scan_paymentschedule",
          value: DEFAULT,
        });
      }
      if (notEqualPharma) {
        irsRec.setValue({
          fieldId: "customrecord_cs_item_ret_scan",
          value: true,
        });
      }
      irsRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("afterSubmit", e.message);
    }
  };

  return { beforeSubmit, afterSubmit };
});
