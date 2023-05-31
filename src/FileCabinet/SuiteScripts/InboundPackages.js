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
    return '1';
  }

  /**
   * @type {import('N/types').EntryPoints.RESTlet.put}
   */
  function onPut(requestParams) {
    var param = requestParams;
    var _trackingnumber = param.trackingnumber;
    var responseObj = packagereturns(_trackingnumber);

    return responseObj[0];//JSON.stringify(responseObj[0]);
  }
	function packagereturns(trackingnumber){
      var packageExpected;
      var packageReceived = 0;
		var customrecord_kod_mr_packagesSearchObj = search.create({
			   type: "customrecord_kod_mr_packages",
			   filters:
			   [
				  ["custrecord_kod_packrtn_trackingnum","is",trackingnumber],
			   ],
			   columns:
			   [
                 "custrecord_kod_packrtn_trackingnum",
                 "custrecord_kod_packrtn_rtnrequest",
                 "custrecord_kd_rp_customer",
				  "custrecord_kod_packrtn_control",
                 'custrecord_ispackrecvd',
                 "custrecord_kod_rtnpack_mr",
				  "internalid"
			   ]
			});
            ///////////////////////////////////////////
              var today = new Date();
              var dd = String(today.getDate());
              var mm = String(today.getMonth() + 1);
              var yyyy = today.getFullYear();

              today = mm + '/' + dd + '/' + yyyy;
            ///////////////////////////////////////////
			var searchResultCount = customrecord_kod_mr_packagesSearchObj.runPaged().count;
			log.debug("customrecord_kod_mr_packagesSearchObj result count",searchResultCount);
			var arr=[];
			customrecord_kod_mr_packagesSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   var obj={};
              /////////Updating Package Received Field////////////////////////////
              if (result.getValue({name:'custrecord_ispackrecvd'}) == true){
                obj.ResponseMessage = "Package has been received";
              }else{
                var packrecv = record.submitFields({
                  type: 'customrecord_kod_mr_packages',
                  id: parseInt(result.getValue({name:'internalid'})),
                  values: {
                    'custrecord_ispackrecvd': true
                  }
                });

                var recvdt = record.submitFields({
                  type: 'customrecord_kod_mr_packages',
                  id: parseInt(result.getValue({name:'internalid'})),
                  values: {
                    'custrecord_kd_datereceived': String(today)
                  }
                });
              }
              ////////////////////////////////////////////////////////////////

			   obj.TrackingNumber = result.getValue({name:'custrecord_kod_packrtn_trackingnum'});
               obj.ReturnOrderNumber = result.getText({name:'custrecord_kod_packrtn_rtnrequest'});
               obj.AccountName = result.getText({name:'custrecord_kd_rp_customer'});
               packageExpected = masterreturnnumber(result.getValue({name:'custrecord_kod_rtnpack_mr'}));
              obj.TotalPackagesExpected = packageExpected.length;

              for (var i = 0; i < packageExpected.length; i++)
              {
                if (packageExpected[i] == true)
                {
                  packageReceived++;
                }
              }
              obj.TotalPackagesReceived = packageReceived;
              obj.ProductType = result.getText({name:'custrecord_kod_packrtn_control'});
              arr.push(obj);
			  return true;
			});
			return arr;
	}

  function masterreturnnumber(mrr){
		var customrecord_kod_mr_packagesSearchObj = search.create({
			   type: "customrecord_kod_mr_packages",
			   filters:
			   [
				  ["custrecord_kod_rtnpack_mr","is",mrr],
			   ],
			   columns:
			   [
                 "custrecord_kod_packrtn_trackingnum",
				  "custrecord_ispackrecvd",
				  "internalid"
			   ]
			});
			var searchResultCount = customrecord_kod_mr_packagesSearchObj.runPaged().count;
			log.debug("customrecord_kod_mr_packagesSearchObj result count",searchResultCount);
			var arr=[];
			customrecord_kod_mr_packagesSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   arr.push(result.getValue({name:'custrecord_ispackrecvd'}));
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