/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 * @param{search} search
 */ (record, search) => {
  /**
   * Get the Payment ID based on the in Days
   * @param {string} inDays in days
   */
  function getPaymentSched(inDays) {
    try {
      log.audit("getPaymentSched InDays", inDays);
      let paymentInternalId;
      const customrecord_kd_payment_scheduleSearchObj = search.create({
        type: "customrecord_kd_payment_schedule",
        filters: [
          ["custrecord_kd_paysched_max_days", "greaterthanorequalto", inDays],
          "AND",
          ["custrecord_kd_paysched_min_days", "lessthanorequalto", inDays],
        ],
        columns: [
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
            label: "Name",
          }),
          search.createColumn({ name: "scriptid", label: "Script ID" }),
          search.createColumn({
            name: "custrecord_kd_paysched_min_days",
            label: "Minimum Days",
          }),
          search.createColumn({
            name: "custrecord_kd_paysched_max_days",
            label: "Maximum Days",
          }),
        ],
      });
      customrecord_kd_payment_scheduleSearchObj.run().each(function (result) {
        paymentInternalId = result.id;
        return true;
      });
      return paymentInternalId;
    } catch (e) {
      log.error("getPaymentSched", e.message);
    }
  }

  /**
   * Delete Payment Record
   * @param {number} paymentId
   */
  function deletePaymentSched(paymentId) {
    try {
      let paymentSearch = search.lookupFields({
        type: "customrecord_kd_payment_schedule",
        id: paymentId,
        columns: ["custrecord_psf_custom_payment"],
      });

      if (paymentSearch.custrecord_psf_custom_payment == false) return;
      record.delete({
        type: "customrecord_kd_payment_schedule",
        id: paymentId,
      });
    } catch (e) {
      log.error("deletePaymentSched", e.message);
    }
  }

  return { getPaymentSched, deletePaymentSched };
});
