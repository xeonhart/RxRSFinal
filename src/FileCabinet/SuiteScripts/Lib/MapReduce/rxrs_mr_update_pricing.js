/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
  "N/file",
  "N/runtime",
  "N/record",
  "N/search",
  "../rxrs_csv_import_lib.js",
  "../rxrs_item_lib",
  "../rxrs_custom_rec_lib",
  "../rxrs_util",
] /**
 * @param{record} record
 * @param{search} search
 */, (file, runtime, record, search, csv_lib, item_lib, custom_rec, util) => {
  /**
   * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
   * @param {Object} inputContext
   * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Object} inputContext.ObjectRef - Object that references the input data
   * @typedef {Object} ObjectRef
   * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
   * @property {string} ObjectRef.type - Type of the record instance that contains the input data
   * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
   * @since 2015.2
   */

  const getInputData = (inputContext) => {
    const functionName = "getInputData";

    log.audit(functionName, "************ EXECUTION STARTED ************");
    try {
      const params = getParameters();
      log.audit("params", params);

      const fileObj = file.load({
        id: util.getFileId(params.fileName),
      });
      switch (params.action) {
        case "UPSERT_PRICING":
          return csv_lib.getPricing(fileObj);
          break;
        case "UPSERT_ITEM":
          return csv_lib.getItemDetails(fileObj.getContents());
          break;
      }
    } catch (e) {
      log.error("getInputData", e.message);
    }
  };

  /**
   * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
   * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
   * context.
   * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
   *     is provided automatically based on the results of the getInputData stage.
   * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
   *     function on the current key-value pair
   * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
   *     pair
   * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} mapContext.key - Key to be processed during the map stage
   * @param {string} mapContext.value - Value to be processed during the map stage
   * @since 2015.2
   */

  const map = (mapContext) => {};

  /**
   * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
   * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
   * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
   *     provided automatically based on the results of the map stage.
   * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
   *     reduce function on the current group
   * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
   * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} reduceContext.key - Key to be processed during the reduce stage
   * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
   *     for processing
   * @since 2015.2
   */
  const reduce = (reduceContext) => {
    const functionName = "reduce";
    const data = JSON.parse(reduceContext.values);

    switch (getParameters().action) {
      case "UPSERT_PRICING":
        try {
          let { updateCode, NDC, priceType, date, price } = data;
          const itemId = item_lib.getItemId(parseFloat(NDC));
          if (itemId) {
            if (updateCode == "A") {
              log.audit("data", data);
              const updatedItem = item_lib.updateItemPricing({
                itemId: itemId,
                newWacAmount: parseFloat(price),
              });
              if (updatedItem) {
                let priceHistoryId = custom_rec.createPriceHistory({
                  itemId: itemId,
                  date: date,
                  priceType: priceType,
                  newPrice: parseFloat(price),
                });
                log.audit("Created Price History Id ", { priceHistoryId, NDC });
              }
            } else {
              custom_rec.deletePriceHistory({
                itemId: itemId,
                date: date,
                priceType: priceType,
              });
            }
          }
        } catch (e) {
          log.error("UPSERT_PRICING", e.message);
        }
        break;
      case "UPSERT_ITEM":
        try {
        } catch (e) {
          log.error("UPSERT_ITEM", e.message);
        }
        break;
    }
  };

  /**
   * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
   * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
   * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
   * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
   *     script
   * @param {Date} summaryContext.dateCreat ed - The date and time when the map/reduce script began running
   * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
   * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
   * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
   *     script
   * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
   * @param {Object} summaryContext.inputSummary - Statistics about the input stage
   * @param {Object} summaryContext.mapSummary - Statistics about the map stage
   * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
   * @since 2015.2
   */
  const summarize = (summaryContext) => {
    let params = getParameters();
    util.moveFolderToDone({
      fileId: util.getFileId(params.fileName),
      folderId: params.doneFolderId,
    });
    const functionName = "summarize";
    log.audit(functionName, {
      UsageConsumed: summaryContext.usage,
      NumberOfQueues: summaryContext.concurrency,
      NumberOfYields: summaryContext.yields,
    });
    log.audit(functionName, "************ EXECUTION COMPLETED ************");
  };
  /**
   * Get Script Parameters
   */
  const getParameters = () => {
    let objParams = {};

    let objScript = runtime.getCurrentScript();
    objParams = {
      doneFolderId: objScript.getParameter({
        name: "custscript_processed_folder_id",
      }),
      fileName: objScript.getParameter({
        name: "custscript_filename",
      }),
      pendingFolderId: objScript.getParameter({
        name: "custscript_folder_id",
      }),
      action: objScript.getParameter({
        name: "custscript_rxrs_fileimportaction",
      }),
    };

    return objParams;
  };

  function isEmpty(stValue) {
    return (
      stValue === "" ||
      stValue == null ||
      false ||
      (stValue.constructor === Array && stValue.length == 0) ||
      (stValue.constructor === Object &&
        (function (v) {
          for (var k in v) return false;
          return true;
        })(stValue))
    );
  }

  return { getInputData, reduce, summarize };
});
