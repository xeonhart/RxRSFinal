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

define(['N/runtime', 'N/task', 'N/record', 'N/search', 'N/log'], function(
  /** @type {import('N/runtime')} **/ runtime,
  /** @type {import('N/task')}    **/ task,
  /** @type {import('N/record')}  **/ record,
  /** @type {import('N/search')}  **/ search,
  /** @type {import('N/log')}     **/ log
) {

  
  function beforeLoad(context) {
    // no return value
	try{
		var form =context.form;
		if (context.type === context.UserEventType.VIEW) {
			 var newRec = context.newRecord;
            var recId = newRec.id
                   form.addButton({
						id: 'custpage_open_itemscan',
						label: 'Item Scan',
						functionName: 'window.open("https://6816904.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=436&custrecord_cs_ret_req_scan_rrid='+recId+'","_blank")' //
				  });

           // form.clientScriptFileId = 630640;
         }
	}catch(e){
		log.debug('Error in button creation');
	}
  }
 

  return {
    'beforeLoad':   beforeLoad
  };

});
