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
 * @NScriptType Restlet
 *
 ******************************************************************************/

define(['N/runtime', 'N/task', 'N/record', 'N/search', 'N/log'], function(
  /** @type {import('N/runtime')} **/ runtime,
  /** @type {import('N/task')}    **/ task,
  /** @type {import('N/record')}  **/ record,
  /** @type {import('N/search')}  **/ search,
  /** @type {import('N/log')}     **/ log
) {

  /**
   * @type {import('N/types').EntryPoints.RESTlet.delete_}
   */
  function onDelete(requestParams) {
    // return string or object data
    return '1';
  }

  /**
   * @type {import('N/types').EntryPoints.RESTlet.get}
   */
  function onGet(requestParams) {
	  try{
			// return string or object data
			log.debug('requestParams',requestParams);
			var param = requestParams;
			log.debug('param',param);
			var _trackingnumber = param.trackingnumber;
			var responseObj = packagereturns(_trackingnumber);
			return JSON.stringify(responseObj);
	  }catch(e){
		 log.debug('error',e.toString()); 
	  }
  }

  /**
   * @type {import('N/types').EntryPoints.RESTlet.post}
   */
  function onPost(requestParams) {
    // return string or object data
    return '1';
  }

  /**
   * @type {import('N/types').EntryPoints.RESTlet.put}
   */
  function onPut(requestParams) {
    // return string or object data
    return '1';
  }
	function packagereturns(trackingnumber){
		var customrecord_kod_mr_packagesSearchObj = search.create({
			   type: "customrecord_kod_mr_packages",
			   filters:
			   [
				  ["custrecord_kod_packrtn_trackingnum","is",trackingnumber], 
				  "AND", 
				  ["custrecord_ispackrecvd","is","F"], 
				  "AND", 
				  ["isinactive","is","F"]
			   ],
			   columns:
			   [
				  "custrecord_kod_packrtn_control",
				  "custrecord_kod_packrtn_rtnrequest",
				  "internalid"
			   ]
			});
			var searchResultCount = customrecord_kod_mr_packagesSearchObj.runPaged().count;
			log.debug("customrecord_kod_mr_packagesSearchObj result count",searchResultCount);
			var arr=[];
			customrecord_kod_mr_packagesSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   var obj={};
			   obj.packagecontrol = result.getValue({name:'custrecord_kod_packrtn_control'});
			   obj.packagereturnid = result.getValue({name:'internalid'});
			   arr.push(obj);
			   return true;
			}); 
			return arr;
	}
  return {
    'delete': onDelete,
    'get':    onGet,
    'post':   onPost,
    'put':    onPut
  };

});
