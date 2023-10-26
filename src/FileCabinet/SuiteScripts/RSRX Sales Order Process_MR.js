/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/search', 'N/config', 'N/runtime', 'N/file','N/task'],
/**
 * @param {email} email
 * @param {record} record
 * @param {search} search
 * @param {config} config
 * @param {runtime} runtime
 */
function(email, record, search, CONFIG, RUNTIME, file,task) {
   
    
    function getInputData() {
    	var arr_emailfileId = [];
    	
		var fileSearchObj = search.create({
   type: "file",
   filters:
   [
      ["folder","anyof","4029"],
	  "AND",
	  ["name","doesnotstartwith","Processed"]
	   
   ],
   columns:
   [search.createColumn({name: "internalid", label: "Internal ID"})
   ]
});
var searchResultCount = fileSearchObj.runPaged().count;
log.debug("fileSearchObj result count",searchResultCount);
var arr_fileId=[];
fileSearchObj.run().each(function(result){
   // .run().each has a limit of 4,000 results
   var id=result.getValue({name: "internalid"})
    arr_fileId.push(id);
	
	
   return true;
});
var data=[];
log.debug('arr_fileId',arr_fileId.length);
for(var i=0;i<arr_fileId.length;i++){
	 var fileObj = file.load({
        id:arr_fileId[i]
      });
	  var file_name=fileObj.name;
	   var contents = fileObj.getContents();
	  var parsedData = JSON.parse(contents);
	
	
  data.push(parsedData);
//4030
fileObj.folder=4030;
fileObj.save();
}
log.debug('data',data);
var groupdata=[];
for(var i=0;i<data.length;i++){
	var innerarr=JSON.parse(data[i]);
	for (var j = 0; j < innerarr.length; j++) {
    var values = innerarr[j];
    log.debug('values',values);
	//log.debug('innerarr',innerarr)
	groupdata.push(values)
  }
	
}
		return groupdata; 
    }

    
    function map(context) {
		try{
		var dataArray = JSON.parse(context.value);
			log.debug('d', dataArray)
			var customer=dataArray[0][8];
		
			var item_scan=[];
			for (var i = 0; i < dataArray.length; i++) {
   var row = dataArray[i];
  item_scan.push(Number(row[10]));
}
 
	
	//item scan saved search
var inventorynumberSearchObj = search.create({
   type: "inventorynumber",
   filters:
   [
      ["item","noneof","@NONE@"], 
      "AND", 
      ["custitemnumber_numfreturnrequestid.mainline","is","T"],
      "AND", 
      ["custitemnumber_item_scan","anyof",item_scan]
   ],
   columns:
   [
      search.createColumn({
         name: "inventorynumber",
         sort: search.Sort.ASC,
         label: "Number"
      }),
      search.createColumn({name: "custitemnumber_numfmanufacturer", label: "Manufacturer"}),
      search.createColumn({name: "custitemnumber_numfitemcategory", label: "Item Category"}),
      search.createColumn({
         name: "itemid",
         join: "item",
         label: "Name"
      }),
      search.createColumn({name: "custitemnumber_numforiginallotnumber", label: "Original Lot Number"}),
      search.createColumn({name: "custitemnumber_numfreturnrequestid", label: "Return Request ID"}),
      search.createColumn({name: "expirationdate", label: "Expiration Date"}),
      search.createColumn({name: "custitemnumber_numfmfgprocessing", label: "Mfg Processing"}),
      search.createColumn({
         name: "name",
         join: "CUSTITEMNUMBER_NUMFMANUFACTURER",
         label: "Manufacturer"
      }),
      search.createColumn({
         name: "custitem_kod_itemcontrol",
         join: "item",
         label: "Product Group"
      }),
      search.createColumn({
         name: "tranid",
         join: "CUSTITEMNUMBER_NUMFRETURNREQUESTID",
         label: "Document Number"
      }),
      search.createColumn({name: "quantityavailable", label: "Available"}),
      search.createColumn({
         name: "formulatext",
         formula: "{custitemnumber_numfitemcategory}",
         label: "Item Category"
      }),
      search.createColumn({
         name: "formulatext",
         formula: "{custitemnumber_numfentity.entityid}|| ' '||{custitemnumber_numfentity.altname}",
         label: "Customer Name"
      }),
      search.createColumn({
         name: "formulatext",
         formula: "{custitemnumber_numfmfgprocessing}",
         label: "MFG Processing"
      }),
      search.createColumn({name: "custitemnumber_item_scan", label: "Item Scan"}),
      search.createColumn({name: "quantityonorder", label: "On Order"}),
      search.createColumn({ 
	  name: "internalid",
         join: "item",
		 label:"item internal id"}),
	  search.createColumn({
         name: "internalid",
         join: "CUSTITEMNUMBER_NUMFENTITY",
         label: "Internal ID"
      }),
	  search.createColumn({name: "internalid", label: "Internal ID"})
   ]
});
var searchResultCount = inventorynumberSearchObj.runPaged().count;
log.debug("inventorynumberSearchObj result count",searchResultCount);
var data=[];
var inventory_ids=[];
inventorynumberSearchObj.run().each(function(result){
	
   // .run().each has a limit of 4,000 results
   var obj={};
   obj.item=result.getValue({
        name: "internalid",
         join: "item",
      });
   obj.customer=result.getValue({
          name: "internalid",
         join: "CUSTITEMNUMBER_NUMFENTITY"
      });
	 inventory_ids.push(result.getValue({name: "internalid"})); 
   data.push(obj);
    
   return true;
});

var sales_order = record.create({
      type: record.Type.SALES_ORDER,
      isDynamic: true
    });
    
    // Set field values on the Purchase Order record
    
	sales_order.setValue({
      fieldId: 'entity',
      value: data[0].customer
    });
for(var i=0;i<data.length;i++){
sales_order.selectNewLine({
      sublistId: 'item'
    });
   sales_order.setCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'item',
      value:data[i].item
    });
	  sales_order.commitLine({
      sublistId: 'item'
    });
}
	var so_id = sales_order.save();
    //
	log.debug('so_id',so_id);
	for(var i=0;i<inventory_ids.length;i++){
		var id=record.submitFields({
                type:'inventorynumber',
                id: inventory_ids[i],
                values: {
                    'custitemnumber_related_so': so_id
                }
		});
		log.debug('id',id);
	}
	//inventory_ids
			return true
	 
		}
		catch(e){
			log.debug('error',e)
		}
    }

    
    function reduce(context) {

    }

    function summarize(summary) {
	/* 	 var fileSearchObj = search.create({
   type: "file",
   filters:
   [
      ["folder","anyof","4029"],
	  "AND",
	  ["name","doesnotstartwith","Processed"]//sandbox 
   ],
   columns:
   [search.createColumn({name: "internalid", label: "Internal ID"})
   ]
});
var searchResultCount = fileSearchObj.runPaged().count;
log.debug("fileSearchObj result count",searchResultCount);
if(searchResultCount>0){
	var mapreducetask = task.create({
					taskType: task.TaskType.MAP_REDUCE,
					scriptId: 'customscript_email_consolidated_pdf',
					deploymentId: 'customdeploy_email_consolidated_pdf',
				});
				var mrTaskId = mapreducetask.submit();
				log.debug('mrTaskId', mrTaskId);


				log.debug('finished', 'finished');
}
 */
    }
	

    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    };
    
});
