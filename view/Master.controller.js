sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.Master", {

	onInit: function() {
		this.oInitialLoadFinishedDeferred = jQuery.Deferred();
		this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
			pattern: "yyyy-MM-dd"
		});

		var oEventBus = this.getEventBus();
		// this.getView().byId("master1List").attachEventOnce("updateFinished", function() {
		// 	this.oInitialLoadFinishedDeferred.resolve();
		// 	oEventBus.publish("Master", "InitialLoadFinished", { oListItem : this.getView().byId("master1List").getItems()[0] });
		//  		this.getRouter().detachRoutePatternMatched(this.onRouteMatched, this);
		// }, this);

		// 		//On phone devices, there is nothing to select from the list. There is no need to attach events.
		// 		if (sap.ui.Device.system.phone) {
		// 			return;
		// 		}

		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);

		oEventBus.subscribe("Master2", "NotFound", this.onNotFound, this);
		oEventBus.subscribe('HeaderSelection', 'headDateEvt', this.onDateSelected, this);
		oEventBus.subscribe('Any', 'BusyDialogNeeded', this.onBusyDialogNeeded, this);
		oEventBus.subscribe('Any', 'BusyDialogDone', this.onBusyDialogDone, this);
		// oEventBus.subscribe("Detail", "Changed", this.bindView(this.keyForView), this);
		oEventBus.subscribe("Detail", "Changed", this.onDetailChanged, this);
	},

	onDateSelected: function(sChannel, sEvent, oData) {
		// var startDate = new Date(oData);
		// var startDateStr = this.oFormatYyyymmdd.format(startDate);
		// var sEntityPath = '/overviewSet?$filter=Weekstart le datetime\'' + startDateStr + 'T22:00:00\' and Weekend ge datetime\'' + startDateStr +
		// 	'T22:00:00\'';
		// // 			var sEntityPath = '/headerSet(Weekstart=datetime\'' + startDateStr + 'T22:00:00\',Weekend=datetime\'' + startDateStr + 'T22:00:00\')?$expand=overviewSet';
		// if (sEntityPath != null) {
		// 	this.bindView(sEntityPath);
		// }
		// we can't filter on dates if metadata is not loaded yet
		var oModel = sap.ui.getCore().getModel();
		if (!oModel.getServiceMetadata()) {
			oModel.attachEventOnce("metadataLoaded", function() {
				this.filterList(this.getFilterForDate(oData));
			}, this);
		} else {
			this.filterList(this.getFilterForDate(oData));
		}
	},

	onDetailChanged: function(sChannel, sEvent, oData) {
		var oModel = sap.ui.getCore().getModel();
		if (oData && oData.sEntityPath) {
			var property = oModel.getProperty(oData.sEntityPath);
			if (property && property.Begda) {
				this.filterList(this.getFilterForDate(property.Begda));
			}
		}
	},

	onBusyDialogNeeded: function() {
		"use strict";
		// show busy dialog
		this.getView().byId("theBusyDialog").open();
	},

	onBusyDialogDone: function() {
		"use strict";
		// close busy dialog
		this.getView().byId("theBusyDialog").close();
	},

	showEmptyView: function() {
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.broadspectrum.etime.ee.view.NotFound",
			targetViewType: "XML"
		});
	},

	fireDetailChanged: function(sEntityPath) {
		this.getEventBus().publish("Master", "Changed", {
			sEntityPath: sEntityPath
		});
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("Master", "NotFound", {});
	},

	// bindView: function(sEntityPath) {
	// 	if (sEntityPath != null) {
	// 		var oView = this.getView();
	// 		var list = this.getView().byId("master1List");

	// 		var template = new sap.m.ObjectListItem({
	// 			// id : "master1ListItem",
	// 			type: "{device>/listItemType}",
	// 			press: "onSelect",
	// 			title: "{Datetxt}",
	// 			attributes: [new sap.m.ObjectAttribute({
	// 					text: "{Hourstxt}"
	// 				}),
	// 				new sap.m.ObjectAttribute({
	// 					text: "{Statustxt}"
	// 				})
	// 			]

	// 		});

	// 		list.bindItems(sEntityPath, template, null, null);
	// 		this.keyForView = sEntityPath;
	// 	}
	// },

	getFilterForDate: function(oDate) {
		var startDate = new Date(oDate);
		if (!startDate) {
			return null;
		}
		// var startDateStr = this.oFormatYyyymmdd.format(startDate)  + "T22:00:00";
		var aFilters = [];
		// aFilters.push(new sap.ui.model.Filter("Weekstart", sap.ui.model.FilterOperator.LE, "datetime'" + startDateStr + "'"));
		// aFilters.push(new sap.ui.model.Filter("Weekend",   sap.ui.model.FilterOperator.GE, "datetime'" + startDateStr + "'"));
		aFilters.push(new sap.ui.model.Filter("Weekstart", sap.ui.model.FilterOperator.LE, startDate));
		aFilters.push(new sap.ui.model.Filter("Weekend", sap.ui.model.FilterOperator.GE, startDate));
		return new sap.ui.model.Filter({
			filters: aFilters,
			and: true
		});
	},

	filterList: function(oFilter) {
		var oBinding = this.getView().byId("master1List").getBinding("items");
        // publish working week dates upon data received
        if (!this.didAttachToFilterListDataReceived) {
            this.didAttachToFilterListDataReceived = true;
            oBinding.attachDataReceived($.proxy(function(oEvent) {
                var oData = oEvent.getParameter("data");
                if (oData && oData.results && oData.results.length) {
                    var oOverview = oData.results[0];
                    if (oOverview && oOverview.Weekstart && oOverview.Weekend) {
                        if (!this.oLastWeekstart || !this.oLastWeekend) {
                            this.oLastWeekstart = new Date();
                            this.oLastWeekend = new Date();
                        }
                        if (this.oLastWeekstart.getTime() !== oOverview.Weekstart.getTime() ||
                            this.oLastWeekend.getTime() !== oOverview.Weekend.getTime()) {
                            this.oLastWeekstart = oOverview.Weekstart;
                            this.oLastWeekend = oOverview.Weekend;
            				this.getEventBus().publish('Master', 'WorkingWeekReceived', {
            				    oWeekstart: this.oLastWeekstart,
            				    oWeekend: this.oLastWeekend
            				});
                        }
                    }
                }
            }, this));
        }
		if (!oFilter && this.oLastListFilter) {
			oFilter = this.oLastListFilter;
		}
		if (oBinding && oFilter) {
			oBinding.filter(oFilter);
			this.oLastListFilter = oFilter;
		}
	},

	onRouteMatched: function(oEvent) {
		var sName = oEvent.getParameter("name");

		if (sName !== "main") {
			return;
		}

		//Load the welcome view on desktop; the master page on phone
		if (sap.ui.Device.system.phone) {
			this.getRouter().myNavToWithoutHash({
				currentView: this.getView(),
				targetViewName: "com.broadspectrum.etime.ee.view.Master",
				targetViewType: "XML",
				isMaster: true
			});
		} else {
			this.getRouter().myNavToWithoutHash({
				currentView: this.getView(),
				targetViewName: "com.broadspectrum.etime.ee.view.Welcome",
				targetViewType: "XML",
				isMaster: false
			});
		}
		var oSplitApp = this.getRouter()._findSplitApp(this.getView());
		if (oSplitApp && !oSplitApp.isMasterShown()) {
			oSplitApp.showMaster();
		}
	},

	waitForInitialListLoading: function(fnToExecute) {
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(fnToExecute, this));
	},

	onNotFound: function() {
		this.getView().byId("master1List").removeSelections();
	},

	onSearch: function(oEvent) {
		var filters = [];
		if (oEvent.getParameters().query) {
			filters = [new sap.ui.model.Filter("Statustxt", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().query)];
		}
		this.getView().byId("master1List").getBinding("items").filter(filters);
	},

	onSelect: function(oEvent) {
		// Get the list item either from the listItem parameter or from the event's
		// source itself (will depend on the device-dependent mode)
		var oList = this.getView().byId("master1List");
		this.showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		oList.removeSelections();
	},

	showDetail: function(oItem) {
		//Load the master2 view
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.broadspectrum.etime.ee.view.Master2",
			targetViewType: "XML",
			isMaster: true
		});

		// If we're on a phone device, include nav in history
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("master2", {
			from: "main",
			entity: oItem.getBindingContext().getPath().substr(1)
		}, bReplace);
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},

	onExit: function(oEvent) {
		this.getEventBus().unsubscribe("Master2", "NotFound", this.onNotFound, this);
	},

	onAfterRendering: function() {
		// this.bindView('');
	}
});