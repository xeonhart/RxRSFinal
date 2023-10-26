/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */

/**
 * get the parameters
 *
 * @param {number} vid(vendor internalid) - vendor internal id
 * @param {date} start Date - MM/DD/YYYY
 * @param {date} end Date - MM/DD/YYYY
 */

define([
  "N/ui/serverWidget",
  "N/redirect",
  "N/runtime",
  "N/record",
  "N/ui/message",
  "N/search",
  "N/url",
  "N/format",
  "N/ui/dialog",
  "N/task",
  "N/file",
], function (
  serverWidget,
  redirect,
  runtime,
  record,
  message,
  search,
  url,
  format,
  dialog,
  task,
  file
) {
  function onRequest(context) {
    // Getting parameters
    var edate = context.request.parameters.expdate;
    var manufacturer = context.request.parameters.manufacturer;
    var category = context.request.parameters.category;
    var mfgprocessing = context.request.parameters.mfgprocessing;
    var customer_no = context.request.parameters.customer_no;
    var type = context.request.method;

    if (context.request.method === "GET") {
      try {
        var form = serverWidget.createForm({
          title: "Sales Order Process",
        });
        var fieldgroup = form.addFieldGroup({
          id: "fieldgroupid1",
          label: "Filters",
        });

        // adding start date field
        var expDate = form.addField({
          id: "custpage_date",
          type: serverWidget.FieldType.DATE,
          label: "Expiry Date",
          container: "fieldgroupid1",
        });
        //adding end date field
        var mfg = form.addField({
          id: "custpage_manufacturer",
          type: serverWidget.FieldType.SELECT,
          source: "customrecord_csegmanufacturer",
          label: "Manufacturer",
          container: "fieldgroupid1",
        });
        // adding vendor name field
        var category_f = form.addField({
          id: "custpage_category",
          type: serverWidget.FieldType.SELECT,
          source: "customlist_kod_itemcat_list",
          label: "Category",
          container: "fieldgroupid1",
        });
        var mfg_processing = form.addField({
          id: "custpage_mfg_processing",
          type: serverWidget.FieldType.SELECT,
          source: "customlist_kod_rqstprocess",
          label: "MFG Processing",
          container: "fieldgroupid1",
        });
        var customer_field = form.addField({
          id: "custpage_customer",
          type: serverWidget.FieldType.SELECT,
          source: "customer",
          label: "Customer",
          container: "fieldgroupid1",
        });

        /*   form.addSubmitButton({
                          label: 'Process Sales Order'
                      }); */
        // Add a submit button to the form
        form.addSubmitButton({
          label: "Submit",
          //onclick: 'submitForm()'
        });

        //adding search button to filter based on vendor name and start date end date
        form.addButton({
          id: "custpage_buttonid",
          label: "Search",
          functionName: "search()",
        });
        form.addButton({
          id: "custpage_resetbutton",
          label: "Reset",
          functionName: "resetfun()",
        });
        customer_field.defaultValue = customer_no;
        expDate.defaultValue = edate;
        mfg.defaultValue = manufacturer;
        category_f.defaultValue = category;
        mfg_processing.defaultValue = mfgprocessing;
        // Attaching client script for button actions
        form.clientScriptFileId = 21380;
        var filter = [
          ["custitemnumber_numfreturnrequestid.mainline", "is", "T"],
          "AND",
          ["custitemnumber_related_so", "anyof", "@NONE@"],
        ]; //["quantityavailable","greaterthan","0"]
        if (edate) {
          edate = format.format({
            value: edate,
            type: format.Type.DATE,
          });
          filter.push("AND");
          filter.push(["expirationdate", "on", edate]);
        }
        if (manufacturer) {
          filter.push("AND");
          filter.push([
            "custitemnumber_numfmanufacturer",
            "anyof",
            Number(manufacturer),
          ]);
        }
        if (category) {
          filter.push("AND");
          filter.push([
            "item.custitem_kod_itemcontrol",
            "anyof",
            Number(category),
          ]);
        }
        if (mfgprocessing) {
          filter.push("AND");
          filter.push([
            "custitemnumber_numfmfgprocessing",
            "anyof",
            Number(mfgprocessing),
          ]);
        }
        if (customer_no) {
          filter.push("AND");
          filter.push([
            "custitemnumber_numfentity",
            "anyof",
            Number(customer_no),
          ]);
        }

        /*  ["expirationdate","on","6/17/2023"], 
               "AND", 
               ["custitemnumber_numfmanufacturer","anyof","3600"], 
               "AND", 
               ["custitemnumber_numfitemcategory","anyof","1"] */
        log.debug("filter", filter);
        var inventorynumberSearchObj = search.create({
          type: "inventorynumber",
          filters: filter,
          columns: [
            search.createColumn({
              name: "inventorynumber",
              sort: search.Sort.ASC,
              label: "SERIAL/LOT NUMBER",
            }),
            search.createColumn({
              name: "name",
              join: "CUSTITEMNUMBER_NUMFMANUFACTURER",
              label: "Manufacturer",
            }),
            search.createColumn({
              name: "formulatext",
              formula: "{custitemnumber_numfitemcategory}",
              label: "Item Category",
            }),
            search.createColumn({
              name: "itemid",
              join: "item",
              label: "Item",
            }),
            search.createColumn({
              name: "custitemnumber_numforiginallotnumber",
              label: "Original Lot Number",
            }),
            search.createColumn({
              name: "tranid",
              join: "CUSTITEMNUMBER_NUMFRETURNREQUESTID",
              label: "Return Request Number",
            }),
            search.createColumn({
              name: "expirationdate",
              label: "Expiration Date",
            }),
            search.createColumn({
              name: "quantityavailable",
              label: "Available",
            }),
            search.createColumn({
              name: "formulatext1",
              formula:
                "{custitemnumber_numfentity.entityid}|| ' '||{custitemnumber_numfentity.altname}",
              label: "Customer Name",
            }),
            search.createColumn({
              name: "formulatext2",
              formula: "{custitemnumber_numfmfgprocessing}",
              label: "MFG Processing",
            }),
            search.createColumn({
              name: "custitemnumber_item_scan",
              label: "Item Scan",
            }),

            search.createColumn({
              name: "custrecord158",
              join: "CUSTITEMNUMBER_NUMFMANUFACTURER",
              label: "Allow Batching",
            }),
          ],
        });
        var searchResultCount = inventorynumberSearchObj.runPaged().count;
        log.debug("inventorynumberSearchObj result count", searchResultCount);
        inventorynumberSearchObj.run().each(function (result) {
          // .run().each has a limit of 4,000 results
          return true;
        });
        /*     var sublist = form.addSublist({
                  id: 'custpage_inventory_sublist',
                  type: serverWidget.SublistType.LIST,
                  label: 'Inventory Search Results',
               }); */

        // Add fields to the sublist
        var columns = inventorynumberSearchObj.columns;
        /* for (var i = 0; i < columns.length; i++) {
                       var column = columns[i];
                       sublist.addField({
                          id: 'custpage_' + column.name,
                          type: serverWidget.FieldType.TEXT,
                          label: column.label
                       });
                    } */

        var inventorySearchResults = inventorynumberSearchObj.run().getRange({
          start: 0,
          end: 1000, // Adjust the range as needed
        });
        var grouped_data = [];
        // Loop through the search results and populate the sublist
        for (var i = 0; i < inventorySearchResults.length; i++) {
          var obj = {};
          var searchResult = inventorySearchResults[i];
          //log.debug('searchResult',searchResult)
          for (var j = 0; j < columns.length; j++) {
            var column = columns[j];
            var value = searchResult.getValue({
              name: column.name,
              join: column.join,
            });
            obj[column.name] = value;
            /*  if(value){
                              sublist.setSublistValue({
                                 id: 'custpage_' + column.name,
                                 line: i,
                                 value: value
                              });
                             } */
          }
          grouped_data.push(obj);
        }
        //log.debug('before grouped_data',grouped_data)
        var groupedValues = {};

        for (var i = 0; i < grouped_data.length; i++) {
          var item = grouped_data[i];
          var key =
            item.name +
            "_" +
            item.formulatext1 +
            "_" +
            item.formulatext +
            "_" +
            item.formulatext2;

          if (!groupedValues[key]) {
            groupedValues[key] = [];
          }

          groupedValues[key].push(item);
        }
        var table_html = "";
        for (var key in groupedValues) {
          if (groupedValues.hasOwnProperty(key)) {
            var value = groupedValues[key];
            table_html += createTable(key, value);
            //log.debug(key,value)
            // Add the table to the Suitelet's response
            //response.write(table);
          }
        }
        var fieldgroup = form.addFieldGroup({
          id: "fieldgroupid",
          label: "Inventory Data",
        });
        var inlineHtmlField = form.addField({
          id: "custpage_my_inline_html_field",
          type: serverWidget.FieldType.INLINEHTML,
          label: "My Inline HTML Field",
          container: "fieldgroupid",
        });
        var data_field = form.addField({
          id: "custpage_data_field",
          type: serverWidget.FieldType.TEXTAREA,
          label: "My Inline HTML Field",
          container: "fieldgroupid",
        });

        data_field.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        inlineHtmlField.defaultValue = table_html;
        form.addField({
          id: "custpage_hidden_rsm_script",
          label: "hidden script",
          type: serverWidget.FieldType.INLINEHTML,
        }).defaultValue =
          "<script>" +
          "jQuery(document).ready(function(){" +
          'jQuery("#tr_fg_fieldgroupid")' +
          '.find("td").first().attr("width","98%");' +
          "})" +
          "</script>";
        //customer_field.breakType = serverWidget.FieldBreakType.STARTROW;
        //log.debug('groupedValues',groupedValues);
        context.response.writePage(form);
      } catch (e) {
        log.debug("error", e.toString());
      }
    } else {
      log.debug("else block");
      var data = context.request.parameters.custpage_data_field;
      log.debug("data", data);
      var filename = new Date();
      var n = filename.toString();
      n = n.split(" ").join("_");
      n = n.split(":").join("_");
      n = n.substring(0, 24);
      n = "SO Process " + n + ".txt";
      var fileObj = file.create({
        name: n,
        fileType: file.Type.PLAINTEXT,
        contents: JSON.stringify(data),
        description: "This is a plain text file.",
        encoding: file.Encoding.UTF8,
        folder: 4029,
        isOnline: true,
      });
      var fileId = fileObj.save();
      log.debug("file id", fileId);

      var is_script_running = isExecuting(
        "customscript_rsrx_sales_order_process_mr",
        "customdeploy_rsrx_sales_order_process_mr"
      );
      if (!is_script_running) {
        var mapreducetask = task.create({
          taskType: task.TaskType.MAP_REDUCE,
          scriptId: "customscript_rsrx_sales_order_process_mr",
          deploymentId: "customdeploy_rsrx_sales_order_process_mr",
        });
        var mrTaskId = mapreducetask.submit();
        log.debug("mrTaskId", mrTaskId);

        log.debug("finished", "finished");
      }
      redirect.redirect({
        url: "https://6816904.app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&datefrom=7%2F7%2F2023&dateto=7%2F7%2F2023&scripttype=832&primarykey=2190&jobstatefilterselect=&sortcol=dateCreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=1000&_csrf=09cFg9Z2OlT5kDzNF5qB_EmWjG88P7otDRUiH-DFHfMJ9kRHgObLP5u7akf3u5twVEIQChSFiKYCnJbLRxOdub0x_TNxw31wPEAuoX-leHKcCefOJlGgCgoZ6pi3KMwKZJmqQpk2w05F9PCdeyloGS2t2ao35Abi8Zv_MP7HWos%3D&datemodi=WITHIN&date=TODAY&showall=F",
      });
    }
  }

  // Custom functions
  function checkNullRequired(value) {
    var returnObj = true;
    if (
      value == null ||
      value == "NaN" ||
      value == undefined ||
      value.toString().trim() == ""
    ) {
      returnObj = false;
    }
    return returnObj;
  }

  function createTable(header, values) {
    var table = "<h3 style='background-color: #bfe6f2;'>" + header + "</h3>";
    // Add "Select for SO" checkbox
    table +=
      "<label><input type='checkbox' class='select-for-so'> Select for SO</label>";

    table +=
      "<table  style='border-spacing: 1em 0.5em;border-collapse: collapse;table-layout:fixed; border: 1px solid black; margin-bottom: 20px;width: 100%;'><thead style='border-collapse: collapse;  border: 1px solid black;'><tr style='background-color: #d5f7cb;'><th style='padding: 5px;text-align: center;'colspan='2'>SERIAL/LOT NUMBER</th><th style='padding: 5px;text-align: center;' colspan='2'>MANUFACTURER</th><th style='padding: 5px;text-align: center;' colspan='2'>ITEM CATEGORY</th><th style='padding: 5px;text-align: center;' colspan='2'>ITEM</th><th style='padding: 5px;text-align: center;' colspan='2'>ORIGINAL LOT NUMBER</th><th style='padding: 5px;text-align: center;' colspan='2'>RETURN REQUEST NUMBER</th><th style='padding: 5px;text-align: center;' colspan='2'>EXPIRATION DATE</th><th style='padding: 5px;text-align: center;' colspan='2'>AVAILABLE</th><th style='padding: 5px;text-align: center;' colspan='2'>CUSTOMER NAME</th><th style='padding: 5px;text-align: center;' colspan='2'>MFG PROCESSING</th><th style='padding: 5px;text-align: center;' colspan='2'>Item Scan No</th></tr> </thead>";

    // Iterate over the values array
    for (var i = 0; i < values.length; i++) {
      var element = values[i];
      if (i === 0) {
        table += "<tr style='padding: 5px;text-align:center'>";
      } else if (i % 2 === 0) {
        table += "<tr style='padding: 5px;text-align:center'>";
      } else {
        table +=
          "<tr style='background-color: #d8e8d3;padding: 5px;text-align:center'>";
      }

      // Iterate over the properties of each element
      for (var prop in element) {
        if (element.hasOwnProperty(prop)) {
          table += "<td colspan='2'>" + element[prop] + "</td>";
        } else {
          table += "<td colspan='2'> </td>";
        }
      }

      table += "</tr>";
    }

    table += "</table>";
    return table;
  }

  function isExecuting(scriptId, deploymentId) {
    const executingStatuses = ["PENDING", "PROCESSING", "RESTART", "RETRY"];
    return Boolean(
      search
        .create({
          type: record.Type.SCHEDULED_SCRIPT_INSTANCE,
          filters: [
            ["status", search.Operator.ANYOF, executingStatuses],
            "AND",
            ["script.scriptid", "startswith", scriptId], //,"AND",
            //["scriptDeployment.scriptid", search.Operator.ISNOT, deploymentId]
          ],
          columns: ["script.internalid"],
        })
        .runPaged().count
    );
  }

  return {
    onRequest: onRequest,
  };
});
