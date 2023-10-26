/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/http','N/url','N/currentRecord','N/ui/dialog'],

function(http,url,currentrecord,dialog) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2 62528
     */
	var exports = {};
    function pageInit(scriptContext) {
    	console.log('suitelet');
    	/* window.onbeforeunload = null;
    	var record = currentrecord.get();
      	 var l=record.getValue({
      	 fieldId: 'custpage_ven_name'
      	 });
     	var sdate=record.getValue({
         	 fieldId: 'custpage_sdate'
         	 });
   	var edate=record.getValue({
        	 fieldId: 'custpage_edate'
        	 });
      	 if(l||sdate||edate){
      	
    	var field = record.getField({
    		fieldId: 'custpage_ven_name'
    	});
    	field.isDisabled = true;
    	var sdate = record.getField({
    		fieldId: 'custpage_sdate'
    	});
    	sdate.isDisabled = true;
    	var edate = record.getField({
    		fieldId: 'custpage_edate'
    	});
    	edate.isDisabled = true;
      	 } */
		 return true

    }
    function fieldChanged(scriptContext) {
    	return true

    }

   function search(){
	   //var vid =context.request.parameters.custpage_ven_name;
	 
   
   	var record = currentrecord.get();
   	 var edate=record.getValue({
   	 fieldId: 'custpage_date'
   	 });
   	var manufacturer=record.getValue({
      	 fieldId: 'custpage_manufacturer'
      	 });
	var category=record.getValue({
     	 fieldId: 'custpage_category'
     	 });
		 var mfg_processing=record.getValue({
     	 fieldId: 'custpage_mfg_processing'
     	 });
		 var customer=record.getValue({
     	 fieldId: 'custpage_customer'
     	 });
   	 
	 
	 var output = url.resolveScript({
		   scriptId: 'customscript_rsrx_sales_order_process',
		   deploymentId: 'customdeploy_rsrx_sales_order_process',
		   //returnExternalUrl: true
		  });
	  
	 //11/5/2020 format needed
	
	 if(edate){
		 var filterDate = new Date(edate);
		 var fDate  = filterDate.getDate();
		 var fMonth  = filterDate.getMonth()+1;
		 var fYear  = filterDate.getFullYear();
		 var dateFilter  = fMonth+"/"+fDate+"/"+fYear;
	   	 
	 		   output=output+'&expdate='+dateFilter; 
	 }
	 if(manufacturer){
		 output=output+'&manufacturer='+manufacturer
	 }
	 if(category){
		 output=output+'&category='+category
	 }
	  if(mfg_processing){
		 output=output+'&mfgprocessing='+mfg_processing
	 }
	  if(customer){
		 output=output+'&customer_no='+customer
	 }
	 
 	   window.onbeforeunload=function() { null;};
 	   console.log(output);
 	  location.replace(output);

  
	   
 
   }
   function resetfun(){
	   //var vid =context.request.parameters.custpage_ven_name;
	   console.log('calling');
	  
	
   	 var output = url.resolveScript({
 		   scriptId: 'customscript_rsrx_sales_order_process',
 		   deploymentId: 'customdeploy_rsrx_sales_order_process',
 		   //returnExternalUrl: true
 		  });
 	 
 	   console.log(output);
 	  location.replace(output);
   }
   function saveRecord(){
	  /*  //var vid =context.request.parameters.custpage_ven_name;
	   console.log('calling');
	  
	
   	 var output = url.resolveScript({
 		   scriptId: 'customscript_rsrx_sales_order_process',
 		   deploymentId: 'customdeploy_rsrx_sales_order_process',
 		   //returnExternalUrl: true
 		  });
 	 
 	   console.log(output);
 	  location.replace(output); */
	 // Get the inline HTML field value
	 	
	  var inlineHTMLValue=document.getElementById('custpage_my_inline_html_field_fs');
  //var inlineHTMLValue = nlapiGetFieldValue('custpage_inline_html_field');
console.log('inlineHTMLValue',inlineHTMLValue)
 
  var tables = inlineHTMLValue.querySelectorAll('table');
  console.log(tables)
var selectedTables = [];
  // Iterate over the tables
  for (var i = 0; i < tables.length; i++) {
    var table = tables[i];
 //console.log(table)
    // Check if the "Select for SO" checkbox is checked
    var checkbox = table.previousElementSibling.querySelector('.select-for-so');
	console.log(checkbox)
    if (checkbox.checked) {
      // Add the selected table to the array
      selectedTables.push(table);
    }
  }
console.log(selectedTables)


var final_data=[]
for(var i = 0; i < selectedTables.length; i++){
var t_data=[]
	 for (var j = 1; j < selectedTables[i].rows.length; j++) {
			var r_data=[];
          for (var k = 0; k < selectedTables[i].rows[j].cells.length; k++) {
            dataValue = selectedTables[i].rows[j].cells[k].innerHTML;
			 if(dataValue){
			 r_data.push(dataValue)
			 }else{
				 r_data.push(' ')
			 }
		  }
		  t_data.push(r_data);
        }
		final_data.push(t_data);

   }
   console.log('final_data',final_data);
   	var record = currentrecord.get();
   	 var edate=record.setValue({
   	 fieldId: 'custpage_data_field',
	 value:JSON.stringify(final_data)
   	 });
  return true;
   }
   
   exports.search = search;
   exports.resetfun = resetfun;
   exports.pageInit = pageInit;
   exports.fieldChanged = fieldChanged;
   exports.saveRecord = saveRecord;
   
   return exports;
    
});