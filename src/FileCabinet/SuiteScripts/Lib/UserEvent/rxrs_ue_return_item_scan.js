/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "../rxrs_verify_staging_lib"]
/**
 * @param{record} record
 * @param{search} search
 */, (record, search, rxrs_util) => {
  const PACKAGESIZE = {
    PARTIAL: 2,
    FULL: 1,
  };

  const beforeSubmit = (context) => {
    try {
      const rec = context.newRecord;
      const fulPartialPackage = rec.getValue(
        "custrecord_cs_full_partial_package"
      );
      const item = rec.getValue("custrecord_cs_return_req_scan_item");
      const qty = rec.getValue("custrecord_cs_qty");
      const packageSize = rec.getValue("custrecord_cs_package_size")
      const partialCount = rec.getValue("custrecord_scanpartialcount")
      const rate = rxrs_util.getWACPrice(item);
      let amount = 0;
      const isOverrideRate = rec.getValue("custrecord_isc_overriderate")
      const inputRate = rec.getValue("custrecord_isc_inputrate") ? rec.getValue("custrecord_isc_inputrate") : 0
      const selectedRate = rec.getValue("custrecord_scanrate") ? rec.getValue("custrecord_scanrate") : 0
      let WACAmount = 0;
      if (fulPartialPackage == PACKAGESIZE.FULL) {
        WACAmount = +qty * +rate
        log.debug("values", {isOverrideRate,selectedRate,qty})
        amount = isOverrideRate == true ? +inputRate * +qty  :  +selectedRate * qty
      }else{
//[Quantity x (Partial Count/Std Pkg Size (Item Record))] * Rate
        amount  = isOverrideRate == true ?  +qty * (partialCount/packageSize) * +inputRate :  +qty * (partialCount/packageSize) * +selectedRate
        WACAmount = qty * (partialCount/packageSize) * rate
      }
      log.debug("beforeSubmit amount", {WACAmount, amount})
      rec.setValue({
        fieldId: "custrecord_wac_amount",
        value: WACAmount || 0
      })
      rec.setValue({
        fieldId: "custrecord_irc_total_amount",
        value: amount || 0
      })
    } catch (e) {
      log.error("beforeSubmit", e.message);
    }
  };

  return { beforeSubmit };
});
