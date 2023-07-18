/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 * @param{search} search
 */ (record, search) => {
  /**
   * Create Bin Record
   * @param {number}  options.mrrId Master Return Id
   * @param {number} options.entity entity Internal Id
   * @param {number} options.manufId Manufacturer internal Id
   * @param {number} options.rrId return Request Id
   * @param {number} options.prevBag Previous Bag of the return item scan
   * @return {number} binId
   */
  function createBin(options) {
    try {
      log.audit("createBin", options);
      const binRec = record.create({
        type: "customrecord_kd_taglabel",
      });
      binRec.setValue({
        fieldId: "custrecord_kd_mrr_link",
        value: options.mrrId,
      });
      binRec.setValue({
        fieldId: "custrecord_kd_mfgname",
        value: options.manufId,
      });
      binRec.setValue({
        fieldId: "custrecord_kd_tag_return_request",
        value: options.rrId,
      });
      binRec.setValue({
        fieldId: "custrecord_kd_tag_return_request",
        value: options.rrId,
      });
      binRec.setValue({
        fieldId: "custrecord_tagentity",
        value: options.entity,
      });

      return binRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("createBin", e.message);
    }
  }

  /**
   * Update the status of the item return scan
   * @param {number} options.ids Internal Id of the return item scan
   * @param {boolean} options.isVerify
   * @param {number} options.bagId
   * @param {number} options.prevBag
   * @param
   * @return {number} item return scan Id
   */
  function updateBagLabel(options) {
    try {
      log.audit("updateBagLabel", options);
      record.submitFields.promise({
        type: "customrecord_cs_item_ret_scan",
        id: +options.ids,
        values: {
          custrecord_is_verified: options.isVerify,
          custrecord_scanbagtaglabel: +options.bagId,
          custrecord_prev_bag_assignement: options.prevBag,
        },
      });
      if (options.prevBag != null) {
        record.submitFields.promise({
          type: "customrecord_kd_taglabel",
          id: +options.prevBag,
          values: {
            custrecord_is_inactive: true,
          },
        });
      }
    } catch (e) {
      log.error("updateBagLabel", e.message);
    }
  }

  return {
    createBin,
    updateBagLabel,
  };
});
