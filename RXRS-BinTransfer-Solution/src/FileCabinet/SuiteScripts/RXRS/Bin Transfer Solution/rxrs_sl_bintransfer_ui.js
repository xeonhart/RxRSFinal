/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 */
define(
  ['N/search', 'N/record', 'N/ui/serverWidget', 'N/url', 'N/runtime'],
  /**
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
  (search, record, serverWidget, url, runtime) => {
    const packageRecFieldId = 'customrecord_kod_mr_packages';
    const constPackageReceived = 3;

    const onRequest = (scriptContext) => {
      const page = scriptContext.request.parameters.page || 1;
      const mrrId = scriptContext.request.parameters.mrrId || 1287;
      const pageSize = 100;

      if (scriptContext.request.method === 'GET') {
        const form = serverWidget.createForm({
          title: 'Batch Completion - Return Packages',
          hideNavBar: true,
        });

        const userId = runtime.getCurrentUser().id;
        const sublist = form.addSublist({
          id: 'custpage_search_results',
          type: serverWidget.SublistType.LIST,
          label: 'All Packages Result',
        });

        const mySearch = search.load({
          type: packageRecFieldId,
          id: 963,
        });

        mySearch.filters.push(search.createFilter({
          name: 'custrecord_kod_rtnpack_mr',
          operator: search.Operator.ANYOF,
          values: mrrId,
        }));

        const searchColumns = mySearch.columns;
        searchColumns.forEach((column) => {
          log.debug({
            title: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
            details: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
          });
          sublist.addField({
            id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
            type: serverWidget.FieldType.TEXT,
            label: column.label,
          });
        });

        const pageCount = mySearch.runPaged().count;

        const resultSet = mySearch.runPaged({ pageSize, page });
        if (pageCount !== 0) {
          const currentPage = resultSet.fetch({ index: page - 1 }).data;

          sublist.addField({
            id: 'id_to_process',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'TO Process',
          });

          let counter = 0;
          currentPage.forEach((result) => {
            // Add URL Link
            const resultIntId = result.id;
            const recordUrl = url.resolveRecord({
              recordType: packageRecFieldId,
              recordId: resultIntId,
            });
            sublist.setSublistValue({
              id: 'record_url',
              line: counter,
              value: `<a href= "${recordUrl}">${resultIntId}</a>`,
            });
            searchColumns.forEach((column) => {
              sublist.setSublistValue({
                id: `${(column.name).replace('custrecord_', '')}`.substring(0, 35),
                line: counter,
                value: result.getValue({
                  name: column.name,
                }).substring(0, 300) || ' - ',
              });
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
            label: 'Process Marked Packages',
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
        }

        form.clientScriptFileId = 34936;

        scriptContext.response.writePage(form);
      } else {
        const { body } = scriptContext.request;
        const arrToProcess = JSON.parse(body);
        log.debug({
          title: 'Post to Process',
          details: arrToProcess,
        });
        for (let i = 0; i < arrToProcess.length; i += 1) {
          const loadPkgRec = record.load({
            type: packageRecFieldId,
            id: arrToProcess[i],
          });
          loadPkgRec.setValue({
            fieldId: 'custrecord_ispackrecvd',
            value: true,
          });
          loadPkgRec.setValue({
            fieldId: 'custrecord_packstatus',
            value: constPackageReceived,
          });
          const pkgIdUpdated = loadPkgRec.save();
          log.debug({
            title: 'Package Saved',
            details: ` Record ${pkgIdUpdated} Updated`,
          });
        }

        return { message: 'Processed Successfully' };
      }
    };

    return { onRequest };
  },
);
