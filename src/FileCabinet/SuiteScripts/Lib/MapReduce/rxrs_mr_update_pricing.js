/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
  'N/file',
  'N/runtime',
  'N/record',
  'N/search',
  '../rxrs_csv_import_lib.js',
  '../rxrs_item_lib',
  '../rxrs_custom_rec_lib',
  '../rxrs_util',
  '../FDB Scripts/lib/rxrs_fdb_item_lib',
  'N/log',
], /**
 * @param{record} record
 * @param{search} search
 */ (file, runtime, record, search, csvLib, itemLib, customRec, util, fdbItemLib, log) => {
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

  const priceLevels = {
    wholeSaleAcqCost: 17,
  };
  const getInputData = (inputContext) => {
    const functionName = 'getInputData';

    log.audit(functionName, '************ EXECUTION STARTED ************');
    try {
      const params = getParameters();
      log.audit('params', params);

      const fileObj = file.load({
        id: util.getFileId(params.fileName),
      });
      switch (params.action) {
      case 'UPSERT_PRICING':
        return csvLib.getPricing(fileObj);
        break;
      case 'UPSERT_ITEM':
        return csvLib.getItemDetails(fileObj.getContents());
        break;
      default:
        log.error('default selected');
      }
    } catch (e) {
      log.error('getInputData', e.message);
    }
  };

  const reduce = (reduceContext) => {
    const functionName = 'reduce';
    const data = JSON.parse(reduceContext.values);
    log.debug({
      title: 'data',
      details: data,
    });
    switch (getParameters().action) {
    case 'UPSERT_PRICING':
      try {
        const {
          updateCode, NDC, priceType, date, price,
        } = data;
        const itemId = itemLib.getItemId(parseFloat(NDC));
        if (itemId) {
          if (updateCode === 'A') {
            log.audit('data', data);
            const updatedItem = itemLib.updateItemPricing({
              itemId,
              rate: parseFloat(price),
              priceLevel: priceLevels.wholeSaleAcqCost,
            });
            if (updatedItem) {
              const priceHistoryId = customRec.createPriceHistory({
                itemId,
                date,
                priceType,
                newPrice: parseFloat(price),
              });
              log.audit('Created Price History Id ', { priceHistoryId, NDC });
            }
          } else {
            customRec.deletePriceHistory({
              itemId,
              date,
              priceType,
            });
          }
        }
      } catch (e) {
        log.error('UPSERT_PRICING', e.message);
      }
      break;
    case 'UPSERT_ITEM':
      try {
        fdbItemLib.updateCreateItemPricing(data);
      } catch (e) {
        log.error('UPSERT_ITEM', e.message);
      }
      break;
    default:
      log.error('DEFAULT');
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
    const params = getParameters();
    util.moveFolderToDone({
      fileId: util.getFileId(params.fileName),
      folderId: params.doneFolderId,
    });
    const functionName = 'summarize';
    log.audit(functionName, {
      UsageConsumed: summaryContext.usage,
      NumberOfQueues: summaryContext.concurrency,
      NumberOfYields: summaryContext.yields,
    });
    log.audit(functionName, '************ EXECUTION COMPLETED ************');
  };
  /**
   * Get Script Parameters
   */
  const getParameters = () => {
    let objParams = {};

    const objScript = runtime.getCurrentScript();
    objParams = {
      doneFolderId: objScript.getParameter({
        name: 'custscript_processed_folder_id',
      }),
      fileName: objScript.getParameter({
        name: 'custscript_filename',
      }),
      pendingFolderId: objScript.getParameter({
        name: 'custscript_folder_id',
      }),
      action: objScript.getParameter({
        name: 'custscript_rxrs_fileimportaction',
      }),
    };

    return objParams;
  };

  function isEmpty(stValue) {
    return (
      stValue === ''
      || stValue == null
      || false
      || (stValue.constructor === Array && stValue.length == 0)
      || (stValue.constructor === Object
        && (function (v) {
          for (const k in v) return false;
          return true;
        }(stValue)))
    );
  }

  return { getInputData, reduce, summarize };
});
