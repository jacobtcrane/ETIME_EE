jQuery.sap.require("com.transfieldservices.utils.Conversions");
jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.core.mvc.Controller.extend("com.transfieldservices.view.Detail", {

	onInit: function() {
		this.oInitialLoadFinishedDeferred = jQuery.Deferred();

		if (sap.ui.Device.system.phone) {
			//Do not wait for the master2 when in mobile phone resolution
			this.oInitialLoadFinishedDeferred.resolve();
		} else {
			var oEventBus = this.getEventBus();
			oEventBus.subscribe("Master2", "LoadFinished", this.onMasterLoaded, this);
		}

		if (this.getRouter() != null) {
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		}

		// 		this.getView().byId("enduz").bindElement("{Enduz}");
		// 		this.getView().byId("beguz").bindElement("{Beguz}");

	},

	onMasterLoaded: function(sChannel, sEvent, oData) {
		if (oData.oListItem) {
			this.bindView(oData.oListItem.getBindingContext().getPath());
			this.oInitialLoadFinishedDeferred.resolve();
		}
	},

	onRouteMatched: function(oEvent) {
		var oParameters = oEvent.getParameters();
		// 		var from = oParameters.name;
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function() {

			// When navigating in the Detail page, update the binding context 
			if (oParameters.name === "detail") {
				var sEntityPath = "/" + oParameters.arguments.entity;
				this.bindView(sEntityPath);

				if (this.CreatedEntityContext) {
					this.oModel.deleteCreatedEntry(this.CreatedEntityContext);
				}
			} else {
				return;
			}
		}, this));
		//remove any existing view bindings
		this.getView().unbindElement();

		if (oParameters.name === "newdetail") {
			//remove any existing view bindings
			this.getView().unbindElement();
			//create new record
			var oSelectedDate = new Date(oParameters.arguments.entity);
			var oNewRequest = {
			    Pernr: "00000000",
				Seqnr: "0",
				Atttxt: oParameters.arguments.entity,
				Begda: oSelectedDate,
				Weekstart: oSelectedDate,
				Weekend: oSelectedDate,
				Statustxt: "New",
				Status: "INP"
			};
			this.oModel = this.getView().getModel("theOdataModel");
			this.oCreatedEntityContext = this.oModel.createEntry("detailSet", oNewRequest);
			this.oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			var oView = this.getView();
			oView.setBindingContext(this.oCreatedEntityContext);
		}
	},

	bindView: function(sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath);

		//Check if the data is already on the client
		if (!oView.getModel().getData(sEntityPath)) {

			// Check that the entity specified was found
			var oData = oView.getModel().getData(sEntityPath);
			if (!oData) {
				this.showEmptyView();
				this.fireDetailNotFound();
			} else {
				this.fireDetailChanged(sEntityPath);
			}

		} else {
			this.fireDetailChanged(sEntityPath);
		}

	},

	displayTimeDif: function(begda, endda) {
		if (endda != null && begda != null) {
			begda.setFullYear(1970);
			begda.setMonth(0);
			begda.setDate(1);
			endda.setFullYear(1970);
			endda.setMonth(0);
			endda.setDate(1);
			var formatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.getView().byId("beguz").getDisplayFormat()
			});
			if (endda > begda) {
				this.getTimeDiff(endda, begda);
			} else if (endda < begda) {
				var date = endda;
				var day = endda.getDate() + 1;
				date.setDate(day);
				this.getTimeDiff(date, begda);
			}
			formatter.format(begda);
			this.getView().byId("objectHeader").setTitle(formatter.format(begda) + ' - ' + formatter.format(endda));
		} else {
			this.getView().byId("objectHeader").setNumber('');
		}
	},

	onBeguzEntered: function(oEvent) {
		// 		var oBeguz = oEvent.getParameters().value;
		// 		var oEnduz = this.getView().byId("enduz").getValue();
		var oBegda = oEvent.getParameters().dateValue;
		var oEndda = this.getView().byId("enduz").getDateValue();
		this.displayTimeDif(oBegda, oEndda);
	},

	onEnduzEntered: function(oEvent) {
		var oEnduz = oEvent.getParameters().dateValue;
		var oBeguz = this.getView().byId("beguz").getDateValue();
		this.displayTimeDif(oBeguz, oEnduz);

		// 		oEnduz.setFullYear(1970);
		// 		oEnduz.setMonth(0);
		// 		oEnduz.setDate(1);
		// 		if (oBeguz != null && oEnduz > oBeguz) {
		// 			this.getTimeDiff(oEnduz, oBeguz);
		// 			this.getView().byId("objectHeader").setTitle(this.getView().byId("beguz").getValue() + '-' + this.getView().byId("enduz").getValue());
		// 		} else {
		// 			this.getView().byId("objectHeader").setNumber('');
		// 		}
	},

	getTimeDiff: function(oEnduz, oBeguz) {
		var oTimeDiff = this.getView().byId("objectHeader");
		var diffTime = oEnduz.getTime() - oBeguz.getTime();
		var minutes = ((diffTime / 1000) / 60) % 60;
		var hours = (((diffTime / 1000) / 60) / 60) % 60;
		var strTime = hours + ':' + minutes + ' Hours';
		oTimeDiff.setNumber(strTime);
	},

	timeFormatter: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "PThh'H'mm'M'ss'S'"
	}),

	dateFormatter: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "yyyy-MM-ddThh:mm:ss"
	}),

	showEmptyView: function() {
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.transfieldservices.view.NotFound",
			targetViewType: "XML"
		});
	},

	fireDetailChanged: function(sEntityPath) {
		this.getEventBus().publish("Detail", "Changed", {
			sEntityPath: sEntityPath
		});
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("Detail", "NotFound");
	},

	onNavBack: function() {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("main");
	},

	onDetailSelect: function(oEvent) {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("detail", {
			entity: oEvent.getSource().getBindingContext().getPath().slice(1)
		}, true);
	},

	handleSuggestionSel: function(oEvent) {
		this.handleValueHelp(oEvent);
	},

	handleLiveSearch: function(oEvent) {
		var sInputValue = oEvent.getSource().getValue();
		if (sInputValue.length > 2) {
			this.handleValueHelp(oEvent);
		}
	},

	handleValueHelp: function(oEvent) {
		var sInputValue = oEvent.getSource().getValue();
		var source = oEvent.getSource().getId();
		var filter;
		this.inputId = oEvent.getSource().getId();
		// create value help dialog
		if (source.search("attendanceInput") > -1) {
			if (!this._valueHelpAttDialog) {
				this._valueHelpAttDialog = sap.ui.xmlfragment("com.transfieldservices.dialogs.AttDialog", this);
				filter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this._valueHelpAttDialog);
				this._valueHelpAttDialog.getBinding("items").filter([filter]);
			}
			this._valueHelpAttDialog.open(sInputValue);
		} else if (source.search("wbsInput") > -1) {
			if (!this._valueHelpWBSDialog) {
				this._valueHelpWBSDialog = sap.ui.xmlfragment("com.transfieldservices.dialogs.WBSDialog", this);
				filter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this._valueHelpWBSDialog);
				this._valueHelpWBSDialog.getBinding("items").filter([filter]);
			}
			this._valueHelpWBSDialog.open(sInputValue);
		} else if (source.search("netInput") > -1) {
			if (!this._valueHelpNetDialog) {
				this._valueHelpNetDialog = sap.ui.xmlfragment("com.transfieldservices.dialogs.NetworkDialog", this);
				filter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this._valueHelpNetDialog);
				this._valueHelpNetDialog.getBinding("items").filter([filter]);
			}
			this._valueHelpNetDialog.open(sInputValue);
		} else if (source.search("orderInput") > -1) {
			if (!this._valueHelpOrderDialog) {
				this._valueHelpOrderDialog = sap.ui.xmlfragment("com.transfieldservices.dialogs.OrderDialog", this);
				filter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this._valueHelpOrderDialog);
				this._valueHelpOrderDialog.getBinding("items").filter([filter]);
			}
			this._valueHelpOrderDialog.open(sInputValue);
		}
		// // create a filter for the binding
		// this._valueHelpDialog.getBinding("items").filter([filter]);
		// // open value help dialog filtered by the input value
		// this._valueHelpDialog.open(sInputValue);
	},

	_handleValueHelpSearch: function(evt) {
		var sValue = evt.getParameter("value");
		var oFilter;
		if (evt.getSource().getId().search("AttDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("WBSDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("NetDialog") > -1 || evt.getSource().getId().search("OrderDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		}
		evt.getSource().getBinding("items").filter([oFilter]);
	},

	_handleValueHelpClose: function(evt) {
		var oSelectedItem = evt.getParameter("selectedItem");
		if (oSelectedItem) {
			var inputDD = this.getView().byId(this.inputId);
			inputDD.setValue(oSelectedItem.getTitle());
			inputDD.setDescription(oSelectedItem.getDescription());
		}
		evt.getSource().getBinding("items").filter([]);
	},

	makeSAPDateTime: function(field, isTime) {
		var path = this.oCreatedEntityContext.getPath() + field;
		var property = this.oModel.getProperty(path);
		var datetime = new Date(property);
		var sapDateTime;
		if (isTime) {
			sapDateTime = this.timeFormatter.format(datetime);
		} else {
			sapDateTime = this.dateFormatter.format(datetime);
		}
		this.oModel.setProperty(path, sapDateTime);
	},

	handleSendRequest: function() {
		console.log(this.oModel);
		//Housekeeping
		this.makeSAPDateTime('/Weekstart', false);
		this.makeSAPDateTime('/Weekend', false);
		this.makeSAPDateTime('/Begda', false);

        var property = this.oModel.getProperty(this.oCreatedEntityContext.getPath() + "/Vtken");
        if (property){
            this.oModel.setProperty(this.oCreatedEntityContext.getPath() + "/Vtken","X");
        }
		// 		this.oModel.setProperty(path,this.makeSAPdate(this.oModel.getProperty(path)));
		this.oModel.submitChanges(function() {
			var msg = 'Request sent';
			sap.m.MessageToast.show(msg);
		}, function() {
			var msg = 'An error occurred during the sending of the request';
			sap.m.MessageToast.show(msg);
		});
		//   {success: "handleSubmitSuccess", error: "handleSubmitError"});
	},

	handleSubmitError: function() {
		var msg = 'An error occurred during the sending of the request';
		sap.m.MessageToast.show(msg);
	},

	handleSubmitSuccess: function() {
		var msg = 'Request sent';
		sap.m.MessageToast.show(msg);
		this.showEmptyView();
	},

	handleFavourites: function(oEvent) {
		var oView = this.getView();

		// create popover
		if (!this._oPopover) {
			this._oPopover = sap.ui.xmlfragment("popover", "com.transfieldservices.dialogs.Favourites", this);
			this.getView().addDependent(this._oPopover);
		}
		// delay because addDependent will do a async rerendering and the popover will immediately close without it
		var oFavButton = oEvent.getSource();
		jQuery.sap.delayedCall(0, this, function() {
			this._oPopover.openBy(oFavButton);
		});
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},

	onExit: function(oEvent) {
		this.getEventBus().unsubscribe("Master2", "LoadFinished", this.onMasterLoaded, this);
		// delete the created entity
		this.oModel.deleteCreatedEntry(this.CreatedEntityContext);
	}
});