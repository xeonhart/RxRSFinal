/**
 * @NApiVersion 2.1
 */
define(["N/file", "N/record", "N/search"] /**
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */, (file, record, search) => {
  /**
   * This function maps the column line for SPR and iterate each line and return the line object
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

  return {
    getPricing: getPricing,
  };
});
