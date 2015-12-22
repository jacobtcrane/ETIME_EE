jQuery.sap.require("com.transfieldservices.utils.Conversions");
jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.core.mvc.Controller.extend("com.transfieldservices.view.AllowancesDetail", {

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
		// jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function() {

			// When navigating in the Detail page, update the binding context 
			if (oParameters.name === "allowancedetail") {
				var sEntityPath = "/" + oParameters.arguments.entity;
				this.keyForView = sEntityPath;
				this.bindView(sEntityPath);

				if (this.oNewDetailContext) {
					this.oModel.deleteCreatedEntry(this.oNewDetailContext);
				}
			} else {
				return;
			}
		// }, this));

		if (oParameters.name === "newalldetail") {
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
			if (this.oNewDetailContext != null) {
				this.oModel.deleteCreatedEntry(this.oNewDetailContext);
			}
			this.oModel = this.getView().getModel("theOdataModel");
			this.oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.oModel.refreshMetadata();
			this.oNewDetailContext = this.oModel.createEntry("detailSet", oNewRequest);
			this.keyForView = this.oNewDetailContext.getPath();
			var oView = this.getView();
			oView.setBindingContext(this.oNewDetailContext);
		}
	},

	bindView: function(sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath);

		// var rec = oView.getModel().getData(sEntityPath);
		// //Housekeeping
		// rec.Beguz = this.timeFormatter.format(new Date(rec.Beguz.ms));
		// rec.Enduz = this.timeFormatter.format(new Date(rec.Enduz.ms));
		// oView.getModel().setProperty(sEntityPath, rec);
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
	
/********************
Search Helps - START
*********************/
	handleValueHelp: function(oEvent) {
		var sInputValue = oEvent.getSource().getValue();
		var source = oEvent.getSource().getId();
		var filter;
		this.inputId = oEvent.getSource().getId();
		// create value help dialog
		// if (source.search("allowanceInput") > -1) {
			if (!this._valueHelpAllDialog) {
				this._valueHelpAllDialog = sap.ui.xmlfragment("com.transfieldservices.dialogs.AllowanceDialog", this);
				filter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sInputValue);
				var oBegda = this.oModel.getProperty(this.keyForView).Begda;
				var sEntityPath = '/VH_lgartSet?$filter=Begda le datetime\'' + this.dateFormatter.format(oBegda) + '\'';
				this._valueHelpAllDialog.bindElement(sEntityPath);
				this.getView().addDependent(this._valueHelpAllDialog); //this makes the SAP call
				this._valueHelpAllDialog.getBinding("items").filter([filter]);
			}
			this._valueHelpAllDialog.open(sInputValue);
		// } 
	},

	_handleValueHelpSearch: function(evt) {
		var sValue = evt.getParameter("value");
		var oFilter;
		oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue);
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
	/********************
Search Helps - END
*********************/

	handleSendRequest: function() {
		//Housekeeping
		// com.transfieldservices.utils.Conversions.
		var path = this.oNewDetailContext.getPath() + '/Weekstart';
		var property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.transfieldservices.utils.Conversions.makeSAPDateTime(property, false));
		path = this.oNewDetailContext.getPath() + '/Weekend';
		property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.transfieldservices.utils.Conversions.makeSAPDateTime(property, false));
		path = this.oNewDetailContext.getPath() + '/Begda';
		property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.transfieldservices.utils.Conversions.makeSAPDateTime(property, false));

		this.oModel.submitChanges(function() {
			var msg = 'Request sent';
			sap.m.MessageToast.show(msg);
			this.fireDetailChanged(this.oNewDetailContext.getPath());
		}, function() {
			var msg = 'An error occurred during the sending of the request';
			sap.m.MessageToast.show(msg);
		});
		//   {success: "handleSubmitSuccess", error: "handleSubmitError"});
	},

	fireDetailChanged: function(sEntityPath) {
		this.getEventBus().publish("AllowancesDetail", "Changed", {
			sEntityPath: sEntityPath
		});
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("AllowancesDetail", "NotFound");
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
	
	onNavBack: function() {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("main");
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
		this.oModel.deleteCreatedEntry(this.oNewDetailContext);
	}

});