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
   * @param options.rate
   * @param options.priceLevel
   * @return the update internal id of the item
   */
  function updateItemPricing(options) {
    log.audit("updateItemPricing", options);
    let { itemId, rate, priceLevel } = options;
    const itemRec = record.load({
      type: record.Type.INVENTORY_ITEM,
      id: itemId,
      isDynamic: true,
    });

    let priceLevelValue;
    for (let i = 0; i < itemRec.getLineCount("price1"); i++) {
      itemRec.selectLine({
        sublistId: "price1",
        line: i,
      });
      priceLevelValue = itemRec.getCurrentSublistValue({
        sublistId: "price1",
        fieldId: "pricelevel",
      });
      if (priceLevelValue == priceLevel) {
        itemRec.setCurrentSublistValue({
          sublistId: "price1",
          fieldId: "price_1_",
          value: rate,
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

  /**
   * Get the dosage internal Id based on Name
   * @param name
   */
  function dosageSearch(name) {
    log.audit("dosageSearch", name);
    try {
      let dosageInternalId = null;
      const customlist_dosageformSearchObj = search.create({
        type: "customlist_dosageform",
        filters: [["name", "is", name]],
        columns: [
          search.createColumn({
            name: "name",
            label: "Name",
          }),
        ],
      });

      customlist_dosageformSearchObj.run().each(function (result) {
        dosageInternalId = result.id;
      });
      return dosageInternalId;
    } catch (e) {
      log.error("dosageSearch", e.message);
    }
  }

  return {
    updateItemPricing: updateItemPricing,
    getItemId: getItemId,
  };
});
