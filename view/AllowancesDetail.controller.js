jQuery.sap.require("com.broadspectrum.etime.ee.utils.Conversions");
jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.AllowancesDetail", {

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
			// } else {	// With the commenting of the `jQuery.when` promise above, this return block exits the route matching, affecting the handling of other routes...
			// 	return;
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
				Statustxt: "Saved",
				Status: "SAV",
				isAllowance: true
			};
			if (this.oNewDetailContext != null) {
				this.oModel.deleteCreatedEntry(this.oNewDetailContext);
			}
			this.oModel = this.getView().getModel("theOdataModel");
			this.oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.oModel.refreshMetadata();
			this.oNewDetailContext = this.oModel.createEntry("detailSet", oNewRequest);
			this.keyForView = this.oNewDetailContext.getPath();
			this.getView().setBindingContext(this.oNewDetailContext);
			// reset value state for all input controls
			var aFormElements = this.byId("detailForm").getContent();
			aFormElements.forEach(function(oFormElement) {
				if (oFormElement instanceof sap.m.Input) {
            		oFormElement.setValueState(sap.ui.core.ValueState.None);
					oFormElement.setValueStateText(null);
				}
			});
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

	handleLiveChange: function(oEvent) {
		// clear the existing description on input changes
		oEvent.getSource().setDescription(null);
	},

	handleInputChange: function(oEvent) {
		"use strict";
		// register control with message manager
		sap.ui.getCore().getMessageManager().registerObject(oEvent.getSource(), true);
		if (!oEvent.getSource().getDescription()) {
			var sValue = oEvent.getParameter("value");
			if (oEvent.getSource().getId().search("allowanceInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Lgtxt", "Lgart");
			}
		} else {
			this.checkInputIsValid(oEvent.getSource());
		}
	},

	checkInputIsValid: function(oSource) {
		"use strict";
		if (!oSource.getDescription()) {
			var msg = 'Please choose an item from the list, or use the value help!';
			oSource.setValueStateText(msg);
            oSource.setValueState(sap.ui.core.ValueState.Error);
			return false;
		} else {
            oSource.setValueState(sap.ui.core.ValueState.Success);
		}
	},

	filterSuggestionItems: function(oSource, filterValue, filterValueIsKey, filterPath, dataField) {
		"use strict";
		// ensure the suggestionItems aggregation is bound
		this.bindSuggestionItems(oSource);
		if (filterValueIsKey) {
			oSource.setDescription(filterValue);
		} else {
			oSource.setValue(filterValue);
		}
		var oFilter = new sap.ui.model.Filter(filterPath, sap.ui.model.FilterOperator.EQ, filterValue);
		var suggestionItemsBinding = oSource.getBinding("suggestionItems");
		if (suggestionItemsBinding) {
			// attach handler to the filter's DataReceived event to update the input field value
			var onSuggestionItemBindingDataReceived = function(oDataReceivedEvent) {
				suggestionItemsBinding.detachDataReceived(onSuggestionItemBindingDataReceived, this);
				var data = oDataReceivedEvent.getParameter("data");
				if (data && data.results && data.results.length === 1) {
					if (filterValueIsKey) {
						oSource.setValue(data.results[0][dataField]);
					} else {
						oSource.setDescription(data.results[0][dataField]);
					}
				}
				this.checkInputIsValid(oSource);
			};
			suggestionItemsBinding.attachDataReceived(onSuggestionItemBindingDataReceived, this);
			// now apply the filter
			suggestionItemsBinding.filter([oFilter]);
		}
	},

	/********************
Favourites - START
*********************/
	handleFavourites: function(oEvent) { //Creates the Popover for Managing Favourites
		// var oView = this.getView();

		// create popover
		if (!this.getRouter()._oFavPopover) {
			this.getRouter()._oFavPopover = sap.ui.xmlfragment("popover", "com.broadspectrum.etime.ee.dialogs.Favourites", this);
			this.getView().addDependent(this.getRouter()._oFavPopover);
		}
		// delay because addDependent will do a async rerendering and the popover will immediately close without it
		var oFavButton = oEvent.getSource();
		jQuery.sap.delayedCall(0, this, function() {
			this.getRouter()._oFavPopover.openBy(oFavButton);
		});
	},

	handleManageFavs: function(oEvent) { //Launches Manage Favourites View
		this.getRouter()._oFavPopover.close();
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.broadspectrum.etime.ee.view.Favourites",
			targetViewType: "XML",
			transition: "slide"
		});

		this.getRouter().navTo("favourites", {
			from: "newalldetail",
			entity: "favTableSet"
		}, true);
	},

	handleAddFav: function(oEvent) { //Adds the Screen content as Faourite
		this.oModel = this.getView().getModel("theOdataModel");
		var record = this.oModel.getProperty(this.keyForView);
		var elements = this.getRouter()._oFavPopover.findElements(true);
		var favouriteName;
		for (var i = 0; i < elements.length; i++) {
			if (elements[i].getId().search("favname_id") > -1) {
				var oSource = elements[i];
				favouriteName = oSource.getValue();
				if (!favouriteName) {
					var msg = 'Please provide a name for your favourite!';
					oSource.setValueStateText(msg);
		            oSource.setValueState(sap.ui.core.ValueState.Error);
		            oSource.focus();
					return false;
				} else {
		            oSource.setValueState(sap.ui.core.ValueState.None);
				}
				break;
			}
		}
		this.getRouter()._oFavPopover.close();
		var oNewFav = {
			// "Guid": "0",
			"Pernr": "00000000",
			"Description": favouriteName,
			"Lgart": record.Lgart,
			"Anzhl": record.Anzhl,
			"Enote": record.Enote,
			"IsPrepopulated": false	// this is only true for favs created by the backend
		};
		this.backupNewDet = this.oModel.getProperty(this.oNewDetailContext.getPath());
		this.oModel.deleteCreatedEntry(this.oNewDetailContext); //remove the detail entry as we don't want to save that yet
		this.oModel.createEntry("favTableSet", oNewFav);
		this.oModel.submitChanges(function() {
			var msg = 'Favourite Added';
			sap.m.MessageToast.show(msg);
		}, function() {
			var msg = 'An error occurred during the adding of the favourite';
			sap.m.MessageToast.show(msg);
		});
		this.oNewDetailContext = this.oModel.createEntry("detailSet", this.backupNewDet); //put back the detail entry
		var oView = this.getView();
		oView.setBindingContext(this.oNewDetailContext);

	},

	handleFavSelect: function(oEvent) { //Generates Popover Search Help for selecting a favourite to populate from
		var switchVal = oEvent.getSource().getState();
		if (!this.getRouter()._favSelectDialog) {
			this.getRouter()._favSelectDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.FavouriteSelectDialog", this);
			var filter = new sap.ui.model.Filter("Lgart", sap.ui.model.FilterOperator.NE, "");
			this.getView().addDependent(this.getRouter()._favSelectDialog);
			this.getRouter()._favSelectDialog.getBinding("items").filter([filter]);
		}
		if (switchVal) {
			this.getRouter()._favSelectDialog.open();
		}
	},

	_handlePopFromFavCan: function(oEvent) { //Cancels Search Help
		var favswitch = this.getView().byId("favSwitch");
		favswitch.setState(false);
	},

	handlePopulateFromFav: function(oEvent) { //Populates form with favourite values
		var oItem = oEvent.getParameter("selectedItem");
		var favKey = oItem.getBindingContext().getPath();
		var favourite = this.oModel.getProperty(favKey);
		var record = this.oModel.getProperty(this.keyForView);
		record.pernr = favourite.pernr;
		record.Lgart = favourite.Lgart;
		record.Anzhl = favourite.Anzhl;
		record.Enote = favourite.Enote;
		this.oModel.setProperty(this.keyForView, record);
		//Now do the view housekeeping...
		// updating the model as above doesn't update the view?
		// update model via bound input fields instead
		if (favourite.Lgart) {
			this.filterSuggestionItems(this.getView().byId("allowanceInput"), favourite.Lgart, true, "Lgart", "Lgtxt");
		}
		if (favourite.Anzhl) {
			this.getView().byId("quantity").setValue(favourite.Anzhl);
		}
		if (favourite.Enote) {
			this.getView().byId("Enote").setValue(favourite.Enote);
		}
	},
	/********************
Favourites - END
*********************/

/********************
Search Helps - START
*********************/
	bindSuggestionItems: function(oSource) {
		if (oSource.getId().search("allowanceInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_lgartSet", new sap.ui.core.ListItem({
					key : "{Lgart}",
					text : "{Lgtxt}",
					additionalText : "{Lgart}"
				}));
			}
		}
	},

	handleSuggest: function(evt) {
		var oSource = evt.getSource();
		// start by clearing the existing description
		oSource.setDescription(null);
		// ensure the suggestionItems aggregation is bound
		this.bindSuggestionItems(evt.getSource());
		var sValue = evt.getParameter("suggestValue");
		var oFilter;
		if (oSource.getId().search("allowanceInput") > -1) {
			oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue);
		}
		var suggestionItemsBinding = oSource.getBinding("suggestionItems");
		if (suggestionItemsBinding) {
			// set the control as busy until we've received data for the filter
			oSource.setBusy(true); 
			var onFilterDataReceived = function() {
				suggestionItemsBinding.detachDataReceived(onFilterDataReceived, this);
				oSource.setBusy(false);
			};
			suggestionItemsBinding.attachDataReceived(onFilterDataReceived, this);
			// apply the filter
			suggestionItemsBinding.filter([oFilter]);
		}
	},

	handleSuggestionSel: function(oEvent) {
		// this.handleValueHelp(oEvent);
		var selectedItem = oEvent.getParameter("selectedItem");
		if (selectedItem) {
			oEvent.getSource().setDescription(selectedItem.getKey());
			this.checkInputIsValid(oEvent.getSource());
		}
	},

	handleValueHelp: function(oEvent) {
		var sInputValue = oEvent.getSource().getValue();
		var source = oEvent.getSource().getId();
		var filter;
		this.inputId = oEvent.getSource().getId();
		// create value help dialog
		if (source.search("favouriteDD") > -1) {
			if (!this.getRouter()._valueHelpFavouritesDialog) {
				this.getRouter()._valueHelpFavouritesDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.FavouritesDialog", this);
				filter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpFavouritesDialog);
				this.getRouter()._valueHelpFavouritesDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpFavouritesDialog.open(sInputValue);
		} else if (source.search("allowanceInput") > -1) {
			if (!this.getRouter()._valueHelpAllDialog) {
				this.getRouter()._valueHelpAllDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.AllowanceDialog", this);
				filter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sInputValue);
				var oBegda = this.oModel.getProperty(this.keyForView).Begda;
				var sEntityPath = '/VH_lgartSet?$filter=Begda le datetime\'' + com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(oBegda, false) + '\'';
				this.getRouter()._valueHelpAllDialog.bindElement(sEntityPath);
				this.getView().addDependent(this.getRouter()._valueHelpAllDialog); //this makes the SAP call
				this.getRouter()._valueHelpAllDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpAllDialog.open(sInputValue);
		} 
	},

	_handleValueHelpSearch: function(evt) {
		var sValue = evt.getParameter("value");
		var oFilter;
		if (evt.getSource().getId().search("AllowanceDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue);
		}
		if (evt.getSource().getBinding("items")) {
			evt.getSource().getBinding("items").filter([oFilter]);
		}
	},

	_handleValueHelpClose: function(evt) {
		var oSelectedItem = evt.getParameter("selectedItem");
		if (oSelectedItem) {
			var inputDD = this.getView().byId(this.inputId);
			inputDD.setValue(oSelectedItem.getTitle());
			inputDD.setDescription(oSelectedItem.getDescription());
			this.checkInputIsValid(inputDD);
		}
		// if (evt.getSource().getBinding("items")) {
		// 	evt.getSource().getBinding("items").filter([]);
		// }
	},
	/********************
Search Helps - END
*********************/

	handleSaveRequest: function() {
		this.sendRequest("SAV");	// send as status "Saved"
	},

	handleSendRequest: function() {
		this.sendRequest("SUB");	// send as status "Submitted"
	},

	// due to the generic nature of the entity set backing this form
	// we cannot rely on nullable constraints of bound odata fields 
	// to have required fields enforced, but have to do it ourselves
	validateRequiredFields: function() {
		var isValidated = true;
		var aRequiredFields = [];
		if (!this.byId("allowanceInput").getDescription()) {
			aRequiredFields.push({
				source : this.byId("allowanceInput"),
				msg : "Allowance type is required"
			});
		}
		if (!this.byId("quantity").getValue()) {
			aRequiredFields.push({
				source : this.byId("quantity"),
				msg : "Allowance quantity is required"
			});
		}
		aRequiredFields.forEach(function(oRequiredField) {
			oRequiredField.source.setValueStateText(oRequiredField.msg);
            oRequiredField.source.setValueState(sap.ui.core.ValueState.Error);
            isValidated = false;
		}, this);

		return isValidated;
	},
	
	sendRequest: function(statusToSend) {
		if (!this.validateRequiredFields()) {
			return false;
		}
		//Housekeeping
		// com.broadspectrum.etime.ee.utils.Conversions.
		var path = this.oNewDetailContext.getPath() + '/Weekstart';
		var property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.oNewDetailContext.getPath() + '/Weekend';
		property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.oNewDetailContext.getPath() + '/Begda';
		property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));

		var property = this.oModel.getProperty(this.oNewDetailContext.getPath() + "/Status");
		if (property && statusToSend) {
			this.oModel.setProperty(this.oNewDetailContext.getPath() + "/Status", statusToSend);
		}

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