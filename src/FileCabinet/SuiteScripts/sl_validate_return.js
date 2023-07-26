/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/record",
  "./Lib/rxrs_verify_staging_lib",
  "./Lib/rxrs_lib_bag_label",
], /**
 * @param{record} record
 */ (record, rxrsUtil, rxrsBagUtil) => {
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
        // if (params.returnType != "Destruction") {
        //   log.audit("Assigning Bag for Returnable Item Scan");
        //   let sum = 0;
        //   let b = 0;
        //   for (let i = 0; i < returnScanList.length; i++) {
        //     sum += returnScanList[i].amount;
        //     let prevBag = returnScanList[i].prevBag;
        //     try {
        //       if (sum <= +maximumAmount) {
        //         if (!rxrsUtil.isEmpty(prevBag)) {
        //           prevBag = prevBag.split("&");
        //           prevBag = prevBag[1]; // get the id from the URL
        //           prevBag = prevBag.substring(3, prevBag.length);
        //         } else {
        //           prevBag = null;
        //         }
        //
        //         if (sum == maximumAmount) {
        //           b += 1;
        //           sum = 0;
        //         }
        //         if (sum == 0 && maximumAmount == 0) {
        //           b = 0;
        //         }
        //         bag.push({
        //           bag: bags[b],
        //           scanId: returnScanList[i].id,
        //           prevBag: prevBag,
        //         });
        //       } else {
        //         b += 1;
        //         if (b >= bags.length) {
        //           b = b - 1;
        //         }
        //
        //         if (!rxrsUtil.isEmpty(prevBag)) {
        //           prevBag = prevBag.split("&");
        //           prevBag = prevBag[1]; // get the id from the URL
        //           prevBag = prevBag.substring(3, prevBag.length);
        //         } else {
        //           prevBag = null;
        //         }
        //         bag.push({
        //           bag: bags[b],
        //           scanId: returnScanList[i].id,
        //           prevBag: prevBag,
        //         });
        //
        //         sum = 0;
        //       }
        //     } catch (e) {
        //       log.error("Returnable Bags", e.message);
        //     }
        //   }
        //   log.audit("bag", bag);
        // } else {
        //   log.audit("Assigning Bag for Destruction");
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


        bag.forEach((b) =>
          rxrsBagUtil.updateBagLabel({
            ids: b.scanId,
            isVerify: JSON.parse(params.isVerify),
            bagId: b.bag,
            prevBag: b.prevBag,
          })
        );
        context.response.write("SUCCESSFUL")
      } catch (e) {
        context.response.write("ERROR: " +e.message)
        log.error("POST", e.message);
      }
    }
  };

  return { onRequest };
});
