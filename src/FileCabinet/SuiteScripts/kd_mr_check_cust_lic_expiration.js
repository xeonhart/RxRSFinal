/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/record", "N/search", "N/email", "N/runtime", "./Lib/rxrs_util"], /**
 * @param{record} record
 * @param{search} search
 * @param{search} email
 * @param{search} runtime
 */ (record, search, email, runtime, rxrsUtil) => {
  var PHARMEXPSEARCH = "customsearch_pharma_expiration_search_v2";
  /**
   * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
   * @param {Object} inputContext
   * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Object} inputContext.ObjectRef - Object that references the input data
   * @typedef {Object} ObjectRef
   * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
   * @property {string} ObjectRef.type - Type of the record instance that contains the input data
   * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
   * @since 2015.2
   */

  const getInputData = (inputContext) => {
    log.debug({ title: "Get Input Data", details: " Starting" });
    var customerIds = new Array();
    //  var customerWithExpiredLicense = [];
    try {
      let currentScript = runtime.getCurrentScript();
      let userId = runtime.getCurrentUser().id
      log.audit("userId", userId)
      let customer = currentScript.getParameter({
        name: "custscript_kd_customer",
      });
      log.debug("Customer Id ", customer);
      var pharmaDateExpSearch = search.load({
        id: PHARMEXPSEARCH,
      });
      if (customer) {
        pharmaDateExpSearch.filters.push(
          search.createFilter({
            name: "internalid",
            operator: "anyof",
            values: customer,
          })
        );
      }

      pharmaDateExpSearch.run().each(function (result) {
        var id = result.id;
        var dateExp = result.getValue({
          name: "custentity_kd_license_exp_date",
        });
        var isExpired = result.getValue({
          name: "custentity_kd_license_expired",
        });
        var stateDateExp = result.getValue({
          name: "custentity_state_license_exp",
        });
        log.debug("state exp date : " + stateDateExp);
        var stateLicenseisExpired = result.getValue({
          name: "custentity_kd_stae_license_expired",
        });

        log.debug(
          `Customer Id ${id}`,
          `State Lincese expired: ${stateLicenseisExpired} || DEA Lincesed expire: ${isExpired} `
        );

        customerIds.push({
          id: id,
          expired: isExpired,
          isStateLicenseExpired: stateLicenseisExpired,
        });

        return true;
      });

      let rrToProcess = {};
      rrToProcess.rrToUpdate = [];
      customerIds.forEach((data) => {
        let type = rxrsUtil.getEntityType(data.id);
        let custRec = record.load({
          type: type,
          id: data.id,
          isDynamic: true,
        });
        var isExpired = custRec.getValue("custentity_kd_license_expired");
        var stateLicenseExpired = custRec.getValue(
          "custentity_kd_stae_license_expired"
        );
        log.audit("Dea Licensed expired?", isExpired + "customer" + custRec.id);
        log.audit(
          "State Licensed expired?",
          stateLicenseExpired + "customer" + custRec.id
        );
        if (stateLicenseExpired != true) {
          let category = [1];
          rrToProcess.rrToUpdate.push(GetRR(data.id, category));
        }
        if (isExpired != true && stateLicenseExpired != true) {
          let category = [4, 3];
          rrToProcess.rrToUpdate.push(GetRR(data.id, category));
        }
        var stateExpiDate = custRec.getValue("custentity_state_license_exp");
        var expiDate = custRec.getValue("custentity_kd_license_exp_date");
        // log.debug('Customer Record ', JSON.stringify(custRec))
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, "0");
        var mm = String(today.getMonth() + 1); //January is 0!
        var yyyy = today.getFullYear();

        let dateToday = mm + "/" + dd + "/" + yyyy;
        log.debug("Date Today" + dateToday);
        let expirationDate;
        if (expiDate) {
          let xdd = String(expiDate.getDate()).padStart(2, "0");
          let xmm = String(expiDate.getMonth() + 1); //January is 0!
          let xyyyy = expiDate.getFullYear();
          expirationDate = xmm + "/" + xdd + "/" + xyyyy;
          log.debug("expiration date " + expirationDate);

          if (Date.parse(expirationDate) <= Date.parse(dateToday)) {
            log.debug("DEA license is expired");
            custRec.setValue({
              fieldId: "custentity_kd_license_expired",
              value: true,
            });

            if (data.id) {
              var licenseType = "DEA";
              createTask(data.id, licenseType,userId);
            }
          } else {
            log.debug("DEA license is not expired");
            custRec.setValue({
              fieldId: "custentity_kd_license_expired",
              value: false,
            });
          }
        }
        if (stateExpiDate) {
          let xdd = String(stateExpiDate.getDate()).padStart(2, "0");
          let xmm = String(stateExpiDate.getMonth() + 1); //January is 0!
          let xyyyy = stateExpiDate.getFullYear();
          expirationDate = xmm + "/" + xdd + "/" + xyyyy;
          log.debug("expiration date " + expirationDate);

          if (Date.parse(expirationDate) <= Date.parse(dateToday)) {
            log.debug("State license is expired");
            custRec.setValue({
              fieldId: "custentity_kd_stae_license_expired",
              value: true,
            });

            if (data.id) {
              var licenseType = "STATE";
              createTask(data.id, licenseType,userId);
            }
          } else {
            log.debug("State license is not expired");
            custRec.setValue({
              fieldId: "custentity_kd_stae_license_expired",
              value: false,
            });
          }
        }
        custRec.save();
      });

      return rrToProcess.rrToUpdate.flat(2);
    } catch (e) {
      log.error("getInputData", e.message);
    }
  };


  /**
   * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
   * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
   * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
   *     provided automatically based on the results of the map stage.
   * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
   *     reduce function on the current group
   * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
   * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} reduceContext.key - Key to be processed during the reduce stage
   * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
   *     for processing
   * @since 2015.2
   */
  const reduce = (context) => {
    try {
     let reduceObj = JSON.parse(context.values)
      var trackingNumber = ''
      let rrId = reduceObj.rrIds
      let recType = rxrsUtil.getReturnRequestType(rrId)
      var rrRec = record.load({
        type: recType,
        id: rrId,
        isDynamic: true
      })

      var retCategory = rrRec.getValue('custbody_kd_rr_category')

      log.audit('UpdateRR','category: '+retCategory )
      if (retCategory == rxrsUtil.RRCATEGORY.RXOTC || retCategory == rxrsUtil.RRCATEGORY.C3TO5) {
        log.audit('Updating category 1 or 4')
        var customrecord_kod_mr_packagesSearchObj = search.create({
          type: "customrecord_kod_mr_packages",
          filters:
              [
                ["custrecord_kod_packrtn_rtnrequest", "anyof", rrId]
              ],
          columns:
              [
                search.createColumn({
                  name: "custrecord_kod_packrtn_trackingnum",
                  label: "Tracking Number"
                })
              ]
        });
        var searchResultCount = customrecord_kod_mr_packagesSearchObj.runPaged().count;
        log.debug("customrecord_kod_mr_packagesSearchObj result count", searchResultCount);
        customrecord_kod_mr_packagesSearchObj.run().each(function (result) {
          // .run().each has a limit of 4,000 results
          trackingNumber = result.getValue({
            name: 'custrecord_kod_packrtn_trackingnum'
          })
          return true;
        });
        log.audit('Tracking number', trackingNumber)
        if (trackingNumber) {
          log.audit('Setting ' + rrId + ' to Pending Package Receipt' )
          rrRec.setValue({
            fieldId: 'transtatus',
            value: rxrsUtil.rrStatus.PendingPackageReceipt
          })
        }
      } else {
        log.audit('Updating C2 RR to C2 Kit to be mailed | RR ID:', rrRec.id)
        rrRec.setValue({
          fieldId: 'transtatus',
          value: rxrsUtil.rrStatus.C2Kittobemailed
        })
      }

      var rrIdSave = rrRec.save({ignoreMandatoryFields: true})
      //  log.audit('RR ' + rrIds[i] + 'has been move to authorized stage')
      if (retCategory == rxrsUtil.RRCATEGORY.C2) {
        if (rrIdSave) {
          var recipient = rrRec.getValue('entity')
          var strSubject = ' Your Order #' + rrRec.getValue('tranid') + ' 222 Kit is on the way'
          var strBody = ' Your Order #' + rrRec.getValue('tranid') + ' 222 Kit is on the way'
          var userObj = runtime.getCurrentUser()
          email.send({
            author: userObj.id,
            recipients: recipient,
            subject: strSubject,
            body: strBody
          });
        }
      }
    } catch (e) {
      log.error("reduce", e.message);
    }

  };

  /**
   * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
   * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
   * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
   * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
   *     script
   * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
   * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
   * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
   * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
   *     script
   * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
   * @param {Object} summaryContext.inputSummary - Statistics about the input stage
   * @param {Object} summaryContext.mapSummary - Statistics about the map stage
   * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
   * @since 2015.2
   */
  const summarize = (summaryContext) => {};

  function GetRR(customerId, category) {
    let rrIds = [];
    let custId = customerId.toString();
    try {
      var transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["type", "anyof", "CuTrSale102", "CuTrPrch106"],
          "AND",
          ["status","anyof","CuTrSale102:A","CuTrPrch106:A"],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          [
            "formulanumeric: case when {entity.id} = " +
              custId +
              " then 1 else 0 end",
            "equalto",
            "1",
          ],
          "AND",
          ["custbody_kd_rr_category", "anyof", category],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
          search.createColumn({ name: "statusref", label: "Status" }),
          search.createColumn({
            name: "formulatext",
            formula: "{entity.id}",
            label: "Formula (Text)",
          }),
        ],
      });
      transactionSearchObj.run().each(function (result) {
        rrIds.push({
          customerId: customerId,
          rrIds: result.id,
        });

        return true;
      });
      log.emergency("rrIds", rrIds);
      return rrIds;
    } catch (e) {
      log.error(e.message);
    }
  }

  function createTask(customer, licenceType,userId) {
    try {
      var taskRec = record.create({
        type: record.Type.TASK,
        isDynamic: true,
      });
      taskRec.setValue({
        fieldId: "title",
        value: licenceType + " license is Expired for " + customer,
      });
      taskRec.setValue({
        fieldId: "message",
        value: licenceType + " license is Expired for " + customer,
      });
      taskRec.setValue({
        fieldId: "status",
        value: "PROGRESS",
      });

      taskRec.setValue({
        fieldId: "assigned",
        value: 1177,
      });

      var taskId = taskRec.save();
      log.debug("task id ", taskId);
    } catch (e) {
      log.error("createTask", e.message);
    }
  }

  /**
   * @param options.custId
   * @param options.category
   * @param custId
   */

  return {
    getInputData,

    reduce,
    summarize,
  };
});
