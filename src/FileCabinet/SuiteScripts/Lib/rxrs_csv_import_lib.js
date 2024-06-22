/**
 * @NApiVersion 2.1
 */
define(["N/file", "N/record", "N/search"] /**
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */, (file, record, search) => {


  const ndcMapping = {
    updateCode: 0,
    NDC: 1,
    PS: 4,
    DF: 5,
    control: 19,
    type: 20,
    DEA: 18,
    OBSDTEC: 26,
    CSP: 32,
    PD: 48,
    LN25I: 48,
    INPCKI: 52,
    OUTPCKI: 53,
    description: 69,
    BN: 8,
    PNDC: 9,
    REPNDC: 10,
    NDCFI: 11
  };

  /**
   * This function maps the column line for pricing and iterate each line and return the line object
   * @param {*} fileObj - CSV file Object
   * @return the object for Processing
   */
  function getPricing(fileObj) {
    log.audit("Get Pricing", fileObj);
    try {
      const pricingToProcess = [];

      const iterator = fileObj.lines.iterator();
      log.debug("iterator", iterator);
      iterator.each(function (line) {
        const initialLineValue = line.value.replace(/;/g, "");
        const lineValues = initialLineValue.split("|");
        const updateCode = lineValues[0];
        const NDC = lineValues[1];
        const priceType = lineValues[2];
        const date = lineValues[3];
        const price = lineValues[4];

        pricingToProcess.push({
          updateCode: updateCode,
          NDC: NDC,
          priceType: priceType,
          date: date,
          price: price,
        });
        return true;
      });
      pricingToProcess.shift();
      //return object and remove the first element

      return pricingToProcess;
    } catch (e) {
      log.error("getPricing ", e.message);
    }
  }

  /**
   * This function maps the column line for item details and iterate each line and return the line object
   * @param {*} fileObj - CSV file Object
   * @return the object for Processing
   */
  function getItemDetails(fileObj) {
    log.audit("Get Item Details", fileObj);
    try {
      const itemToProcess = [];

      let iterator = fileObj.split("\n");
      iterator.shift();
      log.debug("iterator", iterator);
      for (let i = 0; i < 10; i++) {
        let val = iterator[i].split("|");
        const item = {};

        for (const [key, index] of Object.entries(ndcMapping)) {
          item[key] = val[index];
        }
        
        itemToProcess.push(item);
      }
      log.audit("itemToProcess", itemToProcess);
      //return object and remove the first element

      return itemToProcess;
    } catch (e) {
      log.error("getItemDetails ", e.message);
    }
  }

  return {
    getPricing: getPricing,
    getItemDetails: getItemDetails,
  };
});
