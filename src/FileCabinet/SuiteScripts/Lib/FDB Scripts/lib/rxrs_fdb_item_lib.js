/**
 * @NApiVersion 2.1
 */
define(
  ['N/record', 'N/search', 'N/log'], /**
 * @param{record} record
 * @param{search} search
 */ (record, search, log) => {
    /**
     * Check if empty string is passed
     * @param {*} stValue
     */
    const isEmpty = (stValue) => (
      stValue === ''
        || stValue === null
        || stValue === false
        || (Array.isArray(stValue) && stValue.length === 0)
        || (typeof stValue === 'object' && Object.keys(stValue).length === 0)
    );

    const isNotEmpty = (stValue) => (
      stValue !== ''
      && stValue !== null
      && stValue !== false
      && !(Array.isArray(stValue) && stValue.length === 0)
      && !(typeof stValue === 'object' && Object.keys(stValue).length === 0)
    );
    function queryFirstResult(recordType, fieldToFind, fieldValue) {
      const searchObj = search.create({
        type: recordType,
        filters: [search.createFilter({
          name: fieldToFind,
          operator: search.Operator.IS,
          values: fieldValue,
        })],
        columns: [fieldToFind],
      });

      const resultSet = searchObj.run();
      const firstResult = resultSet.getRange({ start: 0, end: 1 });

      if (firstResult && firstResult.length > 0) {
        return firstResult.id;
      }
      return '';
    }

    const parseDateString = (dateString) => {
      if (dateString.length !== 8 || isNaN(dateString)) {
        log.error({
          title: 'INVALID parseDateString',
          details: 'Invalid date string format. Expected format is YYYYMMDD.',
        });
        return '';
      }

      const year = parseInt(dateString.substring(0, 4), 10);
      const month = parseInt(dateString.substring(4, 6), 10) - 1; // Months are 0-based in JavaScript Date
      const day = parseInt(dateString.substring(6, 8), 10);

      return new Date(year, month, day);
    };
    const removeLeadingZeros = (str) => str.replace(/^0+/, '');
    const checkItemExists = (itemId) => {
    // Create a saved search to find the item by its item ID
      const itemSearch = search.create({
        type: search.Type.LOT_NUMBERED_INVENTORY_ITEM,
        filters: [
          ['itemid', search.Operator.IS, itemId],
        ],
        columns: [
          'internalid',
        ],
      });

      const searchResult = itemSearch.run().getRange({
        start: 0,
        end: 1,
      });

      // If there is at least one result, return the internal ID of the item
      if (searchResult.length > 0) {
        return searchResult[0].getValue({ name: 'internalid' });
      }

      // Return null if the item does not exist
      return false;
    };

    const processNdcCustomHandling = ({ objectKey, itemValue }) => {
      // const logTitle = 'processNdcCustomHandling';
      let valueToReturn = '';
      switch (objectKey) {
      case 'PD':
        queryFirstResult('customlist_packagedescription', 'name', itemValue);
        break;
      case 'DEA':
      case 'DF':
      case 'LN25I':
        valueToReturn = parseInt(itemValue, 10) + 1;
        break;
      case 'INPCKI':
      case 'OUTPCKI':
        valueToReturn = false;
        break;
      case 'OBSDTEC':
        valueToReturn = parseInt(itemValue, 10) === 0 ? '' : parseDateString(itemValue);
        break;
      default:
        valueToReturn = '';
        break;
      }
      return valueToReturn;
    };

    const getMapAndUpdateRecord = (itemRec, objToProcess) => {
      const currentRec = itemRec;
      const ndcMapSearch = search.create({
        type: 'customrecord_rxrs_ndc_master_mapping',
        columns:
        [
          search.createColumn({ name: 'custrecord_rxrs_script_object_key', label: 'Obj Key' }),
          search.createColumn({ name: 'custrecord_rxrs_ndc_fieldname', label: 'Field Name' }),
          search.createColumn({ name: 'custrecord_rxrs_item_fieldid_equiv', label: 'Item IntID' }),
          search.createColumn({ name: 'custrecord_rxrs_ndc_customhandling', label: 'Custom Handling?' }),
        ],
      });

      ndcMapSearch.run().each((result) => {
        // Get all fields
        const objectKey = result.getValue({
          name: 'custrecord_rxrs_script_object_key',
        });
        // const fieldName = result.getValue({
        //   name: 'custrecord_rxrs_ndc_fieldname',
        // });
        const itemFieldId = result.getValue({
          name: 'custrecord_rxrs_item_fieldid_equiv',
        });
        const customHandling = result.getValue({
          name: 'custrecord_rxrs_ndc_customhandling',
        });
        let itemValue = objToProcess[objectKey];
        // Create Filter Logic for Body pushing
        if (customHandling === false) {
          if (isEmpty(itemValue) === false) {
            currentRec.setValue({
              fieldId: itemFieldId,
              value: itemValue,
            });
          }
          // Apply Custom Handling
        } else {
          itemValue = processNdcCustomHandling({
            objectKey, itemValue,
          });
          currentRec.setValue({
            fieldId: itemFieldId,
            value: itemValue,
          });
        }


        return true;
      });
      return currentRec;
    };

    /**
   * Function Update Item Price
   * @param options.itemId
   * @param options.rate
   * @param options.priceLevel
   * @return the update internal id of the item
   *
   * test Data:
   * {
        updateCode: "C",
        NDC: "00065042930",
        PS: "00000030.000",
        DF: "2",
        control: "O",
        type: "9",
        DEA: "0",
        OBSDTEC: "20230620",
        CSP: "0",
        PD: "0",
        LN25I: "0",
        INPCKI: "20080925",
        OUTPCKI: "20110928",
        BN: "SYSTANE",
        PNDC: "",
        REPNDC: "",
        NDCFI: "1"
      }
   *
   */
    function updateCreateItemPricing(objToProcess) {
      const itemId = (objToProcess.NDC);
      let itemRec;
      let processType;
      const itemIntId = checkItemExists(itemId);
      if (itemIntId !== false) {
        processType = 'UPDATE';

        itemRec = record.load({
          type: record.Type.LOT_NUMBERED_INVENTORY_ITEM,
          id: itemIntId,
        });
      } else {
        processType = 'UPDATE';
        processType = 'CREATE';
        itemRec = record.create({
          type: record.Type.LOT_NUMBERED_INVENTORY_ITEM,
        });
      }

      itemRec = getMapAndUpdateRecord(itemRec, objToProcess);
      const itemRecId = itemRec.save({ ignoreMandatoryFields: true });
      log.audit({
        title: `itemRec Saved ${processType}`,
        details: itemRecId,
      });
    }

    return {
      updateCreateItemPricing,
    };
  },
);
