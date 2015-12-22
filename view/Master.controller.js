sap.ui.core.mvc.Controller.extend("com.transfieldservices.view.Master", {

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

		//On phone devices, there is nothing to select from the list. There is no need to attach events.
		if (sap.ui.Device.system.phone) {
			return;
		}

		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);

		oEventBus.subscribe("Master2", "NotFound", this.onNotFound, this);
		oEventBus.subscribe('HeaderSelection', 'headDateEvt', this.onDateSelected, this);
		oEventBus.subscribe("Detail", "Changed", this.bindView(this.keyForView), this);
	},

	onDateSelected: function(sChannel, sEvent, oData) {
		var startDate = new Date(oData);
		var startDateStr = this.oFormatYyyymmdd.format(startDate);
		var sEntityPath = '/overviewSet?$filter=Weekstart le datetime\'' + startDateStr + 'T22:00:00\' and Weekend ge datetime\'' + startDateStr +
			'T22:00:00\'';
		// 			var sEntityPath = '/headerSet(Weekstart=datetime\'' + startDateStr + 'T22:00:00\',Weekend=datetime\'' + startDateStr + 'T22:00:00\')?$expand=overviewSet';
		if (sEntityPath != null) {
			this.bindView(sEntityPath);
		}
	},

	showEmptyView: function() {
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.transfieldservices.view.NotFound",
			targetViewType: "XML"
		});
	},

	fireDetailChanged: function(sEntityPath) {
		this.getEventBus().publish("Master", "Changed", {
			sEntityPath: sEntityPath
		});
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("Master", "NotFound");
	},

	bindView: function(sEntityPath) {
		if (sEntityPath != null) {
			var oView = this.getView();
			var list = this.getView().byId("master1List");

			var template = new sap.m.ObjectListItem({
				// id : "master1ListItem",
				type: "{device>/listItemType}",
				press: "onSelect",
				title: "{Datetxt}",
				attributes: [new sap.m.ObjectAttribute({
						text: "{Hourstxt}"
					}),
					new sap.m.ObjectAttribute({
						text: "{Statustxt}"
					})
				]

			});

			list.bindItems(sEntityPath, template, null, null);
			this.keyForView = sEntityPath;
		}
	},

	onRouteMatched: function(oEvent) {
		var sName = oEvent.getParameter("name");

		if (sName !== "main") {
			return;
		}

		//Load the master2 view in desktop
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.transfieldservices.view.Master2",
			targetViewType: "XML"
		});

		//Load the welcome view in desktop
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.transfieldservices.view.Welcome",
			targetViewType: "XML"
		});
	},

	waitForInitialListLoading: function(fnToExecute) {
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(fnToExecute, this));
	},

	onNotFound: function() {
		this.getView().byId("master1List").removeSelections();
	},

	onSearch: function(oEvent) {
		// // Add search filter
		// 			// add filter for search
		// 	var aFilters = [];
		var sQuery = oEvent.getSource().getValue();
		if (sQuery && sQuery.length > 2) {
			// 		var filter = new sap.ui.model.Filter("Statustxt", sap.ui.model.FilterOperator.Contains, sQuery);
			// 		aFilters.push(filter);
			// 	}

			// update list binding
			var list = this.getView().byId("master1List");
			// var binding = list.getBinding("items");
			var filt = this.keyForView + ' and ' + 'substringof(\'' + sQuery + '\',Statustxt)';
			var template = new sap.m.ObjectListItem({
				// id : "master1ListItem",
				type: "{device>/listItemType}",
				press: "onSelect",
				title: "{Datetxt}",
				attributes: [new sap.m.ObjectAttribute({
						text: "{Hourstxt}"
					}),
					new sap.m.ObjectAttribute({
						text: "{Statustxt}"
					})
				]

			});

			list.bindItems(filt, template, null, null);
		}
	},

	onSelect: function(oEvent) {
		// Get the list item either from the listItem parameter or from the event's
		// source itself (will depend on the device-dependent mode)
		var oList = this.getView().byId("master1List");
		this.showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		oList.removeSelections();
	},

	showDetail: function(oItem) {
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