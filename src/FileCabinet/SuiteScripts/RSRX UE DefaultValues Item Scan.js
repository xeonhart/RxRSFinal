/*******************************************************************************
{{ScriptHeader}} *
 * Company:                  {{Company}}
 * Author:                   {{Name}} - {{Email}}
 * File:                     {{ScriptFileName}}
 * Script:                   {{ScriptTitle}}
 * Script ID:                {{ScriptID}}
 * Version:                  1.0
 *
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 *
 ******************************************************************************/

define(['N/runtime', 'N/task', 'N/record', 'N/search', 'N/log','N/redirect'], function(
  /** @type {import('N/runtime')} **/ runtime,
  /** @type {import('N/task')}    **/ task,
  /** @type {import('N/record')}  **/ record,
  /** @type {import('N/search')}  **/ search,
  /** @type {import('N/log')}     **/ log, redirect
) {

  
  function beforeLoad(context) {
    // no return value
	try{
			var newRec = context.newRecord;
            var recId = newRec.id;
			var form =context.form;
			if (context.type === context.UserEventType.COPY) {
				newRec.setValue({
					fieldId: 'custrecord_cs_return_req_scan_item',
					value: ''
				}); 
			}
			if (context.type !== context.UserEventType.VIEW) {
            
				form.addButton({
							id: 'custpage_save_record',//custpage_save_record
							label: 'Submit',
							functionName: "NLMultiButton_doAction('multibutton_submitter', 'submitter')" //
					  });
           
				form.addButton({
						id: 'custpage_save_copy',
						label: 'Save & Continue',
						functionName: "NLMultiButton_doAction('multibutton_submitter', 'submitcopy')" //
				  });
            
			}
			if(context.request.parameters['custrecord_cs_ret_req_scan_rrid']){
				 newRec.setValue({
					fieldId: 'custrecord_cs_ret_req_scan_rrid',
					value: context.request.parameters['custrecord_cs_ret_req_scan_rrid']
				}); 
			}
                  
 
	}catch(e){
		log.debug('Error in button creation',e.toString());
	}
  }
  /**
   * context.newRecord
   * context.oldRecord
   * context.type
   *
   * @type {import('N/types').EntryPoints.UserEvent.afterSubmit}
   */
  function afterSubmit(context) {
     try{
       
		var rec = context.newRecord;  //create mode
		var rectype = rec.type;
		var recId = rec.id;
		var rrid =  rec.getValue({fieldId:'custrecord_cs_ret_req_scan_rrid'});
		var ismarkedToSubmit =  rec.getValue({fieldId:'custrecord_scan_complete_submit_returns'});
		var lotnum =  rec.getValue({fieldId:'custrecord_cs_lotnum'});
		if(rrid && ismarkedToSubmit){
			var itemObj = itemsforRR(rrid);
			log.debug('itemObj',itemObj);
			var objRecord = record.load({type:'customsale_kod_returnrequest',id:rrid,isDynamic:true});
			
			for(var j=0;j<objRecord.getLineCount({sublistId:'item'});j++){
				//objRecord.removeLine({sublistId:'item',line:0,ignoreRecalc:true});
			}
			log.debug('linecountafterremoved',objRecord.getLineCount({sublistId:'item'}));
			for(var i=0;i<itemObj.length;i++)//
			{
				log.debug('i'+i,'itemObj[i].item'+itemObj[i].item);
				objRecord.selectNewLine({sublistId:'item'});
				objRecord.setCurrentSublistValue({sublistId:'item',fieldId:'item',value:itemObj[i].item,ignoreFieldChange:true});//itemObj[i].item
				objRecord.setCurrentSublistValue({sublistId:'item',fieldId:'quantity',value:1,ignoreFieldChange:true});
				objRecord.setCurrentSublistValue({sublistId:'item',fieldId:'rate',value:1,ignoreFieldChange:true});
				objRecord.setCurrentSublistValue({sublistId:'item',fieldId:'amount',value:1,ignoreFieldChange:true});
				objRecord.setCurrentSublistValue({sublistId:'item',fieldId:'custcol_kod_fullpartial',value:1,ignoreFieldChange:true});
				
              var hasSubrecord = objRecord.hasCurrentSublistSubrecord({
				 sublistId: 'item',
				 fieldId: 'inventorydetail'
				});
				  
				var subRec = objRecord.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail'
                });
				
				//log.debug('subRec',subRec);
					subRec.selectNewLine({
                        sublistId: 'inventoryassignment',
                    });

                   var serialNum =  itemLotNumber(itemObj[i].item,itemObj[i].lotnum)
					log.debug('serialNum',serialNum); 
                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'inventorynumber',
                        value:serialNum //itemObj[i].lotnum
                    });
					subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: 1
                    });

                     subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        value: '5/18/2023'
                    });
            /*  subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        value:824 //itemObj[i].lotnum
                    }); */

                    subRec.commitLine({
                        sublistId: 'inventoryassignment'
                    });
				objRecord.commitLine({sublistId:'item'});
			}
			objRecord.save();

        }
            
	 }catch(e)
	 {
		 log.debug('Error',e.toString());
	 }
  }

 function itemsforRR(rrid){
	 try{
		 var customrecord_cs_item_ret_scanSearchObj = search.create({
		   type: "customrecord_cs_item_ret_scan",
		   filters:
		   [
			  ["custrecord_cs_ret_req_scan_rrid","anyof",rrid]
		   ],
		   columns:
		   [
			  search.createColumn({name: "custrecord_cs_return_req_scan_item", label: "Item"}),
			  search.createColumn({name: "custrecord_cs_lotnum", label: "LOT"})
		   ]
		});
		var searchResultCount = customrecord_cs_item_ret_scanSearchObj.runPaged().count;
		log.debug("customrecord_cs_item_ret_scanSearchObj result count",searchResultCount);
		var items = [];
		customrecord_cs_item_ret_scanSearchObj.run().each(function(result){
		   // .run().each has a limit of 4,000 results
		   var obj = {};
		   obj.item = result.getValue({name:'custrecord_cs_return_req_scan_item'});
		   obj.lotnum = result.getValue({name:'custrecord_cs_lotnum'});
		   items.push(obj);
		   return true;
		});
		return items;
	 }catch(e){
		 log.debug('Error in searchforitem',e.toString());
	 }
 }
 function itemLotNumber(item,lotno){
	 try{
		 var inventorynumberSearchObj = search.create({
		   type: "inventorynumber",
		   filters:
		   [
			  ["item","anyof",item], 
			  "AND", 
			  ["inventorynumber","is",lotno]
		   ],
		   columns:
		   [
			  search.createColumn({
				 name: "inventorynumber",
				 sort: search.Sort.ASC
			  }),
			  "internalid"
		   ]
		});
		var searchResultCount = inventorynumberSearchObj.runPaged().count;
		log.debug("inventorynumberSearchObj result count",searchResultCount);
		var internalid =0;
		inventorynumberSearchObj.run().each(function(result){
		   // .run().each has a limit of 4,000 results
		   internalid = result.getValue({name:'internalid'});
		   return true;
		});
		return internalid;

 

	 }catch(e)
	 {
		 
	 }
 }
  return {
	'beforeLoad':   beforeLoad,
	//'afterSubmit':  afterSubmit
  };

});