jQuery.sap.require("com.broadspectrum.etime.ee.utils.Conversions");
sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.Master", {

	onInit: function() {
		this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
			pattern: "yyyy-MM-dd"
		});

		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
		this.oRoutingParams = {};

		var oEventBus = this.getEventBus();
		oEventBus.subscribe("Master2", "NotFound", this.onNotFound, this);
		oEventBus.subscribe('HeaderSelection', 'headDateEvt', this.onDateSelected, this);
		oEventBus.subscribe('Any', 'BusyDialogNeeded', this.onBusyDialogNeeded, this);
		oEventBus.subscribe('Any', 'BusyDialogDone', this.onBusyDialogDone, this);
		// oEventBus.subscribe("Detail", "Changed", this.bindView(this.keyForView), this);
		oEventBus.subscribe("Detail", "Changed", this.onDetailChanged, this);
	},

	onRouteMatched: function(oEvent) {
		var oParameters = oEvent.getParameters();
		if (oParameters.name === "home") {
			// nothing to do here
		}
	},

	onRoutePatternMatched: function(oEvent) {
		var oParameters = oEvent.getParameters();
		if (oParameters.name === "home") {
			if (!sap.ui.Device.system.phone) {
				// load the welcome page on non-phone devices (splitapp behaves like a
				// single nav controller on phones, so the master list has to be shown first)
				// note that this has to happen on the RoutePatternMatched event as this
				// only traps a route actually being matched. 
				// intermediate RouteMatched events (such as "home" being loaded as a parent
				// route of "detail", are not trapped by this event)
				this.getRouter().navTo("welcome");
			}
		}
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
		this.getRouter().navTo("notfound", {}, true); // don't create a history entry
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
        // if (!this.didAttachToFilterListDataReceived) {
        //     this.didAttachToFilterListDataReceived = true;
        //     oBinding.attachDataReceived($.proxy(function(oEvent) {
        //         var oData = oEvent.getParameter("data");
        //         if (oData && oData.results && oData.results.length) {
        //             var oOverview = oData.results[0];
        //             if (oOverview && oOverview.Weekstart && oOverview.Weekend) {
        //                 if (!this.oLastWeekstart || !this.oLastWeekend) {
        //                     this.oLastWeekstart = new Date();
        //                     this.oLastWeekend = new Date();
        //                 }
        //                 if (this.oLastWeekstart.getTime() !== oOverview.Weekstart.getTime() ||
        //                     this.oLastWeekend.getTime() !== oOverview.Weekend.getTime()) {
        //                     this.oLastWeekstart = oOverview.Weekstart;
        //                     this.oLastWeekend = oOverview.Weekend;
        //     				this.getEventBus().publish('Master', 'WorkingWeekReceived', {
        //     				    oWeekstart: this.oLastWeekstart,
        //     				    oWeekend: this.oLastWeekend
        //     				});
        //                 }
        //             }
        //         }
        //     }, this));
        // }
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
        else{
        //This needs to publish the WorkingWeekReceived event with the start and end dates.  Currently it only gets sent
        //if there is already time in that week
        //   var lView = this.getView();
        //   var lList = lView.byId("master1List");
        //   var lWstart = lList.getProperty("Weekstart");
        //   var lWend = lList.getProperty("Weekend");          
        //   var lWstart = this.getView().byId("master1List").getProperty("Weekstart");
        //   var lWend = this.getView().byId("master1List").getProperty("Weekstart");
        }
		if (!oFilter && this.oLastListFilter) {
			oFilter = this.oLastListFilter;
		}
		if (oBinding && oFilter) {
			oBinding.filter(oFilter);
			this.oLastListFilter = oFilter;
		}
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
		this.getRouter().navTo("timesheets", {
			OverviewEntity: oItem.getBindingContext().getPath().substr(1) // no slash in router param
		});
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