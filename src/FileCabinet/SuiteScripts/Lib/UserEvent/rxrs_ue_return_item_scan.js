/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/record",
  "N/search",
  "../rxrs_verify_staging_lib",
  "../rxrs_payment_sched_lib",
], /**
 * @param{record} record
 * @param{search} search
 * @param rxrs_util
 * @param rxrsPayment_lib
 */ (record, search, rxrs_util, rxrsPayment_lib) => {
  const PACKAGESIZE = {
    PARTIAL: 2,
    FULL: 1,
  };

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
  const afterSubmit = (context) => {
    try {
      const DEFAULT = 12;
      const rec = context.newRecord;
      let irsRec = record.load({
        type: "customrecord_cs_item_ret_scan",
        id: rec.id,
        isDefault: true,
      });
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
      let mfgProcessing = irsRec.getValue("custrecord_cs__mfgprocessing");
      if (isIndate == false && mfgProcessing == 2) {
        irsRec.setValue({
          fieldId: "custrecord_final_payment_schedule",
          value: DEFAULT,
        });
        irsRec.setValue({
          fieldId: "custrecord_scan_paymentschedule",
          value: DEFAULT,
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
