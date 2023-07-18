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
        let ids = JSON.parse(params.custscript_payload);
        let returnScanList = JSON.parse(params.custscript_payload);
        log.debug("returnScanList", returnScanList);
        let idList = [];
        let curAmount = returnScanList.reduce(function (acc, obj) {
          return acc + obj.amount;
        }, 0);
        log.debug("amount", { curAmount, maximumAmount });
        let numberOfBags =
          +maximumAmount > +curAmount ? 1 : +curAmount / +maximumAmount;
        log.debug("numberOfBags", numberOfBags);
        let bags = []
        /**
         * Create Bags label depending on the maximum amount
         */
        let entity = rxrsUtil.getEntityFromMrr(+params.mrrid)
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
        log.audit("bags",bags)
        let bag = [];
        let sum = 0;
        let b = 0;
        for (let i = 0; i < returnScanList.length; i++) {


          sum  += returnScanList[i].amount
          try {
          if(sum <= +maximumAmount){
            let prevBag =returnScanList[i].prevBag
            prevBag = prevBag.split('&')
            prevBag = prevBag[1] // get the id from the URL
            prevBag = prevBag.substring(3,prevBag.length)
            bag.push({
              bag: bags[b],
              scanId: returnScanList[i].id,
              prevBag: prevBag
            })
          if(sum == maximumAmount){
            b += 1
            sum = 0
          }

          }else{
            b += 1
            if(b >= bags.length){
              b = b - 1
            }
            let prevBag =returnScanList[i].prevBag
            prevBag = prevBag.split('&')
            prevBag = prevBag[1] // get the id from the URL
            prevBag = prevBag.substring(3,prevBag.length)
            bag.push({
              bag: bags[b],
              scanId: returnScanList[i].id,
              prevBag: prevBag
            })
            sum = 0
          }
          } catch (e) {
            log.error("for", e.message);
          }
        }
        log.error("bag",bag);

      bag.forEach(b => rxrsBagUtil.updateBagLabel({
        ids: b.scanId,
        isVerify: JSON.parse(params.isVerify),
        bagId: b.bag,
        prevBag: b.prevBag
      }))

      } catch (e) {
        log.error("POST", e.message);
      }
    }
  };

  return { onRequest };
});
