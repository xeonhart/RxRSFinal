/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/record",
  "./Lib/rxrs_verify_staging_lib",
  "./Lib/rxrs_lib_bag_label",
  "./Lib/rxrs_transaction_lib",
], /**
 * @param{record} record
 * @param rxrsUtil
 * @param rxrsBagUtil
 * @param rxrs_tran_lib
 */ (record, rxrsUtil, rxrsBagUtil, rxrs_tran_lib) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (context) => {
    if (context.request.method === "POST") {
      try {
        let params = context.request.parameters;
        let maximumAmount = params.maximumAmount;
        log.debug("Params", params);
        let returnScanList = JSON.parse(params.custscript_payload);
        log.debug("returnScanList", returnScanList);
        let curAmount = returnScanList.reduce(function (acc, obj) {
          return acc + obj.amount;
        }, 0);
        let rrType = params.rrType;
        log.debug("amount", { curAmount, maximumAmount });
        let numberOfBags;
        if (params.returnType != "Destruction") {
          numberOfBags =
            +maximumAmount > +curAmount ? 1 : +curAmount / +maximumAmount;
          log.debug("numberOfBags", numberOfBags);
        } else {
          numberOfBags = 1;
        }
        if (maximumAmount == 0 && curAmount == 0) {
          numberOfBags = 1;
        }

        let bags = [];
        /**
         * Create Bags label depending on the maximum amount
         */
        let entity = rxrsUtil.getEntityFromMrr(+params.mrrid);
        for (let i = 0; i < numberOfBags; i++) {
          bags.push(
            rxrsBagUtil.createBin({
              mrrId: +params.mrrid,
              entity: entity,
              manufId: params.manufId,
              rrId: params.rrId,
            })
          );
        }

        /**
         * Assign Bag to the Item Return Scan
         */
        log.audit("bags", bags);
        let bag = [];

        for (let i = 0; i < returnScanList.length; i++) {
          let prevBag = returnScanList[i].prevBag;
          if (!rxrsUtil.isEmpty(prevBag)) {
            prevBag = prevBag.split("&");
            prevBag = prevBag[1]; // get the id from the URL
            prevBag = prevBag.substring(3, prevBag.length);
          } else {
            prevBag = null;
          }
          bag.push({
            bag: bags[0],
            scanId: returnScanList[i].id,
            prevBag: prevBag,
          });
        }

        bag.forEach((b) => {
          rxrsBagUtil.updateBagLabel({
            ids: b.scanId,
            isVerify: JSON.parse(params.isVerify),
            bagId: b.bag,
            prevBag: b.prevBag,
          });
        });

        if (rrType == "customsale_kod_returnrequest") {

          rxrs_tran_lib.createInventoryAdjustment({
            rrId: params.rrId,
            mrrId: params.mrrid,
          });
        }
        context.response.write("SUCCESSFUL");
      } catch (e) {
        context.response.write("ERROR: " + e.message);
        log.error("POST", e.message);
      }
    }
  };

  return { onRequest };
});
