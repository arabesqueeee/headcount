sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "sap/m/MessageToast"

], function (JSONModel, Controller, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.tsmc.headcount.controller.Detail", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oModel = this.getOwnerComponent().getModel();
            //change local or cloud
           // this.local = false;
            //this.cloud = true;
       
            this.local = true;
            this.cloud = false;
       

            if (this.local) {
                this.url = "http://127.0.0.1:10019";
            } else {
                this.url = "";
            }
            this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
        },
        handleFullScreen: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.oRouter.navTo("detail", { layout: sNextLayout, product: this._product });
        },
        handleExitFullScreen: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
            this.oRouter.navTo("detail", { layout: sNextLayout, product: this._product });
        },
        handleClose: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
            this.oRouter.navTo("master", { layout: sNextLayout });
        },
        _onProductMatched: function (oEvent) {
            this._product = oEvent.getParameter("arguments").product || this._product || '0';
            var str = this._product.split('#'); //year + quarter + org
            var postBody = {};
            var header = {};

            var jsn = {};
            jsn.OrgCollection = [];
            this.getView().setModel(new JSONModel(jsn), "detail");
           
            if (str.length > 0) {
                header.period = str[0] + str[1];
                header.org = str[2];
                header.orgName = window.decodeURIComponent(str[3]);
                this.getView().setModel(new JSONModel(header), "header");

                postBody.year = str[0];
                postBody.quarter = str[1];
                postBody.org = str[2];
                postBody.type = '02';

                var that = this;
                var postJson = JSON.stringify(postBody);
              
                    $.ajax({
                        url: this.url + "/ouadjust/selectOuAdjust",
                        method: "POST",
                        dataType: "json",
                        data: postJson,
                        async: false,
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("Content-Type", "application/json");
                        },
                        success: function (data) {
                            if (data.success == true) {
                              
                               that.getView().getModel("detail").setProperty("/OrgCollection",data.result);
                               that.getView().getModel("detail").refresh();
                               that.byId("adjustlog").setVisibleRowCount(data.result.length);
    
                            } else {
                                //MessageToast.show("系統錯誤");
                                MessageToast.show(data.message);
                            }
                        },
                        error: function () {
                        }
                    });
    
                            
            }
        },
        onNew: function (oEvent) {
            var model = this.getView().getModel("detail");
            var currentRows = model.getProperty("/OrgCollection"); 
            //如果初识 默认开始时间为季度的第一天
            var entry = this.createEntry();
            if(model.getData().OrgCollection.length == 0){
                var header = this.getView().getModel("header").getData(); 
                var year = header.period.substring(0, 4);
                var quarter = header.period.substring(4, 6);
                entry.effectiveDte = this.getEffectiveDte(year,quarter);
            }
            var newRows = currentRows.concat(entry);
            model.setProperty("/OrgCollection", newRows);
        },
        getEffectiveDte:function(year ,quarter){
            var result;
            switch (quarter) {
                case 'Q1':
                    result = year + '-' + '01-01';
                    break;
                case 'Q2':
                    result = year + '-' + '04-01';
                    break;
                case 'Q3':
                    result = year + '-' + '07-01';
                    break;
                case 'Q4':
                    result = year + '-' + '10-01';
                    break;
                default:
            }
            return result;
        },
        createEntry: function () {
            return {
                dlAdjust: '',
                dlJustification: '',
                effectiveDte: '',
                finalDL: '',
                finalIDL: '',
                idlAdjust: '',
                idlJustification: '',
                type: '',
                quarter: '',
                year: '',
                lstUpdUsr: '',
                org: ''
            };
        },
        onSaveNewItem: function (oEvent) {
            var path = oEvent.getSource().getBindingContext("detail").getPath();
            var obj = oEvent.getSource().getBindingContext("detail").getObject();
            var header = this.getView().getModel("header").getData();
            obj.type = '02';
            obj.year = header.period.substring(0, 4);
            obj.quarter = header.period.substring(4, 6);
            obj.org = header.org;
            // obj.lstUpdUsr = 'WYQ';//need to replace in CF、
            obj.lstUpdUsr = sap.ui.getCore().userid;
            var oModel = this.getView().getModel("detail");
            oModel.setProperty(path, obj);
            // save to DB
            var postJson = JSON.stringify(obj);
            var that = this;
            $.ajax({
                url: this.url + "/ouadjust/createOuAdjustByPrimary",
                method: "POST",
                dataType: "json",
                data: postJson,
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    if (data.success == true) {
                        MessageToast.show("保存成功");
                        
                        that.getView().getModel("detail").setProperty("/OrgCollection",data.result);
                        that.getView().getModel("detail").refresh();
                        that.byId("adjustlog").setVisibleRowCount(data.result.length);


                    } else {
                        //  MessageToast.show("系統錯誤");
                        MessageToast.show(data.message);
                    }
                },
                error: function () {
                }
            });
            var returnMess = this.getView().getModel("return").getData();
            if (returnMess !== null) {
                obj.finalDL = returnMess.finalDL;
                obj.finalIDL = returnMess.finalIDL;
                this.getView().getModel("detail").setProperty(path, obj);
                this.getView().getModel("detail").refresh();

            }

        },
        
        onRefresh: function () {
            var postBody = {};
            var header = this.getView().getModel("header").getData();
            postBody.type = '02';
            postBody.year = header.period.substring(0, 4);
            postBody.quarter = header.period.substring(4, 6);
            postBody.org = header.org;
            var that = this;
            var postJson = JSON.stringify(postBody);
            $.ajax({
                url: this.url + "/ouadjust/selectOuAdjust",
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
                        that.getView().setModel(new JSONModel(jsn), "detail");
                        that.byId("adjustlog").setVisibleRowCount(data.result.length);

                    } else {
                        //MessageToast.show("系統錯誤");
                        MessageToast.show(data.message);
                    }
                },
                error: function () {
                }
            });
        }
    });
}, true);

