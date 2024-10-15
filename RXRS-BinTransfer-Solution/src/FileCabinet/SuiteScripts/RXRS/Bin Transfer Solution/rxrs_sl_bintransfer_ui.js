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
    const checkIfNotEmpty = (data) => {
      const returnData = false;
      if (data) {
        return true;
      }
      return returnData;
    };

    const checkIfAddFilters = ({ mySearch, allParams }) => {
      const { manufId } = allParams || '';
      const { rrPoId } = allParams || '';
      // const { dateAsOf } = allParams || '';
      const { binNumber } = allParams || '';
      // const { indateYear } = allParams || '';
      // const { indateMonth } = allParams || '';
      const { mrrId } = allParams || '';
      const { prodCateg } = allParams || '';

      if (checkIfNotEmpty(manufId)) {
        mySearch.filters.push((search.createFilter({
          name: 'custcol_item_manufacturer',
          operator: search.Operator.ANYOF,
          values: manufId,
        })));
      }

      if (checkIfNotEmpty(rrPoId)) {
        mySearch.filters.push((search.createFilter({
          name: 'internalid',
          operator: search.Operator.ANYOF,
          values: rrPoId,
        })));
      }

      // if (checkIfNotEmpty(dateAsOf)) {
      //   mySearch.filters.push((search.createFilter({
      //     name: 'custcol_kd_indate',
      //     operator: search.Operator.ON,
      //     values: new Date(dateAsOf),
      //   })));
      // }

      if (checkIfNotEmpty(binNumber)) {
        mySearch.filters.push((search.createFilter({
          name: 'binnumber',
          operator: search.Operator.CONTAINS,
          values: binNumber,
        })));
      }
      // To Do Later to check how we can filter properly
      // if (checkIfNotEmpty(indateYear)){
      //   mySearch.filters(search.createFilter({
      //     name: string,
      //     operator: string,
      //     values: string | Date | number | boolean | string[] | Date[] | number[],
      //   }));
      // }

      // if (checkIfNotEmpty(indateMonth)){
      //   mySearch.filters(search.createFilter({
      //     name: string,
      //     join: string,
      //     operator: string,
      //     values: string | Date | number | boolean | string[] | Date[] | number[],
      //   }));
      // }

      if (checkIfNotEmpty(mrrId)) {
        mySearch.filters.push((search.createFilter({
          name: 'custbody_kd_master_return_id',
          operator: search.Operator.ANYOF,
          values: mrrId,
        })));
      }

      if (checkIfNotEmpty(prodCateg)) {
        mySearch.filters.push(search.createFilter({
          name: 'custcol_kod_controlnum',
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
          type: search.Type.TRANSACTION,
          id: getBinTransferSearch,
        });
        checkIfAddFilters({ mySearch, allParams });


        const searchColumns = mySearch.columns;
        const newColumns = [];


        searchColumns.forEach((column) => {
          newColumns.push(`${(column.name).replace('custrecord_', '')}`.substring(0, 35));

          sublist.addField({
            id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
            type: serverWidget.FieldType.TEXT,
            label: column.label,
          });
        });

        log.debug({
          title: 'newColumns',
          details: newColumns,
        });
        const getInternalIdField = form.getSublist({ id: sublistId }).getField({ id: 'internalid' });
        getInternalIdField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const getItemField = form.getSublist({ id: sublistId }).getField({ id: 'item' });
        getItemField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        const getQuantityField = form.getSublist({ id: sublistId }).getField({ id: 'binnumberquantity' });
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

            searchColumns.forEach((column) => {
              sublist.setSublistValue({
                id: 'custcol_kod_controlnumid',
                line: counter,
                value: result.getValue({
                  name: 'custitem_kod_itemcontrol',
                  join: 'item',
                }) || ' - ',
              });
              sublist.setSublistValue({
                id: 'custcol_binnumberintid',
                line: counter,
                value: result.getValue({
                  name: 'internalid',
                  join: 'binNumber',
                }) || ' - ',
              });
              if (column.name === 'custbody_kd_master_return_id' || column.name === 'tranid'
                || column.name === 'custbody_kd_return_request') {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getText({
                    name: column.name,
                  }) || ' - ',
                });
              } else if (column.name === 'custitem_kod_mfgsegment' || column.name === 'custitem_kod_itemcontrol'
              ) {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getText({
                    name: column.name,
                    join: 'item',
                  }) || ' - ',
                });
              } else if (column.name === 'internalid') {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getValue({
                    name: column.name,
                    join: 'binNumber',
                  }) || ' - ',
                });
              } else if (column.name === 'custrecord_bin_stored_form') {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getText({
                    name: column.name,
                    join: 'binNumber',
                  }) || ' - ',
                });
              } else {
                sublist.setSublistValue({
                  id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                  line: counter,
                  value: result.getValue({
                    name: column.name,
                  }) || ' - ',
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
            id: 'custpage_mark_all_button',
            label: 'Search with Filters',
            functionName: 'searchWithFilters()',
          });
          form.addButton({
            id: 'custpage_unselect_all_button',
            label: 'Unselect All',
            functionName: 'unselectAll()',
          });
        }

        form.clientScriptFileId = 35930;

        scriptContext.response.writePage(form);
      } else {
        const { body } = scriptContext.request;
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

        scriptContext.response.write(JSON.stringify(combineResponseObj));
      }
    };

    return { onRequest };
  },
);
