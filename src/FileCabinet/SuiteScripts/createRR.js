function createRR() {
    try {
		 var FULL_PACKAGE = 1;
		 var PARTIAL_PACKAGE = 2;
        var recordID = nlapiGetRecordId();
		//GET FIELDS FROM ITEM RETURN SCAN
        var rrid = nlapiGetFieldValue('custrecord_cs_ret_req_scan_rrid');
        var ismarkedToSubmit = nlapiGetFieldValue('custrecord_scan_complete_submit_returns');
        var lotnum = nlapiGetFieldValue('custrecord_cs_lotnum');
		//VALIDATE FOR SUBMIT TO RETURN REQUEST
        if (rrid && ismarkedToSubmit) {
			//LOAD RETURN REQUEST RECORD TO ADD ITEMS
            var record2 = nlapiLoadRecord('customsale_kod_returnrequest', rrid, {
                recordmode: 'dynamic'
            });
			//REMOVING ALL LINE ITEMS
           nlapiLogExecution('debug','record2.getLineItemCount(item) initial',record2.getLineItemCount('item'));
             for (var i = record2.getLineItemCount('item'); i >= 1 ; i--) {
                record2.removeLineItem('item', i);
            } 
			//GET ITEMS FROM ITEM RETURN SCAN 
            var items = itemsforRR(rrid);
           nlapiLogExecution('debug','record2.getLineItemCount(item)',record2.getLineItemCount('item'));
            for (var it = 0; it < items.length; it++) {
				//ADD NEW LINES TO RETURN REQUEST
                record2.selectNewLineItem('item');
                record2.setCurrentLineItemValue('item', 'item', items[it].item);
				if(items[it].full_partial_package==FULL_PACKAGE){
                record2.setCurrentLineItemValue('item', 'quantity',items[it].quantity);
				record2.setCurrentLineItemValue('item', 'custcol_kod_fullpartial', 2);
				}
				else if(items[it].full_partial_package==PARTIAL_PACKAGE){
				record2.setCurrentLineItemValue('item', 'quantity',1);
				record2.setCurrentLineItemValue('item', 'custcol_kd_partialcount',items[it].quantity);
				record2.setCurrentLineItemValue('item', 'custcol_kod_fullpartial', 1);
				}
				else{
				record2.setCurrentLineItemValue('item', 'quantity',1);	
				}
                record2.setCurrentLineItemValue('item', 'rate', 1);
                record2.setCurrentLineItemValue('item', 'amount', 1);
                record2.setCurrentLineItemValue('item', 'custcol_rsrs_itemscan_link', items[it].internalid);
                
				//SETTING LOT NUMBER INVENTORY DETAIL
				 nlapiLogExecution('debug','creating inventory detils');
                var subrecord2 = record2.createCurrentLineItemSubrecord('item', 'inventorydetail');
                subrecord2.selectNewLineItem('inventoryassignment');
                subrecord2.setCurrentLineItemValue('inventoryassignment', 'receiptinventorynumber', items[it].lotnumber);//
                subrecord2.setCurrentLineItemValue('inventoryassignment', 'quantity',items[it].quantity );
                subrecord2.commitLineItem('inventoryassignment');
                subrecord2.commit();
                record2.commitLineItem('item');
				 nlapiLogExecution('debug','Inventory created');
            }
			//SUBMITTING RETURN REQUEST RECORD
            var id = nlapiSubmitRecord(record2);
            nlapiLogExecution('debug', 'id', id)
        }
    } catch (e) {
        nlapiLogExecution('debug', 'error', e.toString())
    }
}

function itemsforRR(rrid) {
    try {
        var item_ret_scanSearch = nlapiSearchRecord("customrecord_cs_item_ret_scan", null,
            [
                ["custrecord_cs_ret_req_scan_rrid", "anyof", rrid]
            ],
            [
                new nlobjSearchColumn("custrecord_cs_return_req_scan_item"),
                new nlobjSearchColumn("custrecord_cs_lotnum"),
				new nlobjSearchColumn("custrecord_cs_qty"),
				new nlobjSearchColumn("custrecord_cs_full_partial_package"),
				new nlobjSearchColumn("internalid")
            ]
        );
        var arr = [];
        for (var i = 0; i < item_ret_scanSearch.length; i++) {
            var obj = {};
            //access the value using the column objects
            obj.item 					= item_ret_scanSearch[i].getValue("custrecord_cs_return_req_scan_item");
            obj.lotnumber 				= item_ret_scanSearch[i].getValue("custrecord_cs_lotnum");
            obj.quantity 				= item_ret_scanSearch[i].getValue("custrecord_cs_qty");
			obj.full_partial_package 	= item_ret_scanSearch[i].getValue("custrecord_cs_full_partial_package");
			obj.internalid 				= item_ret_scanSearch[i].getValue("internalid");

			arr.push(obj);
        }
        return arr;
    } catch (e) {
        nlapiLogExecution('debug', 'error in itemsforRR', e.toString())
    }
}