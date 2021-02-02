sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    'sap/m/MessageBox',
    "sap/m/MessageToast"

], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.tsmc.headcount.controller.Master", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this._bDescendingSort = false;
            this._initData();
        },
        onListItemPress: function (oEvent) {
            var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1),
                orgPath = oEvent.getSource().getBindingContext("adjust").getPath();
            var orgDetail = this.getView().getModel("adjust").getProperty(orgPath);
            var passPara = orgDetail.year + "#" + orgDetail.quarter + "#" + orgDetail.org + "#" +
                window.encodeURIComponent(orgDetail.orgName);
            this.oRouter.navTo("detail", { layout: oNextUIState.layout, product: passPara });

            var oItem = oEvent.getSource();
            //  oItem.setNavigated(true);
            var oParent = oItem.getParent();
            // store index of the item clicked, which can be used later in the columnResize event
            this.iIndex = oParent.indexOfItem(oItem);
        },
        _initData: function () {
            var obk1 = {
                "list": [{
                    "Id": "Q1",
                    "Text": "第一季度"
                }, {
                    "Id": "Q2",
                    "Text": "第二季度"
                }, {
                    "Id": "Q3",
                    "Text": "第三季度"
                }, {
                    "Id": "Q4",
                    "Text": "第四季度"
                }]
            };
            this.getView().setModel(new JSONModel(obk1), "quarter");

            var obk2 = {
                "list": [{
                    "Id": "Y",
                    "Text": "開放"
                }, {
                    "Id": "N",
                    "Text": "關閉"
                }]
            };
            this.getView().setModel(new JSONModel(obk2), "status");


            var obk3 = {
                "list": [{
                    "Id": "01",
                    "Text": "年度"
                }, {
                    "Id": "02",
                    "Text": "季度"
                }]
            };
            this.getView().setModel(new JSONModel(obk3), "type");

            this.byId("orgCollection").setVisible(false);
            this.byId("forQuarter").setVisible(false);
            this.byId("forYear").setVisible(false);
            this.byId("adjustTable").setVisible(false);


        },
        onSearch: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [new Filter("Name", FilterOperator.Contains, sQuery)];
            }

            this.getView().byId("productsTable").getBinding("items").filter(oTableSearchState, "Application");
        },
        onCreatePeriod: function () {
            if (!this.createPeriodDialog) {
                this.createPeriodDialog = sap.ui.xmlfragment(this.getView().getId(),
                    "com.tsmc.headcount.dialog.createPeriod",
                    this
                );
                this.getView().addDependent(this.createPeriodDialog);
            }
            this.createPeriodDialog.open();
        },
        onCreateYear: function () {
            if (!this.createYearDialog) {
                this.createYearDialog = sap.ui.xmlfragment(this.getView().getId(),
                    "com.tsmc.headcount.dialog.createYear",
                    this
                );
                this.getView().addDependent(this.createYearDialog);
            }
            this.createYearDialog.open();
        },
        createYear: function () {
            var postBody = {};
            postBody.year = this.getView().byId("dateYearForYear").getDateValue().getFullYear();
            postBody.active = this.getView().byId("statusSelectForYear").getSelectedKey();
            postBody.type = '01'; //固定值
            var that = this;
            var postJson = JSON.stringify(postBody);
            $.ajax({
                //   url: "/hc/period/createPeriod",
                url: "/period/createPeriodByPrimary",
                method: "POST",
                dataType: "json",
                data: postJson,
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        MessageToast.show("創建期間成功");
                        //update model
                        var year = {};
                        year.year = that.byId("dateYearForYear").getDateValue().getFullYear();
                        that.getView().getModel("comyear").getProperty("/YearCollection").push(year);
                        that.getView().getModel("comyear").refresh();

                    } else {
                        MessageToast.show("創建期間失敗");
                    }
                },
                error: function () {
                }
            });

            this.createYearDialog.close();
        },
        onChangePeriod: function () {
            //check 期间 is blank
            var selectedPeriod = this.getView().byId("comQuarter").getSelectedItem();
            if (selectedPeriod != null) {
                if (!this.changePeriodDialog) {
                    this.changePeriodDialog = sap.ui.xmlfragment(this.getView().getId(),
                        "com.tsmc.headcount.dialog.changePeriod",
                        this
                    );
                    this.getView().addDependent(this.changePeriodDialog);
                }
                this.changePeriodDialog.open();
                this.getView().byId("cdateYear").setValue(selectedPeriod.getKey().substring(0, 4));
                this.getView().byId("cquarterSelect").setSelectedKey(selectedPeriod.getKey().substring(4, 6));


            } else {
                var bValidationError = false;
                bValidationError = this._validateInput(this.getView().byId("comQuarter")) || bValidationError;

            }

        },
        onChangeYear: function () {
            //check 期间 is blank
            var selectedPeriod = this.getView().byId("comYear").getSelectedItem();
            if (selectedPeriod != null) {
                if (!this.changeYearDialog) {
                    this.changeYearDialog = sap.ui.xmlfragment(this.getView().getId(),
                        "com.tsmc.headcount.dialog.changeYear",
                        this
                    );
                    this.getView().addDependent(this.changeYearDialog);
                }
                this.changeYearDialog.open();
                this.getView().byId("cdateYearForYear").setValue(selectedPeriod.getKey().substring(0, 4));
            } else {
                var bValidationError = false;
                bValidationError = this._validateInput(this.getView().byId("comQuarter")) || bValidationError;

            }

        },
        createPeriod: function () {

            var postBody = {};
            postBody.year = this.getView().byId("dateYear").getDateValue().getFullYear();
            postBody.quarter = this.getView().byId("quarterSelect").getSelectedKey();
            postBody.active = this.getView().byId("statusSelect").getSelectedKey();
            postBody.type = '02';
            var that = this;
            var postJson = JSON.stringify(postBody);
            $.ajax({
                //   url: "/hc/period/createPeriod",
                url: "/period/createPeriodByPrimary",
                method: "POST",
                dataType: "json",
                data: postJson,
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        MessageToast.show("創建期間成功");
                        var period = {};
                        period.year = that.byId("dateYear").getDateValue().getFullYear();
                        period.quarter = that.byId("quarterSelect").getSelectedKey();
                        period.active = that.byId("statusSelect").getSelectedKey();
                        that.getView().getModel("comQuarter").getProperty("/QuarterCollection").push(period);
                        that.getView().getModel("comQuarter").refresh();
                    } else {
                        MessageToast.show("創建期間失敗");
                    }
                },
                error: function () {
                }
            });

            this.createPeriodDialog.close();
        },
        changePeriod: function () {
            var postBody = {};
            postBody.year = this.getView().byId("cdateYear").getValue();
            postBody.quarter = this.getView().byId("cquarterSelect").getSelectedKey();
            postBody.active = this.getView().byId("cstatusSelect").getSelectedKey();
            postBody.type = '02';
            var that = this;
            var postJson = JSON.stringify(postBody);
            $.ajax({
                //   url: "/hc/period/createPeriod",
                url: "/period/updatePeriodByPrimary",
                method: "POST",
                dataType: "json",
                data: postJson,
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        MessageToast.show("修改期間成功");
                    } else {
                        MessageToast.show("修改期間失敗");
                    }
                },
                error: function () {
                }
            });

            this.changePeriodDialog.close();
        },
        changeYear: function () {
            var postBody = {};
            postBody.year = this.getView().byId("cdateYearForYear").getValue();
            postBody.active = this.getView().byId("cstatusSelectForYear").getSelectedKey();
            postBody.type = '01';
            var that = this;
            var postJson = JSON.stringify(postBody);
            $.ajax({
                //   url: "/hc/period/createPeriod",
                url: "/period/updatePeriodByPrimary",
                method: "POST",
                dataType: "json",
                data: postJson,
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        MessageToast.show("修改期間成功");
                    } else {
                        MessageToast.show(data.message);
                    }
                },
                error: function () {
                }
            });

            this.changeYearDialog.close();
        },
        closeDialog: function (oEvent) {
            if (oEvent.getSource().oParent.getId().search("createPeriod") != -1) {
                this.createPeriodDialog.close();
            } else if (oEvent.getSource().oParent.getId().search("addOrg") != -1) {
                this.createOrgDialog.close();
            } else if (oEvent.getSource().oParent.getId().search("createYear") != -1) {
                this.createYearDialog.close();
            } else if (oEvent.getSource().oParent.getId().search("changeYear") != -1) {
                this.changeYearDialog.close();
            } else {
                this.changePeriodDialog.close();
            }

        },
        _validateInput: function (oInput) {
            if (oInput.getSelectedKey() != '') {
                var sValueState = "None";
                var bValidationError = false;
            } else {
                sValueState = "Error";
                bValidationError = true;
            }

            oInput.setValueState(sValueState);

            return bValidationError;
        },
        additionalCheck: function () {
            var selectedType = this.getView().byId("comType").getSelectedKey();

            var selectedPeriod;
            if (selectedType == '01') {
                selectedPeriod = this.getView().byId("comYear").getSelectedItem();

                //By Year
            } else if (selectedType == '02') {
                //By Period
                selectedPeriod = this.getView().byId("comQuarter").getSelectedItem();

            }

            if (selectedPeriod != null) {

                this._validateInput(this.getView().byId("comQuarter"));

                this._validateInput(this.getView().byId("comYear"));

                this.byId("step2").setVisible(true);

                var postBody = {};
                postBody.year = selectedPeriod.getKey().substring(0, 4);
                postBody.quarter = selectedPeriod.getKey().substring(4, 6);
                postBody.type = selectedType;
                var postJson = JSON.stringify(postBody);
                var that = this;
                $.ajax({
                    url: "/ou/selectOUBySearchModelByType/OTHER",
                    method: "POST",
                    dataType: "json",
                    data: postJson,
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Content-Type", "application/json");
                    },
                    success: function (data) {
                        if (data.success == true) {
                            var jsn = {};
                            jsn.OrgCollection = data.result;
                            that.getView().setModel(new JSONModel(jsn), "Orglist");
                        } else {
                        }
                    },
                    error: function () {
                    }
                });

            } else {

            }
        },
        handleUploadComplete: function (oEvent) {
            debugger;
            var response = JSON.parse(oEvent.getParameter("responseRaw"));
            if (response.success == true) {
                var jsn = {};
                jsn.OrgCollection = response.result.data;
                if (response.result.messageList == null) {
                    sap.m.MessageToast.show("文件上傳成功");
                    this.getView().setModel(new JSONModel(jsn), "Org");
                    this.byId("orgCollection").setVisible(true);
                }


            } else {
                sap.m.MessageToast.show("文件上傳失敗");
            }
        },
        handleDownloadTemplate: function () {
            //download upload excel template
            var aCols, aTemplate, oSettings, oSheet;

            aCols = [
                {
                    label: '年份',
                    property: 'YEAR',
                    width: '25'
                },
                {
                    label: '季度',
                    property: 'QUARTER',
                    width: '18'
                },
                {
                    label: '組織ID',
                    property: 'ORGID',
                    width: '18'
                },
                {
                    label: '預設填報人',
                    property: 'EMPID',
                    width: '18'
                }];


            aTemplate = [
                {
                    "YEAR": "2021",
                    "QUARTER": "Q4",
                    "ORGID": "00000100",
                    "EMPID": "001601"
                },
                {
                    "YEAR": "選填",
                    "QUARTER": "選填",
                    "ORGID": "必填",
                    "EMPID": "必填"
                }
            ]

            oSettings = {
                workbook: { columns: aCols },
                dataSource: aTemplate
            };

            oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(function () {
                    MessageToast.show('模板已導出');
                })
                .finally(oSheet.destroy);

        },
        onAddRow: function () {
            var selectedPeriod = this.getView().byId("comQuarter").getSelectedItem();
            var org = {};
            org.Year = selectedPeriod.getKey().substring(0, 4);
            org.Quarter = selectedPeriod.getKey().substring(4, 6);
            org.OrgID = "";
            org.EmpID = "";
            this.getView().setModel(new JSONModel(org), "addOrg");

            if (!this.createOrgDialog) {
                this.createOrgDialog = sap.ui.xmlfragment(this.getView().getId(),
                    "com.tsmc.headcount.dialog.createOrg",
                    this
                );
                this.getView().addDependent(this.createOrgDialog);
                this.createOrgDialog.open();
            } else {
                this.createOrgDialog.open();
            }

        },
        confirmOrgDialog: function () {
            var postBody = {};
            var orgModel = JSON.parse(this.getView().getModel("addOrg").getJSON());
            postBody.year = orgModel.Year;
            postBody.quarter = orgModel.Quarter;
            postBody.org = orgModel.OrgID;
            postBody.empId = orgModel.EmpID;
            postBody.lstUpdUsr = 'WANGYIQIONG';
            var that = this;
            var postJson = JSON.stringify(postBody);
            $.ajax({
                //   url: "/hc/period/createPeriod",
                url: "/ou/createOUByUnionPrimary",
                method: "POST",
                dataType: "json",
                data: postJson,
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        MessageToast.show("創建成功");
                    } else {
                        MessageToast.show("創建失敗");
                    }
                },
                error: function () {
                }
            });

            this.createOrgDialog.close();

        },
        onRemoveRow: function () {

            var selectedIndex = this.byId("orgListCollection").getSelectedIndices();
            var tableData = this.getView().getModel("Orglist").getProperty("/OrgCollection");
            var postData = [];
            var piece = {};
            for (var i = 0; i < selectedIndex.length; i++) {
                var rowData = tableData[selectedIndex[i]];
                piece.year = rowData.year;
                piece.quarter = rowData.quarter;
                piece.type = rowData.type;
                piece.org = rowData.org;
                postData.push(piece);
            }
            var postJson = JSON.stringify(postData);

            if (postData.length > 0) {

                $.ajax({
                    //   url: "/hc/period/createPeriod",
                    url: "/ou/batchDelete",
                    method: "POST",
                    dataType: "json",
                    data: postJson,
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Content-Type", "application/json");
                    },
                    success: function (data) {
                        if (data.success == true) {
                            MessageToast.show("刪除成功");
                        } else {
                            MessageToast.show("刪除失敗");
                        }
                    },
                    error: function () {
                    }
                });
            } else {
            }
        },
        onFilterSelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");

            var selectedType = this.getView().byId("comType").getSelectedKey();
            var postBody = {};
            var selectedPeriod;
            if (selectedType == '01') {
                selectedPeriod = this.getView().byId("comYear").getSelectedItem();
                postBody.year = selectedPeriod.getKey().substring(0, 4);
                //By Year
            } else if (selectedType == '02') {
                //By Period
                selectedPeriod = this.getView().byId("comQuarter").getSelectedItem();
                postBody.year = selectedPeriod.getKey().substring(0, 4);
                postBody.quarter = selectedPeriod.getKey().substring(4, 6);
            }

            postBody.type = this.getView().byId("comType").getSelectedKey();;
            var postJson = JSON.stringify(postBody);
            var that = this;

            if (sKey === 'disOrg') {
                //獲取系統中OU狀態為submit（03）的數據
                //根據期間獲取org list STEP 3展示
                var that = this;
                $.ajax({
                    url: "/ou/selectOUBySearchModelByType/OTHER",
                    method: "POST",
                    dataType: "json",
                    data: postJson,
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Content-Type", "application/json");
                    },
                    success: function (data) {
                        if (data.success == true) {
                            var jsn = {};
                            jsn.OrgCollection = data.result;
                            that.getView().setModel(new JSONModel(jsn), "Orglist");
                        } else {
                        }
                    },
                    error: function () {
                    }
                });

            }
        },
        outsideFilterSelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            if (sKey === 'report') {
                //select period first 
                var postBody = {};
                postBody.type = '02';
                var postJson = JSON.stringify(postBody);
                var that = this;
                $.ajax({
                    url: "/ou/selectPeriod/HRADJ",
                    method: "POST",
                    dataType: "json",
                    data: postJson,
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Content-Type", "application/json");
                    },
                    success: function (data) {
                        if (data.success == true) {
                            var arrayRes = [];
                            var list = {};
                            for (var i = 0; i < data.result.length; i++) {
                                var pieceJsn = {};
                                pieceJsn.Id = data.result[i].year + data.result[i].quarter;
                                pieceJsn.Text = data.result[i].year + data.result[i].quarter;
                                arrayRes.push(pieceJsn);
                            }

                            list.list = arrayRes
                            that.getView().setModel(new JSONModel(list), "adjPeriod");
                        } else {
                        }
                    },
                    error: function () {
                    }
                });
                ///////////////

            }
        },
        onRefresh: function () {
            var period = this.byId("adjPeriod").getSelectedKey();
            var that = this;
            var postBody = {};
            postBody.type = "02";
            postBody.year = period.substring(0, 4);
            postBody.quarter = period.substring(4, 6);

            var postJson = JSON.stringify(postBody);
            $.ajax({
                url: "/ou/selectOUBySearchModelByType/HRADJ",
                method: "POST",
                data: postJson,
                dataType: "json",
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        var jsn = {};
                        jsn.OrgCollection = data.result;
                        for (var i = 0; i < jsn.OrgCollection.length; i++) {
                            jsn.OrgCollection[i].idlBudgetProposal = that.custParseInt(jsn.OrgCollection[i].lstIdlAdjust) +
                                that.custParseInt(jsn.OrgCollection[i].idlReqBudget) +
                                that.custParseInt(jsn.OrgCollection[i].idlAdjBudget);
                            jsn.OrgCollection[i].dlBudgetProposal = jsn.OrgCollection[i].lstDlAdjust +
                                that.custParseInt(jsn.OrgCollection[i].dlReqBudget) +
                                that.custParseInt(jsn.OrgCollection[i].idlAdjBudget);
                            jsn.OrgCollection[i].finalProposal = jsn.OrgCollection[i].idlBudgetProposal + jsn.OrgCollection[i].dlBudgetProposal;

                        }
                        that.getView().setModel(new JSONModel(jsn), "adjust");
                        that.byId("adjustTable").setVisible(true);
                    } else {
                    }
                },
                error: function () {
                }
            });

        },
        adjQuarterChange: function (oEvent) {
            var period = oEvent.getParameter("selectedItem").getKey();
            var that = this;
            var postBody = {};
            postBody.type = "02";
            postBody.year = period.substring(0, 4);
            postBody.quarter = period.substring(4, 6);

            var postJson = JSON.stringify(postBody);
            $.ajax({
                url: "/ou/selectOUBySearchModelByType/HRADJ",
                method: "POST",
                data: postJson,
                dataType: "json",
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        var jsn = {};
                        jsn.OrgCollection = data.result;
                        for (var i = 0; i < jsn.OrgCollection.length; i++) {
                            jsn.OrgCollection[i].idlBudgetProposal = that.custParseInt(jsn.OrgCollection[i].lstIdlAdjust) +
                                that.custParseInt(jsn.OrgCollection[i].idlReqBudget) +
                                that.custParseInt(jsn.OrgCollection[i].idlAdjBudget);
                            jsn.OrgCollection[i].dlBudgetProposal = jsn.OrgCollection[i].lstDlAdjust +
                                that.custParseInt(jsn.OrgCollection[i].dlReqBudget) +
                                that.custParseInt(jsn.OrgCollection[i].idlAdjBudget);
                            jsn.OrgCollection[i].finalProposal = jsn.OrgCollection[i].idlBudgetProposal + jsn.OrgCollection[i].dlBudgetProposal;

                        }

                        that.getView().setModel(new JSONModel(jsn), "adjust");
                        that.byId("adjustTable").setVisible(true);
                    } else {
                    }
                },
                error: function () {
                }
            });

        },
        typeChange: function (oEvent) {
            var type = oEvent.getParameter("selectedItem").getKey()
            if (type == '01') {
                this.byId("forYear").setVisible(true);
                this.byId("forQuarter").setVisible(false);
            } else if (type == '02') {
                this.byId("forQuarter").setVisible(true);
                this.byId("forYear").setVisible(false);
            }

            var uploadUrl = "/excel/ou/import" + "/WANGYIQIONG" + "/" + type;
            this.byId("fileUploader").setUploadUrl(uploadUrl);

            var that = this;
            $.ajax({
                url: "/period/getAllPeriodListByType/" + type,
                method: "GET",
                dataType: "json",
                crossDomain: true,
                async: false,
                beforeSend: function (xhr) {
                },

                success: function (data) {
                    var periodlist = {};
                    periodlist.QuarterCollection = data.result;
                    for (var j = 0; j < periodlist.QuarterCollection.length; j++) {
                        if (periodlist.QuarterCollection[j].type == '02') {
                            if (periodlist.QuarterCollection[j].active == 'Y') {
                                periodlist.QuarterCollection[j].active = '開啟';
                            } else {
                                periodlist.QuarterCollection[j].active = '關閉';
                            }
                        }
                    }
                    that.getView().setModel(new JSONModel(periodlist), "combox");

                    var year = [];
                    var jsonList = {};

                    for (var i = 0; i < data.result.length; i++) {
                        jsonList = {};
                        jsonList.year = data.result[i].year;
                        if (data.result[i].active == 'Y') {
                            jsonList.status = '開啟';
                        } else if (data.result[i].active == 'N') {
                            jsonList.status = '關閉';
                        }
                        year.push(jsonList);
                    }

                    var yearlist = {};
                    yearlist.YearCollection = that.uniqueArray(year, "year");
                    that.getView().setModel(new JSONModel(yearlist), "comyear");

                },
                error: function () {
                    MessageToast.show("接口調用失敗");
                }
            });

        },
        uniqueArray: function (array, key) {
            var result = [array[0]];
            for (var i = 1; i < array.length; i++) {
                var item = array[i];
                var repeat = false;
                for (var j = 0; j < result.length; j++) {
                    if (item[key] == result[j][key]) {
                        repeat = true;
                        break;
                    }
                }
                if (!repeat) {
                    result.push(item);
                }
            }
            return result;
        },
        onRetrieve: function () {

        },
        onSubmit: function (oEvent) {
            var dialog = new sap.m.BusyDialog({
                text: "提交中"
            });

            var status = '05'; //完成状态

            var tableData = this.getView().getModel("adjust").getProperty("/OrgCollection");

            var postData = [], postLog = [];
            for (var i = 0; i < tableData.length; i++) {
                if (tableData[i].status == '05') {//已完成不再重复保存
                    continue;
                }
                var pieceJsn = {}, pieceLog = {};
                pieceJsn.dlAdjBudget = tableData[i].dlAdjBudget;
                pieceJsn.dlAllowance = tableData[i].dlAllowance;
                pieceJsn.dlJustification = tableData[i].dlJustification;
                pieceJsn.dlReqBudget = tableData[i].dlReqBudget;
                pieceJsn.empId = tableData[i].empId;
                pieceJsn.idlAdjBudget = tableData[i].idlAdjBudget;
                pieceJsn.idlAllowance = tableData[i].idlAllowance;
                pieceJsn.idlJustification = tableData[i].idlJustification;
                pieceJsn.idlReqBudget = tableData[i].idlReqBudget;
                pieceJsn.lstUpdUsr = "WANGYIQIONG"
                pieceJsn.org = tableData[i].org;
                pieceJsn.quarter = tableData[i].quarter;
                pieceJsn.status = status; //02-Draft,03-Submit
                pieceJsn.type = tableData[i].type;
                pieceJsn.year = tableData[i].year;
                postData.push(pieceJsn);

                pieceLog.year = tableData[i].year;
                pieceLog.quarter = tableData[i].quarter;
                switch (pieceLog.quarter) {
                    case 'Q1':
                        pieceLog.effectiveDte = pieceLog.year + '-' + '01-01';
                        break;
                    case 'Q2':
                        pieceLog.effectiveDte = pieceLog.year + '-' + '04-01';
                        break;
                    case 'Q3':
                        pieceLog.effectiveDte = pieceLog.year + '-' + '07-01';
                        break;
                    case 'Q4':
                        pieceLog.effectiveDte = pieceLog.year + '-' + '10-01';
                        break;
                    default:
                }
                pieceLog.org = tableData[i].org;
                pieceLog.dlAdjust = tableData[i].dlAdjBudget;
                pieceLog.idlAdjust = tableData[i].idlAdjBudget;
                pieceLog.dlAllowance = tableData[i].dlAllowance;
                pieceLog.idlAllowance = tableData[i].idlAllowance;
                pieceLog.finalDL = this.custParseInt(tableData[i].dlReqBudget) + this.custParseInt(tableData[i].dlAdjBudget) + this.custParseInt(pieceLog.dlAllowance);
                pieceLog.finalIDL = this.custParseInt(tableData[i].idlReqBudget) + this.custParseInt(tableData[i].idlAdjBudget) + this.custParseInt(tableData[i].idlAllowance);
                pieceLog.lstUpdUsr = "WANGYIQIONG";
                pieceLog.type = "02";
                postLog.push(pieceLog);

            }
            var postJson = JSON.stringify(postData);
            var postJsonLog = JSON.stringify(postLog);
            if (postData.length > 0) {
                dialog.open();

                $.ajax({
                    url: "/ou/batchSave",
                    method: "POST",
                    dataType: "json",
                    data: postJson,
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Content-Type", "application/json");
                    },
                    success: function (data) {
                        dialog.close();
                        MessageToast.show("保存成功");

                    },
                    error: function () {
                        dialog.close();
                        MessageToast.show("保存失敗");
                    }
                });
            }

            //保存初始记录到log--year quarter type org effective dladjust dljustification idladjust idljustification
            if (postLog.length > 0) {
                $.ajax({
                    url: "/ouadjust/batchSave",
                    method: "POST",
                    dataType: "json",
                    data: postJsonLog,
                    async: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Content-Type", "application/json");
                    },
                    success: function (data) {
                    },
                    error: function () {
                    }
                });
            }


        },
        custParseInt: function (num) {
            if (num == null || num == '') {
                return 0;
            } else {
                return parseInt(num);
            }
        }

    });
}, true);
