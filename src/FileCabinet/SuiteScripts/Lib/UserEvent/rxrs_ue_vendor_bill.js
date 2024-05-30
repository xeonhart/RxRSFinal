/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["../rxrs_transaction_lib", "../rxrs_verify_staging_lib"], (
  rxrs_tran_lib,
  rxrs_vs_lib,
) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {};

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */

  const beforeSubmit = (scriptContext) => {
    if (scriptContext.type == "delete") return;
    const ACCRUEDPURCHASEITEM = 916;
    const RETURNABLE = 2;
    const NONRETURNABLE = 1;
    const RETURNABLESERVICEFEEITEM = 882;
    const NONRETURNABLESERVICEFEEITEM = 883;
    const rec = scriptContext.newRecord;

    try {
      let mrrId = rec.getValue("custbody_kd_master_return_id");
      let returnableAmount = rxrs_vs_lib.getMrrIRSTotalAmount({
        mrrId: mrrId,
        pharmaProcessing: RETURNABLE,
        mfgProcessing: RETURNABLE,
      });
      let nonReturnableAmount = rxrs_vs_lib.getMrrIRSTotalAmount({
        mrrId: mrrId,
        pharmaProcessing: NONRETURNABLE,
        mfgProcessing: NONRETURNABLE,
      });
      const nonReturnableFeeRate =
        rec.getValue("custbody_rxrs_non_returnable_rate") / 100;
      const returnableFeeRate =
        rec.getValue("custbody_rxrs_returnable_fee") / 100;
      let accruedAmount = 0;
      const finalPaymentSchedule = rec.getValue("custbody_kodpaymentsched");
      log.debug("finalPaymentSchedule", finalPaymentSchedule);

      if (finalPaymentSchedule && scriptContext.type === "create") {
        rxrs_tran_lib.removeVBLine({
          vbRec: rec,
          finalPaymentSchedule: finalPaymentSchedule,
          updateLine: false,
        });
      }

      if (finalPaymentSchedule != 12) return;
      for (let i = 0; i < rec.getLineCount("item"); i++) {
        const mfgProcessing = rec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_kod_mfgprocessing",
          line: i,
        });
        const pharmaProcessing = rec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_kod_rqstprocesing",
          line: i,
        });
        let quantity = rec.getSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          line: i,
        });
        let rate = rec.getSublistValue({
          sublistId: "item",
          fieldId: "rate",
          line: i,
        });

        if (pharmaProcessing == NONRETURNABLE && mfgProcessing == RETURNABLE) {
          let amount = rec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
          let item = rec.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          if (item != 917) {
            amount = amount === 0 ? rate * quantity : amount;
            rec.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: amount,
              line: i,
            });
            accruedAmount += rec.getSublistValue({
              sublistId: "item",
              fieldId: "amount",
              line: i,
            });
          }

          log.debug("amount: ", { i, amount, accruedAmount });
        }

        if (pharmaProcessing == RETURNABLE) {
          let amount = rec.getSublistValue({
            sublistId: "item",
            fieldId: "amount",
            line: i,
          });
          amount = amount === 0 ? rate * quantity : amount;

          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: amount,
            line: i,
          });
        }
      }
      if (nonReturnableFeeRate) {
        const serviceFeeAmount = +nonReturnableAmount * +nonReturnableFeeRate;
        log.debug("addBillProcessingFee values", {
          nonReturnableFeeRate,
          serviceFeeAmount,
          nonReturnableAmount,
        });
        let nonReturnableServiceFeeIndex = rec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "item",
          value: NONRETURNABLESERVICEFEEITEM,
        });
        if (nonReturnableServiceFeeIndex != -1) {
          rec.removeLine({
            sublistId: "item",
            line: nonReturnableServiceFeeIndex,
          });
          const lastIndex = rec.getLineCount({ sublistId: "item" });
          rec.insertLine({ sublistId: "item", line: lastIndex });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: NONRETURNABLESERVICEFEEITEM,
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
        } else {
          const lastIndex = rec.getLineCount({ sublistId: "item" });
          rec.insertLine({ sublistId: "item", line: lastIndex });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: NONRETURNABLESERVICEFEEITEM,
            line: lastIndex,
          });

          rec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
        }
      }
      if (returnableFeeRate) {
        const serviceFeeAmount = +returnableAmount * +returnableFeeRate;
        log.debug("addBillProcessingFee values", {
          returnableFeeRate,
          serviceFeeAmount,
          returnableAmount,
        });
        let returnableServiceFeeIndex = rec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "item",
          value: RETURNABLESERVICEFEEITEM,
        });
        if (returnableServiceFeeIndex != -1) {
          rec.removeLine({
            sublistId: "item",
            line: returnableServiceFeeIndex,
          });
          const lastIndex = rec.getLineCount({ sublistId: "item" });
          rec.insertLine({ sublistId: "item", line: lastIndex });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: RETURNABLESERVICEFEEITEM,
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
        } else {
          const lastIndex = rec.getLineCount({ sublistId: "item" });
          rec.insertLine({ sublistId: "item", line: lastIndex });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: RETURNABLESERVICEFEEITEM,
            line: lastIndex,
          });

          rec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(serviceFeeAmount),
            line: lastIndex,
          });
        }
      }
      if (accruedAmount > 0) {
        let accruedItemIndex = rec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "item",
          value: ACCRUEDPURCHASEITEM,
        });
        if (accruedItemIndex != -1) {
          rec.removeLine({
            sublistId: "item",
            line: accruedItemIndex,
          });
          const lastIndex = rec.getLineCount({ sublistId: "item" });
          rec.insertLine({ sublistId: "item", line: lastIndex });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: ACCRUEDPURCHASEITEM,
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
        } else {
          const lastIndex = rec.getLineCount({ sublistId: "item" });
          rec.insertLine({ sublistId: "item", line: lastIndex });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: ACCRUEDPURCHASEITEM,
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "amount",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
          rec.setSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: -Math.abs(accruedAmount),
            line: lastIndex,
          });
        }
      }
    } catch (e) {
      log.error("beforeSubmit", e.message);
    }
  };

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {};

  return { beforeLoad, beforeSubmit, afterSubmit };
});
