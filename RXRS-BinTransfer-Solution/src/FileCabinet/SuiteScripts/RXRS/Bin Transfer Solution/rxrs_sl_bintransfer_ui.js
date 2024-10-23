/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 */
define(
  ['N/search',
    'N/record',
    'N/ui/serverWidget',
    'N/url',
    'N/runtime',
    'N/log',
    './lib/rxrs_bintransfer_lib',
  ],
  /**
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
  (search, record, serverWidget, url, runtime, log, rxrsBtsLib) => {
    const mainSearchRec = 'customrecord_kd_taglabel';
    const scanBagTagRec = 'custrecord_scanbagtaglabel';

    const findIndexByName = (arr, searchString, index = 0) => {
      let count = 0; // Counter for occurrences of the searchString

      return arr.findIndex((item) => {
        if (item.name === searchString) {
          if (count === index) {
            return true; // Return true if it's the occurrence we're looking for
          }
          count += 1; // Increment counter for each match
        }
        return false;
      });
    };

    const checkIfNotEmpty = (data) => {
      const returnData = false;
      if (data) {
        return true;
      }
      return returnData;
    };

    const getDateRangeForMonth = (fiscalYear, month) => {
      // Check if fiscalYear or month is null
      if (!fiscalYear || !month) {
        return []; // Return an empty array if either input is null
      }

      const year = fiscalYear.split(' ')[1]; // Extract the year from 'F.Y. 2025'

      // Ensure we have a valid year and month
      if (!year || isNaN(year)) {
        return []; // Return an empty array if year extraction fails
      }

      const startDate = new Date(`${month} 1, ${year}`);

      // Validate if the startDate is a valid date
      if (isNaN(startDate)) {
        return []; // Return an empty array if date creation fails
      }

      const endDate = new Date(startDate);

      // Set end date to the last day of the month
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Moves to the last day of the previous month (January in this case)

      // Format the dates in 'M/D/YYYY'
      const formatDate = (date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      return [formatDate(startDate), formatDate(endDate)];
    };

    const checkIfAddFilters = ({ mySearch, allParams }) => {
      const { manufId } = allParams || '';
      const { rrPoId } = allParams || '';
      const { dateAsOf } = allParams || '';
      const { binNumber } = allParams || '';
      const { indateYearText } = allParams || '';
      const { indateMonthText } = allParams || '';
      const dateMonthRange = getDateRangeForMonth(indateYearText, indateMonthText);
      const { mrrId } = allParams || '';
      const { prodCateg } = allParams || '';

      if (checkIfNotEmpty(manufId)) {
        mySearch.filters.push((search.createFilter({
          name: 'custrecord_kd_mfgname',
          operator: search.Operator.ANYOF,
          values: manufId,
        })));
      }

      if (checkIfNotEmpty(rrPoId)) {
        mySearch.filters.push((search.createFilter({
          name: 'custrecord_kd_tag_return_request',
          operator: search.Operator.ANYOF,
          values: rrPoId,
        })));
      }

      if (checkIfNotEmpty(dateAsOf)) {
        mySearch.filters.push((search.createFilter({
          name: 'custrecord_ret_start_date',
          join: 'CUSTRECORD_SCANBAGTAGLABEL',
          operator: search.Operator.ON,
          values: (dateAsOf),
        })));
      } else if (dateMonthRange.length !== 0) {
        mySearch.filters.push(search.createFilter({
          name: 'custrecord_ret_start_date',
          join: 'custrecord_scanbagtaglabel',
          operator: search.Operator.WITHIN,
          values: dateMonthRange,
        }));
      }

      if (checkIfNotEmpty(binNumber)) {
        mySearch.filters.push((search.createFilter({
          name: 'binnumber',
          join: 'CUSTRECORD_KD_PUTAWAY_LOC',
          operator: search.Operator.CONTAINS,
          values: binNumber,
        })));
      }

      if (checkIfNotEmpty(mrrId)) {
        mySearch.filters.push((search.createFilter({
          name: 'custrecord_kd_mrr_link',
          operator: search.Operator.ANYOF,
          values: mrrId,
        })));
      }

      if (checkIfNotEmpty(prodCateg)) {
        mySearch.filters.push(search.createFilter({
          name: 'custbody_kd_rr_category',
          join: 'CUSTRECORD_KD_TAG_RETURN_REQUEST',
          operator: search.Operator.ANYOF,
          values: prodCateg,
        }));
      }
    };

    const onRequest = (scriptContext) => {
      const page = scriptContext.request.parameters.page || 1;
      const allParams = scriptContext.request.parameters;

      log.debug({
        title: 'Check allParams',
        details: allParams,
      });
      const pageSize = 100;
      const currScriptContext = runtime.getCurrentScript();
      const getBinTransferSearch = currScriptContext.getParameter({
        name: 'custscript_rxrs_bin_transfer_search',
      });
      const sublistId = 'custpage_search_results';

      if (scriptContext.request.method === 'GET') {
        const form = serverWidget.createForm({
          title: 'Bin Transfer Solution',
          hideNavBar: true,
        });

        form.addField({
          id: 'custpage_binnumber',
          label: 'Bin Number',
          type: serverWidget.FieldType.TEXT,
        });
        form.addField({
          id: 'custpage_indateyear',
          label: 'In Date-Year',
          type: serverWidget.FieldType.SELECT,
          source: 'customlist_bin_indate_year_list',
        });
        form.addField({
          id: 'custpage_indatemonth',
          label: 'In Date-Month',
          type: serverWidget.FieldType.SELECT,
          source: 'customlist_bin_list_indate_month_box',
        });
        form.addField({
          id: 'custpage_masterretreq',
          label: 'Master Return Request',
          type: serverWidget.FieldType.SELECT,
          source: 'customrecord_kod_masterreturn',
        });
        form.addField({
          id: 'custpage_retreq_po',
          label: 'Return Request PO',
          type: serverWidget.FieldType.SELECT,
          source: 'custompurchase_returnrequestpo',
        });
        form.addField({
          id: 'custpage_manufacturer',
          label: 'Manufacturer',
          type: serverWidget.FieldType.SELECT,
          source: 'customrecord_csegmanufacturer',
        });
        form.addField({
          id: 'custpage_prodcategory',
          label: 'Product Category',
          type: serverWidget.FieldType.SELECT,
          source: 'customlist_kod_itemcat_list',
        });
        form.addField({
          id: 'custpage_date',
          label: 'Date (As of)',
          type: serverWidget.FieldType.DATE,
        });

        const sublist = form.addSublist({
          id: sublistId,
          type: serverWidget.SublistType.LIST,
          label: 'All Packages Result',
        });

        const mySearch = search.load({
          type: mainSearchRec,
          id: getBinTransferSearch,
        });
        checkIfAddFilters({ mySearch, allParams });


        const searchColumns = mySearch.columns;
        const newColumns = [];
        let intIdCtr = 0;
        searchColumns.forEach((column) => {
          newColumns.push(`${(column.name).replace('custrecord_', '')}`.substring(0, 35));
          if (column.name === 'internalid') {
            sublist.addField({
              id: `${(column.name + intIdCtr).replace('custrecord_', '')}`.substring(0, 35),
              type: serverWidget.FieldType.TEXT,
              label: column.label,
            });
            intIdCtr += 1;
          } else {
            sublist.addField({
              id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
              type: serverWidget.FieldType.TEXT,
              label: column.label,
            });
          }
        });

        log.debug({
          title: 'newColumns',
          details: newColumns,
        });
        const getInternalIdField = form.getSublist({ id: sublistId }).getField({ id: 'internalid0' });
        getInternalIdField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const getBagLabIntIdField = form.getSublist({ id: sublistId }).getField({ id: 'internalid1' });
        getBagLabIntIdField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const getItemField = form.getSublist({ id: sublistId }).getField({ id: 'cs_return_req_scan_item' });
        getItemField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const getQuantityField = form.getSublist({ id: sublistId }).getField({ id: 'cs_qty' });
        getQuantityField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });

        const getLocationField = form.getSublist({ id: sublistId }).getField({ id: 'location' });
        getLocationField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const controlNumSubField = sublist.addField({
          id: 'custcol_kod_controlnumid',
          type: serverWidget.FieldType.TEXT,
          label: 'Control Num Id',
        });
        controlNumSubField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const binNumberIntId = sublist.addField({
          id: 'custcol_binnumberintid',
          type: serverWidget.FieldType.TEXT,
          label: 'Bin Num Id',
        });
        binNumberIntId.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });


        const pageCount = mySearch.runPaged().count;

        const resultSet = mySearch.runPaged({ pageSize, page });
        if (pageCount !== 0) {
          const currentPage = resultSet.fetch({ index: page - 1 }).data;

          sublist.addField({
            id: 'id_to_process',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Transfer to Default Bin',
          });

          sublist.addField({
            id: 'custpage_select_bin',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Select Bin',
          });

          const binTransferFld = sublist.addField({
            id: 'custpage_final_bin',
            type: serverWidget.FieldType.SELECT,
            label: 'Transfer to Specific Bin',
            source: 'bin',
          });
          binTransferFld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED,
          });

          let counter = 0;
          currentPage.forEach((result) => {
            // Add URL Link
            const resultIntId = result.id;
            const recordUrl = url.resolveRecord({
              recordType: 'custompurchase_returnrequestpo',
              recordId: resultIntId,
            });
            sublist.setSublistValue({
              id: 'record_url',
              line: counter,
              value: `<a href= "${recordUrl}">${resultIntId}</a>`,
            });

            intIdCtr = 0;
            searchColumns.forEach((column) => {
              sublist.setSublistValue({
                id: 'custcol_kod_controlnumid',
                line: counter,
                value: result.getValue(result.columns[findIndexByName(searchColumns, 'custbody_kd_rr_category')])
                || ' - ',
              });
              sublist.setSublistValue({
                id: 'custcol_binnumberintid',
                line: counter,
                value: result.getValue({
                  name: 'internalid',
                  join: 'CUSTRECORD_KD_PUTAWAY_LOC',
                  summary: 'GROUP',
                }) || ' - ',
              });
              if (column.name === 'custrecord_kd_mrr_link'
              || column.name === 'custrecord_kd_mfgname'
              || column.name === 'custbody_kd_rr_category'
              ) {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getText(result.columns[findIndexByName(searchColumns, column.name)]) || ' - ',
                });
              } else if (column.name === 'internalid') {
                sublist.setSublistValue({
                  id: `${(column.name + intIdCtr).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getValue(result.columns[findIndexByName(searchColumns, column.name, intIdCtr)]) || ' - ',
                });
                intIdCtr += 1;
              } else {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getValue(result.columns[findIndexByName(searchColumns, column.name)])
                  || ' - ',
                });
              }
            });
            counter += 1;
          });


          // Add navigation links
          const totalPages = resultSet.pageRanges.length;
          const nextPage = page < totalPages ? parseInt(page, 10) + 1 : null;
          const prevPage = page > 1 ? parseInt(page, 10) - 1 : null;

          if (prevPage) {
            form.addButton({
              id: 'custpage_prev_button',
              label: 'Previous',
              functionName: `goToPage(${prevPage})`,
            });
          }
          if (nextPage) {
            form.addButton({
              id: 'custpage_next_button',
              label: 'Next',
              functionName: `goToPage(${nextPage})`,
            });
          }
          form.addButton({
            id: 'custpage_process_button',
            label: 'Process Bin Transfer',
            functionName: 'processButton()',
          });

          form.addButton({
            id: 'custpage_mark_all_button',
            label: 'Mark All',
            functionName: 'markAll()',
          });

          form.addButton({
            id: 'custpage_unselect_all_button',
            label: 'Unselect All',
            functionName: 'unselectAll()',
          });
          form.addButton({
            id: 'custpage_mark_all_button',
            label: 'Search with Filters',
            functionName: 'searchWithFilters()',
          });
          form.addButton({
            id: 'custpage_clearfilters',
            label: 'Clear Filters',
            functionName: 'clearFilters()',
          });
        } else {
          form.addButton({
            id: 'custpage_mark_all_button',
            label: 'Search with Filters',
            functionName: 'searchWithFilters()',
          });
          form.addButton({
            id: 'custpage_clearfilters',
            label: 'Clear Filters',
            functionName: 'clearFilters()',
          });
        }

        form.clientScriptFileId = 35930;

        scriptContext.response.writePage(form);
      } else {
        const { body } = scriptContext.request;
        const getCurrScript = runtime.getCurrentScript();

        log.debug({
          title: 'Initial Usage Units',
          details: `Usage Units: ${getCurrScript.getRemainingUsage()}`,
        });
        const arrToProcess = JSON.parse(body);
        log.debug({
          title: 'Post to Process',
          details: arrToProcess,
        });

        const combineResponseObj = [];
        for (let i = 0; i < arrToProcess.length; i += 1) {
          const objResult = rxrsBtsLib.processBinTransfer(arrToProcess[i]);
          combineResponseObj.push(objResult);
        }
        // check if there is Success then Return, Create proper Box
        // let boxLabelIntId = '';
        let overallSuccess = false;

        for (let i = 0; i < combineResponseObj.length; i += 1) {
          if (combineResponseObj[i].success === true) {
            overallSuccess = true;
            const { bagLabelIntId, inDate } = combineResponseObj[i];
            // if (boxLabelIntId === '') {
            const boxLabelIntId = rxrsBtsLib.createBoxRecord(inDate);
            // }
            // Update related Bag Label
            rxrsBtsLib.updateBagLabel(boxLabelIntId, bagLabelIntId);
          }
        }
        log.debug({
          title: 'Final Usage Units',
          details: `Remaining Usage Units: ${getCurrScript.getRemainingUsage()}`,
        });
        const totalUsageConsumed = 1000 - getCurrScript.getRemainingUsage();
        log.debug({
          title: 'Total Usage Consumed',
          details: `Total Usage Consumed: ${totalUsageConsumed}`,
        });
        const returnObj = {};
        returnObj.success = overallSuccess;
        returnObj.binTransferObj = combineResponseObj;
        scriptContext.response.write(JSON.stringify(returnObj));
      }
    };

    return { onRequest };
  },
);
