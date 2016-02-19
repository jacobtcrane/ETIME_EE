/*global com*/

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
		oEventBus.subscribe("HeaderSelection", "headDateEvt", this.onDateSelected, this);
		oEventBus.subscribe("Any", "BusyDialogNeeded", this.onBusyDialogNeeded, this);
		oEventBus.subscribe("Any", "BusyDialogDone", this.onBusyDialogDone, this);
		oEventBus.subscribe("Detail", "Changed", this.onDetailChanged, this);
		oEventBus.subscribe("Detail", "EditingContextChanged", this.onEditingContextChanged, this);
		oEventBus.subscribe("Detail", "EditingDone", this.onDetailEditingDone, this);
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
				this.getRouter().navTo("welcome");
			}
		}
	},

	onDateSelected: function(sChannel, sEvent, oData) {
		var oModel = this.getModel();
		if (!oModel.getServiceMetadata()) {
			oModel.attachEventOnce("metadataLoaded", function() {
				this.filterList(this.getFilterForDate(oData));
			}, this);
		} else {
			this.filterList(this.getFilterForDate(oData));
		}
	},

	onDetailChanged: function(sChannel, sEvent, oData) {
		var oModel = this.getModel();
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

	getFilterForDate: function(oDate) {
		var oStartDate = oDate instanceof Date ? oDate : new Date(oDate);
		if (!oStartDate || !(oStartDate instanceof Date)) {
			return null;
		}
		// convert to non-UTC date-only string and then instantiate a UTC date,
		// so the internal filter formatting does not convert our (locale-specific)
		// date to UTC and potentially change the date (e.g. 2016-02-01T00:00:00 UTC+11 may become 2016-01-31T13:00:00)
		var sStartDate = com.broadspectrum.etime.ee.utils.Conversions.dateFormatterISODateOnly.format(oStartDate);
		oStartDate = com.broadspectrum.etime.ee.utils.Conversions.dateFormatterUTC.parse(sStartDate);
		var aFilters = [];
		aFilters.push(new sap.ui.model.Filter("Weekstart", sap.ui.model.FilterOperator.LE, oStartDate));
		aFilters.push(new sap.ui.model.Filter("Weekend", sap.ui.model.FilterOperator.GE, oStartDate));
		return new sap.ui.model.Filter({
			filters: aFilters,
			and: true
		});
	},

	filterList: function(oFilter) {
		var oBinding = this.getView().byId("master1List").getBinding("items");
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
		this.checkPendingChangesBeforeNav($.proxy(function() {
			this.getRouter().navTo("timesheets", {
				OverviewEntity: oItem.getBindingContext().getPath().substr(1) // no slash in router param
			});
		}, this));
	},

	hasPendingChanges: function() {
		var oModel = this.getModel();
		if (oModel.hasPendingChanges() ||
			(this.sEditingContextPath && oModel.mChangeHandles[this.sEditingContextPath.substr(1)])) {
			return true;
		} else {
			return false;
		}
	},

	checkPendingChangesBeforeNav: function(fnNav) {
		var oModel = this.getModel();
		if (this.hasPendingChanges()) {
			this.getEventBus().publish("Any", "BusyDialogDone", null);
			sap.m.MessageBox.show("Exit without saving changes?", {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: "Unsaved Changes",
				actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.OK],
				onClose: $.proxy(function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK && fnNav) {
						oModel.resetChanges();
						this.cleanupModelChangeHandles();
						fnNav();
					}
				}, this)
			});
		} else if (fnNav) {
			fnNav();
		}
	},

	cleanupModelChangeHandles: function() {
		var oModel = this.getModel();
		if (this.sEditingContextPath && oModel.mChangeHandles[this.sEditingContextPath.substr(1)]) {
			//ODataModel has a bug in resetChanges() which results in mChangeHandles not getting cleaned up for created entities
			delete oModel.mChangeHandles[this.sEditingContextPath.substr(1)];
		}
	},

	onEditingContextChanged: function(sChannel, sEvent, oData) {
		this.sEditingContextPath = oData.sEditingContextPath || null;
	},

	onDetailEditingDone: function(sChannel, sEvent, oData) {
		this.sEditingContextPath = null;
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	getModel: function() {
		return sap.ui.getCore().getModel();
	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},

	onExit: function(oEvent) {
		this.getEventBus().unsubscribe("Master2", "NotFound", this.onNotFound, this);
	},

	onAfterRendering: function() {}
});