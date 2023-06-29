/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define([
  "N/record",
  "N/runtime",
  "./Lib/rxrs_util",
  "N/task",
]
/**
 * @param{record} record
 * @param{runtime} runtime
 */, (record, runtime, rxrsUtil,task) => {
  /**
   * Defines the WorkflowAction script trigger point.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
   * @param {string} scriptContext.type - Event type
   * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
   * @since 2016.1
   */
  const onAction = (context) => {
    try {
      const QUICKCASH = 4;
      const masterRec = context.newRecord;
      const masterRecId = masterRec.id;
      const customer = masterRec.getValue({
        fieldId: "custrecord_mrrentity",
      });
      const planSelectionType = masterRec.getValue(
        "custrecord_mrrplanselectiontype"
      );

      const RXOTC = masterRec.getValue("custrecord_kd_rxotc");
      log.debug({ title: "RXOTC ", details: RXOTC });
      const RXOTCFile = masterRec.getValue("custrecord_kd_mrr_rx_otc_file");
      const C2 = masterRec.getValue("custrecord_kd_c2");
      log.debug({ title: "C2 ", details: C2 });
      const C2File = masterRec.getValue("custrecord_kd_mrr_c2_file");

      const C3to5 = masterRec.getValue("custrecord_kd_c3to5");
      log.debug({ title: "C3to5 ", details: C3to5 });
      const C3to5File = masterRec.getValue("custrecord_kd_mrr_c3_5_file");
      log.debug({ title: "C3to5File ", details: C3to5File });
      const isLicenseExpired = masterRec.getValue(
        "custrecord_kd_license_expired"
      );
      const isStateLicenseExpired = masterRec.getValue(
        "custrecord_kd_state_license_expired"
      );

      let rrCategory = [];
      if (RXOTC === true) {
        const numOfLabels = masterRec.getValue(
          "custrecord_kd_mrr_rx_otc_no_labels"
        );
        const requestedDate = masterRec.getValue(
          "custrecord_kd_mrr_rx_otc_pickup_date"
        );
        let item = planSelectionType == QUICKCASH ? 889 : 626;
        rrCategory.push({
          category: 1,
          numOfLabels: numOfLabels,
          file: RXOTCFile,
          item: item,
          requestedDate: requestedDate,
          masterRecId: masterRecId,
          customer: customer,
          isLicenseExpired: isLicenseExpired,
          isStateLicenseExpired: isStateLicenseExpired,
          planSelectionType: planSelectionType,
        });

        //  createReturnRequest(masterRecId, customer, 1, RXOTCFile, 626, requestedDate, isLicenseExpired, isStateLicenseExpired)
      }

      if (C2 === true) {
        const numOfLabels = masterRec.getValue(
          "custrecord_kd_mrr_c2_no_labels"
        );
        const requestedDate = masterRec.getValue(
          "custrecord_kd_mrr_c2_pickup_date"
        );
        let item = planSelectionType == QUICKCASH ? 892 : 628;
        rrCategory.push({
          category: 3,
          numOfLabels: numOfLabels,
          file: C2File,
          item: item,
          requestedDate: requestedDate,
          masterRecId: masterRecId,
          customer: customer,
          isLicenseExpired: isLicenseExpired,
          isStateLicenseExpired: isStateLicenseExpired,
          planSelectionType: planSelectionType,
        });

        // createReturnRequest(masterRecId, customer, 3, C2File, 628, requestedDate, isLicenseExpired, isStateLicenseExpired)
      }
      if (C3to5 === true) {
        const numOfLabels = masterRec.getValue(
          "custrecord_kd_mrr_c3_5_no_labels"
        );
        const requestedDate = masterRec.getValue(
          "custrecord_kd_mrr_c3_5_pickup_date"
        );
        log.debug("numOfLabels " + numOfLabels);
        let item = planSelectionType == QUICKCASH ? 893 : 627;
        rrCategory.push({
          category: 4,
          numOfLabels: numOfLabels,
          file: C3to5File,
          item: item,
          requestedDate: requestedDate,
          masterRecId: masterRecId,
          customer: customer,
          isLicenseExpired: isLicenseExpired,
          isStateLicenseExpired: isStateLicenseExpired,
          planSelectionType: planSelectionType,
        });

        //  createReturnRequest(masterRecId, customer, 4, C3to5File, 627, requestedDate, isLicenseExpired, isStateLicenseExpired)
      }
      const totalNumberOfLabels = rrCategory.reduce(
        (sum, { numOfLabels }) => sum + numOfLabels,
        0
      );

      let returnPackage = [];
      returnPackage.push( rxrsUtil.createReturn2())
      log.debug("returnPackage",returnPackage)
      // if (totalNumberOfLabels < 50) {
      //   log.debug("less 50")
      //   rrCategory.forEach((rrCategory) => {
      //     log.debug("rrCategory",rrCategory)
      //     let packageObj = rxrsUtil.createReturn2();
      //      log.debug("packageObj", packageObj);
      //     for (let i = 0; i < packageObj.numOfLabels; i++) {
      //       rxrsUtil.createReturnPackages(packageObj);
      //     }
      //   });
      // } else {
      //   rrCategory.forEach((rrCategory) => {
      //     returnPackage.push(rxrsUtil.createReturnRequest(rrCategory));
      //   });
      //   const mrTask = task.create({
      //     taskType: task.TaskType.MAP_REDUCE,
      //     scriptId: runtime
      //       .getCurrentScript()
      //       .getParameter("custscript_rxrs_wfa_mr_script_id"),
      //     deploymentId: runtime
      //       .getCurrentScript()
      //       .getParameter("custscript_rxrs_wfa_mr_dep_id"),
      //     params: {
      //       custscript_rxrs_category: returnPackage,
      //     },
      //   });
      //   const mrTaskId = mrTask.submit();
      //   log.debug("mr TaskID", mrTaskId);
      // }

      log.audit("returnPackage", returnPackage);
    } catch (e) {
      log.error("onAction", e.message);
    }
  };

  return { onAction };
});
