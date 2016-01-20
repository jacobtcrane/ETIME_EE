sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.Master2", {

	onInit: function() {
		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		this.oRoutingParams = {};
	},

	onRouteMatched: function(oEvent) {
		var oParameters = oEvent.getParameters();

		if (oParameters.name === "timesheets") {
            // extract routing parameters
    		if (oParameters.arguments.OverviewEntity) {
    			this.oRoutingParams.OverviewEntity = oParameters.arguments.OverviewEntity;
    		} else {
    			this.getRouter().navTo("notfound", {}, true); // don't create a history entry
    			return;
    		}
			this.bindView("/" + this.oRoutingParams.OverviewEntity);

// 			var oEventBus = this.getEventBus();
			this.byId("master2List").attachEventOnce("updateFinished", function() {
				this.selectFirstItem();
				// oEventBus.publish("Master2", "LoadFinished", {
				// 	oListItem: this.getView().byId("master2List").getItems()[0]
				// });
			}, this);
		}
	},

	bindView: function(sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath);

		//Check if the data is already on the client
		if (!oView.getModel().getData(sEntityPath)) {

			// Check that the entity specified was found
			oView.getElementBinding().attachEventOnce("dataReceived", function() {
				var oData = oView.getModel().getData(sEntityPath);
				if (!oData) {
					this.showEmptyView();
					this.fireDetailNotFound();
				}
			}, this);
		}
	},

	selectFirstItem: function() {
		var oList = this.getView().byId("master2List");
		var aItems = oList.getItems();
		if (aItems.length === 1) {
			// if only one item in the list, go ahead and select it
			oList.setSelectedItem(aItems[0], true);
			this.showDetail(aItems[0]);
		}
	},

	showEmptyView: function() {
		this.getRouter().navTo("notfound", {}, true); // don't create a history entry
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("Master2", "NotFound");
	},

    formatMaster2ListItem: function(valueAttendance, valueAllowance, isAllowance) {
        if (isAllowance) {
            return valueAllowance;
        } else {
            return valueAttendance;
        }
    },
    
	onNavBack: function() {
		this.navHistoryBack();
	},

	navHistoryBack: function() {
		window.history.go(-1);
	},

	onSearch: function(oEvent) {
		var filters = [];
		if (oEvent.getParameters().query) {
			filters = [new sap.ui.model.Filter("Statustxt", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().query)];
		}
		this.getView().byId("master2List").getBinding("items").filter(filters);
	},

	onSelect: function(oEvent) {
		// Get the list item either from the listItem parameter or from the event's
		// source itself (will depend on the device-dependent mode)
// 		var oList = this.getView().byId("master2List");
		this.showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
	},

	showDetail: function(oItem) {
		var a = this.getView().getModel().getProperty(oItem.getBindingContext().getPath());
		this.getEventBus().publish("Any", "BusyDialogNeeded", null);
		// the busy dialog animation does not start until the routing (and associated page loading)
		// completes, so we throw this onto the call stack for deferred execution
		setTimeout($.proxy(function() {
			this.getRouter().navTo(a.isAllowance ? "allowance" : "attendance", {
				OverviewEntity: this.oRoutingParams.OverviewEntity,
				DetailEntity: oItem.getBindingContext().getPath().substr(1) // no slash in route parameter
			});
			this.getEventBus().publish("Any", "BusyDialogDone", null);
		}, this), 0);

		// remove list selections, else we can't perform detail nav next time
		this.byId("master2List").removeSelections();
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	}

});