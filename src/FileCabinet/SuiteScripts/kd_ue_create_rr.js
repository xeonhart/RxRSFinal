/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  "N/file",
  "N/record",
  "N/search",
  "N/runtime",
  "N/email",
  "N/https",
  "N/task",
  "./Lib/rxrs_util",
], /**
 * @param{file} file
 * @param{record} record
 * @param search
 * @param{record} runtime
 * @param{record} email
 * @param https
 * @param rxrsUtil
 */ (file, record, search, runtime, email, https, task, rxrsUtil) => {
  const QUICKCASH = 4;
  // const sendEmail = (category, entity, status, tranid) => {
  //     var strSubject = '';
  //     var strBody = '';
  //     var recipient = '';
  //     if (category === 3 && status === 'J') {
  //         recipient = entity
  //         strSubject = ' Your Order #' + tranid + '  222 Kit is on the way'
  //         strBody = ' Your Order #' + tranid + '  222 Kit is on the way'
  //
  //
  //     } else {
  //         recipient = entity
  //         strSubject = ' Your Order #' + tranid + '  Has Been Submitted'
  //         strBody = ' Your Order #' + tranid + '  Has Been Submitted'
  //     }
  //     if (recipient) {
  //         var userObj = runtime.getCurrentUser()
  //         if (userObj.id) {
  //             email.send({
  //                 author: userObj.id,
  //                 recipients: recipient,
  //                 subject: strSubject,
  //                 body: strBody
  //             });
  //
  //         } else {
  //             email.send({
  //                 author: -5,
  //                 recipients: recipient,
  //                 subject: strSubject,
  //                 body: strBody
  //             });
  //         }
  //     }
  // }
  // const createTask = (exId, rrId) => {
  //     var taskRec = record.create({
  //         type: record.Type.TASK
  //     })
  //     taskRec.setValue({
  //         fieldId: 'title',
  //         value: exId
  //     })
  //     taskRec.setValue({
  //         fieldId: 'message',
  //         value: 'Print labels and form 222'
  //     })
  //     taskRec.setValue({
  //         fieldId: 'assigned',
  //         value: runtime.getCurrentUser().id
  //     })
  //     taskRec.setValue({
  //         fieldId: 'custevent_kd_ret_req',
  //         value: rrId
  //     })
  //     var taskId = taskRec.save()
  //     log.debug('task id ', taskId)
  // }
  // const createReturnPackages = (rrId, mrrId, requestedDate, category, customer, isC2) => {
  //     var rpIds = search.load('customsearch_kd_package_return_search_2').run().getRange({start: 0, end: 1});
  //     var rpName = 'RP' + (parseInt(rpIds[0].getValue({
  //         name: 'internalid',
  //         summary: search.Summary.MAX
  //     })) + parseInt(1));
  //     log.debug('Return Packages Name', rpName);
  //
  //     var packageRec = record.create({
  //         type: 'customrecord_kod_mr_packages',
  //         isDynamic: true
  //     })
  //
  //     packageRec.setValue({
  //         fieldId: 'name',
  //         value: rpName
  //     })
  //     packageRec.setValue({
  //         fieldId: 'custrecord_kod_rtnpack_mr',
  //         value: mrrId
  //     })
  //     // if (isC2 == true) {
  //     //     packageRec.setValue({
  //     //         fieldId: 'custrecord_kd_is_222_kit',
  //     //         value: true
  //     //     })
  //     // }
  //     packageRec.setValue({
  //         fieldId: 'custrecord_kod_packrtn_rtnrequest',
  //         value: rrId
  //     })
  //     packageRec.setValue({
  //         fieldId: 'custrecord_kod_packrtn_control',
  //         value: category
  //     })
  //     packageRec.setValue({
  //         fieldId: 'custrecord_kod_packrtn_reqpickup',
  //         value: requestedDate
  //     })
  //     packageRec.setValue({
  //         fieldId: 'custrecord_kd_rp_customer',
  //         value: customer
  //     })
  //     var id = packageRec.save({ignoreMandatoryFields: true})
  //     log.debug('Package Return Id' + id)
  //
  //     var url = "https://aiworksdev.agiline.com/global/index?globalurlid=07640CE7-E9BA-4931-BB84-5AB74842AC99&param1=ship";
  //
  //     url = url + "&param2=" + id;
  //
  //     var env = runtime.envType;
  //     if (env === runtime.EnvType.SANDBOX) {
  //         env = 'SANDB';
  //     } else if (env === runtime.EnvType.PRODUCTION) {
  //         env = 'PROD';
  //     }
  //     url = url + "&param3=" + env + "&param4=CREATE";
  //
  //     log.debug('DEBUG', url);
  //     var response = https.get({
  //         url: url
  //     });
  //
  //     log.debug({
  //         title: "Server Response Headers",
  //         details: response.headers
  //     });
  //
  // }

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  // function createReturnRequest(masterRecId, customer, category, docFile, item, requestedDate, isLicenseExpired, isStateLicenseExpired) {
  //     var rrRec = record.create({
  //         type: 'customsale_kod_returnrequest',
  //         isDynamic: false
  //     });
  //     if (category == 3 && isLicenseExpired == false && isStateLicenseExpired == false) {
  //         log.audit('Category is 2')
  //         rrRec.setValue({
  //             fieldId: 'transtatus',
  //             value: 'J'
  //         })
  //
  //     } else {
  //         rrRec.setValue({
  //             fieldId: 'transtatus',
  //             value: 'A'
  //         })
  //
  //     }
  //     rrRec.setValue({
  //         fieldId: 'entity',
  //         value: customer
  //     })
  //
  //
  //     rrRec.setValue({
  //         fieldId: 'custbody_kd_master_return_id',
  //         value: masterRecId
  //
  //     })
  //     rrRec.setValue({
  //         fieldId: 'custbody_kd_rr_category',
  //         value: category
  //     })
  //     rrRec.setValue({
  //         fieldId: 'location',
  //         value: 1
  //     });
  //     rrRec.setValue({
  //         fieldId: 'custbody_kd_file',
  //         value: docFile
  //     })
  //     rrRec.setValue({
  //         fieldId: 'custbody_kd_requested_pick_up_date',
  //         value: requestedDate
  //     })
  //
  //     rrRec.setSublistValue({
  //         sublistId: 'item',
  //         fieldId: 'item',
  //         line: 0,
  //         value: item
  //
  //     })
  //     rrRec.setSublistValue({
  //         sublistId: 'item',
  //         fieldId: 'amount',
  //         line: 0,
  //         value: 1
  //
  //     })
  //     rrRec.setSublistValue({
  //         sublistId: 'item',
  //         fieldId: 'custcol_kod_fullpartial',
  //         line: 0,
  //         value: 1
  //
  //     })
  //     var Id = rrRec.save({ignoreMandatoryFields: true})
  //     if (Id) {
  //
  //         var rrRec = record.load({
  //             type: 'customsale_kod_returnrequest',
  //             id: Id
  //         });
  //         if (category == 3) {
  //             var extId = rrRec.getValue('tranid')
  //             createTask(extId, rrRec.id)
  //             if (rrRec.getValue('custbody_kd_state_license_expired') === false && rrRec.getValue('custbody_kd_license_expired')) {
  //                 sendEmail(3, rrRec.getValue('entity'), rrRec.getValue('transtatus'), rrRec.getValue('tranid'))
  //             }
  //         }
  //         log.debug('RR ID ' + Id)
  //         var cat = rrRec.getValue({
  //             fieldId: 'custbody_kd_rr_category'
  //         })
  //         var requestedDate = rrRec.getValue({
  //             fieldId: 'custbody_kd_requested_pick_up_date'
  //         })
  //
  //         var customer = rrRec.getValue({
  //             fieldId: 'entity'
  //         })
  //         var isC2;
  //         if (cat == 3) {
  //             isC2 = true
  //         }
  //         sendEmail(0, customer, rrRec.getValue('transtatus'), rrRec.getValue('tranid'))
  //         log.debug('requested date' + requestedDate + 'customer ' + customer + 'category ' + category)
  //         log.debug('TEST', 'numOfLabels ' + numOfLabels);
  //         if (numOfLabels) {
  //             log.debug('nummberofLabels ' + numOfLabels)
  //             for (var i = 0; i < numOfLabels; i++) {
  //                 createReturnPackages(Id, masterRecId, requestedDate, cat, customer, isC2)
  //             }
  //         }
  //
  //
  //     }
  // }

  const afterSubmit = (context) => {
    const masterRec = context.newRecord;
    const masterRecId = masterRec.id;
    let mrrStatus = masterRec.getValue("custrecord_kod_mr_status");
    try {
      if (mrrStatus == rxrsUtil.mrrStatus.CustomerSubmitted) {

        const customer = masterRec.getValue({
          fieldId: "custrecord_mrrentity",
        });
        const planSelectionType = masterRec.getValue(
          "custrecord_mrrplanselectiontype"
        );

        const RXOTC = masterRec.getValue("custrecord_kd_rxotc");
        log.debug({ title: "RXOTC ", details: RXOTC });
        const RXOTCFile = masterRec.getValue("custrecord_kd_mrr_rx_otc_file");
        const C2 = masterRec.getValue("custrecord_kd_c2");
        log.debug({ title: "C2 ", details: C2 });
        const C2File = masterRec.getValue("custrecord_kd_mrr_c2_file");

        const C3to5 = masterRec.getValue("custrecord_kd_c3to5");

        const C3to5File = masterRec.getValue("custrecord_kd_mrr_c3_5_file");

        const isLicenseExpired = masterRec.getValue(
          "custrecord_kd_license_expired"
        );
        const isStateLicenseExpired = masterRec.getValue(
          "custrecord_kd_state_license_expired"
        );

        let rrCategory = [];
        if (RXOTC === true) {
          const numOfLabels = masterRec.getValue(
            "custrecord_kd_mrr_rx_otc_no_labels"
          );
          const requestedDate = masterRec.getValue(
            "custrecord_kd_mrr_rx_otc_pickup_date"
          );

          rrCategory.push({
            category: rxrsUtil.RRCATEGORY.RXOTC,
            numOfLabels: numOfLabels,
            file: RXOTCFile,
            item: rxrsUtil.rxrsItem.RxOTC,
            requestedDate: requestedDate,
            masterRecId: masterRecId,
            customer: customer,
            isLicenseExpired: isLicenseExpired,
            isStateLicenseExpired: isStateLicenseExpired,
            planSelectionType: planSelectionType,
          });

          //  createReturnRequest(masterRecId, customer, 1, RXOTCFile, 626, requestedDate, isLicenseExpired, isStateLicenseExpired)
        }

        if (C2 === true) {
          const numOfLabels = masterRec.getValue(
            "custrecord_kd_mrr_c2_no_labels"
          );
          const requestedDate = masterRec.getValue(
            "custrecord_kd_mrr_c2_pickup_date"
          );

          rrCategory.push({
            category: rxrsUtil.RRCATEGORY.C2,
            numOfLabels: numOfLabels,
            file: C2File,
            item: rxrsUtil.rxrsItem.C2,
            requestedDate: requestedDate,
            masterRecId: masterRecId,
            customer: customer,
            isLicenseExpired: isLicenseExpired,
            isStateLicenseExpired: isStateLicenseExpired,
            planSelectionType: planSelectionType,
          });

          // createReturnRequest(masterRecId, customer, 3, C2File, 628, requestedDate, isLicenseExpired, isStateLicenseExpired)
        }
        if (C3to5 === true) {
          const numOfLabels = masterRec.getValue(
            "custrecord_kd_mrr_c3_5_no_labels"
          );
          const requestedDate = masterRec.getValue(
            "custrecord_kd_mrr_c3_5_pickup_date"
          );

          rrCategory.push({
            category: rxrsUtil.RRCATEGORY.C3TO5,
            numOfLabels: numOfLabels,
            file: C3to5File,
            item: rxrsUtil.rxrsItem.C3To5,
            requestedDate: requestedDate,
            masterRecId: masterRecId,
            customer: customer,
            isLicenseExpired: isLicenseExpired,
            isStateLicenseExpired: isStateLicenseExpired,
            planSelectionType: planSelectionType,
          });

          //  createReturnRequest(masterRecId, customer, 4, C3to5File, 627, requestedDate, isLicenseExpired, isStateLicenseExpired)
        }
        log.audit("rrCategory",rrCategory)
        const totalNumberOfLabels = rrCategory.reduce(
          (sum, { numOfLabels }) => sum + numOfLabels,
          0
        );
        let returnPackage = [];
        if (totalNumberOfLabels < 50) {
          rrCategory.forEach((rrCategory) => {
            let packageObj = rxrsUtil.createReturnRequest(rrCategory);
            log.debug("packageObj", packageObj);
            for (let i = 0; i < packageObj.numOfLabels; i++) {
              rxrsUtil.createReturnPackages(packageObj);
            }
          });
        } else {
          rrCategory.forEach((rrCategory) => {
            returnPackage.push(rxrsUtil.createReturnRequest(rrCategory));
          });
          const deploymentId = runtime
            .getCurrentScript()
            .getParameter("custscript_rxrs_mr_script_deployment");
          const scriptId = runtime
            .getCurrentScript()
            .getParameter("custscript_rxrs_mr_script_id");

          try {
            const mrTask = task.create({
              taskType: task.TaskType.MAP_REDUCE,
              scriptId: scriptId,
              deploymentId: deploymentId,
              params: {
                custscript_rxrs_category: returnPackage,
              },
            });
            const mrTaskId = mrTask.submit();
            log.debug("mr TaskID", { mrTaskId, deploymentId });
          } catch (e) {
            log.error("error", e.message);
            //Use the second deployment if the first deployment is still in progress
            const secondDeploymentId =
              "customdeploy_rxrs_mr_create_rr_and_pack2";
            const mrTask = task.create({
              taskType: task.TaskType.MAP_REDUCE,
              scriptId: scriptId,
              deploymentId: secondDeploymentId,
              params: {
                custscript_rxrs_category: returnPackage,
              },
            });
            const mrTaskId = mrTask.submit();
            log.debug("mr TaskID", { mrTaskId, secondDeploymentId });
          }
        }

        log.audit("returnPackage", returnPackage);
      }
    } catch (e) {
      log.error("afterSubmit", e.message);
    }
  };

  return { afterSubmit };
});
