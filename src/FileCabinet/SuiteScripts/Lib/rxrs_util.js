/**
 * @NApiVersion 2.1
 */
define([
  "N/email",
  "N/file",
  "N/runtime",
  "N/search",
  "N/record",
  "N/https",
], /**
 * @param{email} email
 * @param{file} file
 * @param{runtime} runtime
 * @param{search} search
 * @param record
 * @param https
 */ (email, file, runtime, search, record, https) => {
  const RRCATEGORY = Object.freeze({
    C2: 3,
    RXOTC: 1,
    C3TO5: 4,
  });

  const priceLevel = [
    { priceName: "Mfg ERV (SysCalc)", column: "price4" },
    { priceName: "Non-Returnable", column: "price7" },
    { priceName: "Non-scannable", column: "price11" },
    { priceName: "Pharma - Credit (ERV SysCalc)", column: "price10" },
    { priceName: "Pharma - Credit (UP SysCalc)", column: "price9" },
    { priceName: "Pharma - Credit (input)", column: "price8" },
    { priceName: "Unit Price (input)", column: "price2" },
    { priceName: "Online Price", column: "price5" },
    {
      priceName: "Wholesale Acquisition Price " + '"WAC"' + " (input)",
      column: "baseprice",
    },
  ];
  const rrStatus = Object.freeze({
    PendingReview: "A",
    Rejected: "B",
    Authorized: "C",
    PendingPackageReceipt: "D",
    ReceivedPendingProcessing: "E",
    Processing: "F",
    PendingApproval: "G",
    Rejected_Resubmission: "H",
    Approved: "I",
    C2Kittobemailed: "J",
    PendingVerification: "K",
  });
  const mrrStatus = Object.freeze({
    CustomerSubmitted: 1,
    New: 11,
    WaitingForApproval: 8,
    Approved: 10,
    PriceLocked: 12,
    Archived: 13,
    InProgress: 14,
  });
  const QUICKCASH = 4;

  const rxrsItem = Object.freeze({
    RxOTC: 897,
    C3To5: 896,
    C2: 895,
    NonScannableItem: 649,
  });

  /**
   * Create Return Request and Return Packages
   * @param {int} options.category
   * @param {int} options.numOfLabels
   * @param {int} options.docFile
   * @param {int} options.item
   * @param {string} options.requestedDate
   * @param {int} options.masterRecId
   * @param {int} options.customer
   * @param {boolean} options.isLicenseExpired
   * @param {boolean} options.isStateLicenseExpired
   * @param {int} options.planSelectionType
   */
  function createReturnRequest(options) {
    try {
      let recordType = "";
      let location = 1;
      let rrpoName
      if (options.planSelectionType == QUICKCASH) {
        recordType = "custompurchase_returnrequestpo";
         rrpoName = generateRRPODocumentNumber()
      } else {
        recordType = "customsale_kod_returnrequest";
      }
      log.debug("createReturnRequest", options);
      const rrRec = record.create({
        type: recordType,
        isDynamic: false,
      });
      if (
        options.category === RRCATEGORY.C2 &&
        options.isLicenseExpired === false &&
        options.isStateLicenseExpired === false
      ) {
        rrRec.setValue({
          fieldId: "transtatus",
          value: rrStatus.C2Kittobemailed,
        });
      } else {
        rrRec.setValue({
          fieldId: "transtatus",
          value: rrStatus.PendingReview,
        });
      }
      rrpoName && rrRec.setValue({
        fieldId: "tranid",
        value: rrpoName
      })
      rrRec.setValue({
        fieldId: "entity",
        value: options.customer,
      });

      rrRec.setValue({
        fieldId: "custbody_kd_master_return_id",
        value: options.masterRecId,
      });
      rrRec.setValue({
        fieldId: "custbody_kd_rr_category",
        value: options.category,
      });
      rrRec.setValue({
        fieldId: "location",
        value: location,
      });
      rrRec.setValue({
        fieldId: "custbody_kd_file",
        value: options.docFile,
      });
      rrRec.setValue({
        fieldId: "custbody_kd_requested_pick_up_date",
        value: options.requestedDate,
      });

      rrRec.setSublistValue({
        sublistId: "item",
        fieldId: "item",
        line: 0,
        value: options.item,
      });
      rrRec.setSublistValue({
        sublistId: "item",
        fieldId: "amount",
        line: 0,
        value: 1,
      });
      rrRec.setSublistValue({
        sublistId: "item",
        fieldId: "custcol_kod_fullpartial",
        line: 0,
        value: 1,
      });
      let RRId = rrRec.save({ ignoreMandatoryFields: true });
      if (RRId) {
        const rrRecSave = record.load({
          type: recordType,
          id: RRId,
        });
        let tranId = rrRecSave.getValue("tranid");

        let tranStatus = rrRecSave.getValue("transtatus");
        log.audit("tranId", { tranId, tranStatus });
        if (options.category === RRCATEGORY.C2) {
          createTask({
            tranId: tranId,
            rrId: RRId,
          });
          if (
            rrRecSave.getValue("custbody_kd_state_license_expired") === false &&
            rrRecSave.getValue("custbody_kd_license_expired")
          ) {
            sendEmail({
              category: RRCATEGORY.C2,
              entity: options.customer,
              transtatus: tranStatus,
              tranid: tranId,
              internalId: RRId,
            });
          }
        }
        log.debug("RR ID " + RRId);
        const cat = rrRecSave.getValue({
          fieldId: "custbody_kd_rr_category",
        });
        const requestedDate = rrRecSave.getValue({
          fieldId: "custbody_kd_requested_pick_up_date",
        });

        const customer = rrRecSave.getValue({
          fieldId: "entity",
        });
        let isC2 = cat === RRCATEGORY.C2;
        sendEmail({
          category: options.category,
          transtatus: tranStatus,
          entity: options.customer,
          tranid: tranId,
          internalId: RRId,
        });

        const numOfLabels = options.numOfLabels;
        const masterRecId = options.masterRecId;
        return {
          rrId: RRId,
          numOfLabels: numOfLabels,
          mrrId: masterRecId,
          requestedDate: requestedDate,
          category: cat,
          customer: customer,
          isC2: isC2,
        };
      }
    } catch (e) {
      log.error("createReturnRequest", e.message);
    }
  }

  /**
   * Send email to the customer
   * @param {number} options.category
   * @param {string} options.transtatus
   * @param {number} options.entity
   * @param {number} options.tranid
   * @param {number} options.internalId
   */
  const sendEmail = (options) => {
    try {
      log.debug("sendEmail", options);
      let strSubject = "";
      let strBody = "";
      let recipient = "";
      if (
        options.category === RRCATEGORY.C2 &&
        options.transtatus === rrStatus.C2Kittobemailed
      ) {
        recipient = +options.entity;
        strSubject =
          " Your Order #" + options.tranid + "  222 Kit is on the way";
        strBody = " Your Order #" + options.tranid + "  222 Kit is on the way";
      } else {
        recipient = +options.entity;
        strSubject = " Your Order #" + options.tranid + "  Has Been Submitted";
        strBody = " Your Order #" + options.tranid + "  Has Been Submitted";
      }
      if (recipient) {
        const userObj = runtime.getCurrentUser();
        if (userObj.id) {
          email.send({
            author: userObj.id,
            recipients: recipient,
            subject: strSubject,
            body: strBody,
            relatedRecords: {
              entityId: +options.entity,
              transactionId: options.internalId,
            },
          });
        } else {
          email.send({
            author: -5,
            recipients: recipient,
            subject: strSubject,
            body: strBody,
            relatedRecords: {
              entityId: options.entity,
              transactionId: options.internalId,
            },
          });
        }
      }
    } catch (e) {
      log.error("sendEmail", {
        errorMessage: e.message,
        parameters: options,
      });
    }
  };
  /**
   * Create Tasks
   * @param options.tranId
   * @param options.rrId
   */
  const createTask = (options) => {
    try {
      log.debug("Create Tasks Params", options);
      const taskRec = record.create({
        type: record.Type.TASK,
      });
      taskRec.setValue({
        fieldId: "title",
        value: options.tranId,
      });
      taskRec.setValue({
        fieldId: "message",
        value: "Print labels and form 222",
      });
      taskRec.setValue({
        fieldId: "assigned",
        value: runtime.getCurrentUser().id,
      });
      taskRec.setValue({
        fieldId: "custevent_kd_ret_req",
        value: options.rrId,
      });
      log.debug("task id ", taskRec.save());
    } catch (e) {
      log.error("createTask", e.message);
    }
  };
  /**
   * Create inbound packages
   * @param {number} options.mrrId master return request number
   * @param {number} options.rrId return request Id
   * @param {string} options.requestedDate  requested date
   * @param {number} options.category Return request category
   * @param {boolean} options.isC2 Check if the category is C2
   * @param {number} options.customer Customer indicated in the Master Return Request
   */
  const createReturnPackages = (options) => {
    try {
      log.audit("options", options);
      const rpIds = search
        .load("customsearch_kd_package_return_search_2")
        .run()
        .getRange({ start: 0, end: 1 });
      let rpName =
        "RP" +
        (parseInt(
          rpIds[0].getValue({
            name: "internalid",
            summary: search.Summary.MAX,
          })
        ) +
          parseInt(1));

      const packageRec = record.create({
        type: "customrecord_kod_mr_packages",
        isDynamic: true,
      });

      packageRec.setValue({
        fieldId: "name",
        value: rpName,
      });
      packageRec.setValue({
        fieldId: "custrecord_kod_rtnpack_mr",
        value: options.mrrId,
      });
      if (options.isC2 === true) {
        packageRec.setValue({
          fieldId: "custrecord_kd_is_222_kit",
          value: true,
        });
      }
      packageRec.setValue({
        fieldId: "custrecord_kod_packrtn_rtnrequest",
        value: options.rrId,
      });
      packageRec.setValue({
        fieldId: "custrecord_kod_packrtn_control",
        value: options.category,
      });
      packageRec.setValue({
        fieldId: "custrecord_kod_packrtn_reqpickup",
        value: options.requestedDate,
      });
      packageRec.setValue({
        fieldId: "custrecord_kd_rp_customer",
        value: options.customer,
      });
      let id = packageRec.save({ ignoreMandatoryFields: true });
      log.debug("Package Return Id" + id);

      // let url =
      //   "https://aiworksdev.agiline.com/global/index?globalurlid=07640CE7-E9BA-4931-BB84-5AB74842AC99&param1=ship";
      //
      // url = url + "&param2=" + id;
      //
      // var env = runtime.envType;
      // if (env === runtime.EnvType.SANDBOX) {
      //   env = "SANDB";
      // } else if (env === runtime.EnvType.PRODUCTION) {
      //   env = "PROD";
      // }
      // url = url + "&param3=" + env + "&param4=CREATE";
      //
      // log.debug("DEBUG", url);
      // var response = https.get({
      //   url: url,
      // });
      //
      // log.debug({
      //   title: "Server Response Headers",
      //   details: response.headers,
      // });
    } catch (e) {
      log.error("createReturnPackages", {
        errorMessage: e.message,
        parameters: options,
      });
    }
  };

  /**
   * Check if both deployments is currently in progress or pending
   * @return {boolean} return if the both deployments is currently active
   */
  function checkInstanceInstnaceMR() {
    const scheduledscriptinstanceSearchObj = search.create({
      type: "scheduledscriptinstance",
      filters: [
        [
          [
            "scriptdeployment.scriptid",
            "startswith",
            "customdeploy_rxrs_mr_create_rr_and_pack",
          ],
          "OR",
          [
            "scriptdeployment.scriptid",
            "startswith",
            "customdeploy_rxrs_mr_create_rr_and_pack2",
          ],
        ],
        "AND",
        ["status", "anyof", "PENDING", "PROCESSING"],
      ],
      columns: [
        search.createColumn({
          name: "scriptid",
          join: "scriptDeployment",
          label: "Custom ID",
        }),
      ],
    });
    const searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
    return searchResultCount == 2;
  }

  /**
   * Check if there's a current deployment running in the background
   * @param {string} deploymentId Deployment Id of the Script
   * @return {boolean}
   */
  function scriptInstanceChecker(deploymentId) {
    try {
      var scheduledscriptinstanceSearchObj = search.create({
        type: "scheduledscriptinstance",
        filters: [
          ["scriptdeployment.scriptid", "is", deploymentId],
          "AND",
          ["status", "anyof", "PROCESSING"],
        ],
      });
      let count = scheduledscriptinstanceSearchObj.runPaged().count;
      log.audit("count", { count, deploymentId });
      return scheduledscriptinstanceSearchObj.runPaged().count != 0;
    } catch (e) {
      log.error("scriptInstanceChecker", e.message);
    }
  }

  function generateRRPODocumentNumber() {
    let name = "RRPO";
    const transactionSearchObj = search.create({
      type: "transaction",
      filters: [["type", "anyof", "CuTrPrch106"]],
      columns: [
        search.createColumn({
          name: "transactionnumber",
          summary: "COUNT",
          label: "Transaction Number",
        }),
      ],
    });
    transactionSearchObj.run().each(function (result) {
      name =
        name +
        (+result.getValue({
          name: "transactionnumber",
          summary: "COUNT",
        }) +
          1);
    });
    return name;
  }

  return {
    rxrsItem,
    RRCATEGORY,
    mrrStatus,
    rrStatus,
    createReturnRequest,
    createReturnPackages,
    createTask,
    sendEmail,
    scriptInstanceChecker,
    checkInstanceInstnaceMR,
    generateRRPODocumentNumber
  };
});
