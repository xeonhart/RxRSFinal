/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/search"] /**
 * @param{record} record
 * @param{search} search
 */, (record, search) => {
  /**
   * Function Update Item Price
   * @param options.itemId
   * @param options.newWacAmount
   */
  function updateItemPricing(options) {
    let { itemId, newWacAmount } = options;
    const itemRec = record.load({
      type: record.Type.INVENTORY_ITEM,
      id: itemId,
      isDynamic: true,
    });

    let priceLevel;

    for (let i = 0; i < itemRec.getLineCount("price1"); i++) {
      itemRec.selectLine({
        sublistId: "price1",
        line: i,
      });
      priceLevel = itemRec.getCurrentSublistValue({
        sublistId: "price1",
        fieldId: "pricelevel",
      });
      if (priceLevel == 1) {
        itemRec.setCurrentSublistValue({
          sublistId: "price1",
          fieldId: "price_1_",
          value: newWacAmount,
          ignoreFieldChange: true,
        });
      }

      itemRec.commitLine("price1");
    }
    return itemRec.save({ ignoreMandatoryFields: true });
  }

  /**
   * Get the item Id
   * @param options
   * @returns {*}
   */
  function getItemId(options) {
    log.audit("getItemId", options);
    let itemId;
    try {
      const itemSearchObj = search.create({
        type: "item",
        filters: [["name", "is", options.toString()]],
      });
      const searchResultCount = itemSearchObj.runPaged().count;
      //  log.audit("searchResultcount", { searchResultCount, options });
      itemSearchObj.run().each(function (result) {
        itemId = result.id;
      });
      if (itemId) {
        log.audit("res", itemId);
        return itemId;
      }
    } catch (e) {
      log.error("getItemId", e.message);
    }
  }

  return {
    updateItemPricing: updateItemPricing,
    getItemId: getItemId,
  };
});
