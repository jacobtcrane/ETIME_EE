jQuery.sap.require("com.broadspectrum.etime.ee.utils.Conversions");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.ui.model.odata.ODataMessageParser");
jQuery.sap.require("sap.m.MessageBox");
sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.Detail", {

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
			if (oParameters.name === "detail") {
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
				Statustxt: "Saved",
				Status: "SAV"
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

		var rec = oView.getModel().getData(sEntityPath);
		//Housekeeping
		// rec.Beguz = this.timeFormatter.format(new Date(rec.Beguz.ms));
		// rec.Enduz = this.timeFormatter.format(new Date(rec.Enduz.ms));
		rec.Beguz = com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(rec.Beguz.ms), true);
		rec.Enduz = com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(rec.Enduz.ms), true);
		oView.getModel().setProperty(sEntityPath, rec);
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
		if (oEvent.getParameters().dateValue) {
			
        	oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
		} else {
        	oEvent.getSource().setValueState(sap.ui.core.ValueState.Warning);
		}
	},

	onEnduzEntered: function(oEvent) {
		var oEnduz = oEvent.getParameters().dateValue;
		var oBeguz = this.getView().byId("beguz").getDateValue();
		this.displayTimeDif(oBeguz, oEnduz);
		if (oEvent.getParameters().dateValue) {
        	oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
        	this.checkEndTimeAfterStart();
		} else {
        	oEvent.getSource().setValueState(sap.ui.core.ValueState.Warning);
		}
	},

	checkEndTimeAfterStart: function() {
		"use strict";	
		if (this.byId("beguz").getDateValue() && this.byId("enduz").getDateValue() &&
			this.byId("beguz").getDateValue() >  this.byId("enduz").getDateValue() 
			) {
        	this.byId("enduz").setValueState(sap.ui.core.ValueState.Error);
        	this.byId("enduz").setValueStateText("End time must be later than start time!");
        	return false;
		} else {
			return true;
		}
	},
	
	getTimeDiff: function(oEnduz, oBeguz) {
		var oTimeDiff = this.getView().byId("objectHeader");
		var diffTime = oEnduz.getTime() - oBeguz.getTime();
		var minutes = ((diffTime / 1000) / 60) % 60;
		var hours = (((diffTime / 1000) / 60) / 60) % 60;
		var strTime = hours + ':' + minutes + ' Hours';
		oTimeDiff.setNumber(strTime);
	},

	// timeFormatter: sap.ui.core.format.DateFormat.getDateInstance({
	// 	pattern: "PThh'H'mm'M'ss'S'"
	// }),

	// dateFormatter: sap.ui.core.format.DateFormat.getDateInstance({
	// 	pattern: "yyyy-MM-ddThh:mm:ss"
	// }),

	showEmptyView: function() {
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.broadspectrum.etime.ee.view.NotFound",
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

	handleHDASelected: function(oEvent) {
		"use strict";
		if (oEvent.getParameter("selected") === true) {
			this.byId("labelenote").setRequired(true);                         
		} else {
			this.byId("labelenote").setRequired(false);                         
		}
	},
	
	handleLiveSearch: function(oEvent) {
		var sInputValue = oEvent.getSource().getValue();
		if (sInputValue.length > 2) {
			this.handleValueHelp(oEvent);
		}
	},

	handleLiveChange: function(oEvent) {
		// check mutually exclusive inputs are not being maintained
		// (only one of wbs/network/order or internal order can be entered)
		var hasConflicts = false;
		var hasWbs = this.byId("wbsInput").getValue() ? true : false;
		var hasNetwork = this.byId("netInput").getValue() ? true : false;
		var hasOrder = this.byId("orderInput").getValue() ? true : false;
		var hasInternalOrder = this.byId("internalorderInput").getValue() ? true : false;
		
		if (oEvent.getSource().getId().search("wbsInput") > -1 && (
			hasNetwork || hasOrder || hasInternalOrder
			)) {
			hasConflicts = true;
		} else if (oEvent.getSource().getId().search("netInput") > -1 && (
			hasWbs || hasOrder || hasInternalOrder
			)) {
			hasConflicts = true;
		} else if (oEvent.getSource().getId().search("orderInput") > -1 && (
			hasWbs || hasNetwork || hasInternalOrder
			)) {
			hasConflicts = true;
		} else if (oEvent.getSource().getId().search("internalorderInput") > -1 && (
			hasWbs || hasNetwork || hasOrder
			)) {
			hasConflicts = true;
		}
		if (hasConflicts) {
			sap.m.MessageBox.show(
			    "Only one cost assignment (WBS Element/Network/Order/Internal Order) is allowed\nRemove one before choosing another...", 
			    sap.m.MessageBox.Icon.ERROR,
			    "Multiple cost assignments",
			    [sap.m.MessageBox.Action.CANCEL]
			);
			oEvent.getSource().setValue(null);
			return false;
		}

		// clear the existing description on input changes
		oEvent.getSource().setDescription(null);
	},

	handleInputChange: function(oEvent) {
		"use strict";
		// register control with message manager
		sap.ui.getCore().getMessageManager().registerObject(oEvent.getSource(), true);
		if (!oEvent.getSource().getDescription()) {
			var sValue = oEvent.getParameter("value");
			if (oEvent.getSource().getId().search("attendanceInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Atext", "Awart");
			} else if (oEvent.getSource().getId().search("wbsInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Post1", "Posid");
			} else if (oEvent.getSource().getId().search("netInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Ktext", "Aufnr");
			} else if (oEvent.getSource().getId().search("orderInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Ktext", "Aufnr");
			} else if (oEvent.getSource().getId().search("causeInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Grdtx", "Grund");
			} else if (oEvent.getSource().getId().search("operationInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Aufnr", "Vornr");
				// this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Ltxa1", "Vornr");
			} else if (oEvent.getSource().getId().search("internalorderInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Ktext", "Iaufnr");
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
			from: "newdetail01",
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
			// 			"Ktext": record.
			// 			"Aufnr": record.Iaufnr,
			"Awart": record.Awart,
			"Beguz": record.Beguz,
			"Enduz": record.Enduz,
			"Vtken": record.Vtken,
			"Stdaz": record.Stdaz,
			"Lgart": record.Lgart,
			"Anzhl": record.Anzhl,
			"Zeinh": record.Zeinh,
			"Srvord": record.Srvord,
			"Nwh": record.Nwh,
			"Wbs": record.Wbs,
			"Iaufnr": record.Iaufnr,
			"Acttyp": record.Acttyp,
			"Operation": record.Operation,
			"Rsnvar": record.Rsnvar,
			"Enote": record.Enote,
			"IsPrepopulated": false,	// this is only true for favs created by the backend
			"Hda": record.Hda
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
			var filter = new sap.ui.model.Filter("Lgart", sap.ui.model.FilterOperator.EQ, "");
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
		// 			"Ktext": record.
		// 			"Aufnr": record.Iaufnr,
		record.Awart = favourite.Awart;
		record.Beguz = favourite.Beguz;
		record.Enduz = favourite.Enduz;
		record.Vtken = favourite.Vtken;
		record.Stdaz = favourite.Stdaz;
		record.Lgart = favourite.Lgart;
		record.Anzhl = favourite.Anzhl;
		record.Zeinh = favourite.Zeinh;
		record.Srvord = favourite.Srvord;
		record.Nwh = favourite.Nwh;
		record.Wbs = favourite.Wbs;
		record.Iaufnr = favourite.Iaufnr;
		record.Acttyp = favourite.Acttyp;
		record.Operation = favourite.Operation;
		record.Rsnvar = favourite.Rsnvar;
		record.Enote = favourite.Enote;
		record.Hda = favourite.Hda;
		this.oModel.setProperty(this.keyForView, record);
		
		// updating the model as above doesn't update the view?
		// update model via bound input fields instead
		if (favourite.Beguz && favourite.Beguz.ms) {
			this.getView().byId("beguz").setValue(com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(favourite.Beguz.ms), true));
		}
		if (favourite.Enduz && favourite.Enduz.ms) {
			this.getView().byId("enduz").setValue(com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(favourite.Enduz.ms), true));
		}
		if (favourite.Vtken) {
			this.getView().byId("vtken").setSelected(favourite.Vtken ? true : false);
		}
		if (favourite.Awart) {
			this.filterSuggestionItems(this.getView().byId("attendanceInput"), favourite.Awart, true, "Awart", "Atext");
		}
		if (favourite.Wbs) {
			this.filterSuggestionItems(this.getView().byId("wbsInput"), favourite.Wbs, true, "Posid", "Post1");
		}
		if (favourite.Nwh) {
			this.filterSuggestionItems(this.getView().byId("netInput"), favourite.Nwh, true, "Aufnr", "Ktext");
		}
		if (favourite.Srvord) {
			this.filterSuggestionItems(this.getView().byId("orderInput"), favourite.Srvord, true, "Aufnr", "Ktext");
		}
		if (favourite.Rsnvar) {
			this.filterSuggestionItems(this.getView().byId("causeInput"), favourite.Rsnvar, true, "Grund", "Grdtx");
		}
		if (favourite.Operation) {
			this.filterSuggestionItems(this.getView().byId("operationInput"), favourite.Operation, true, "Vornr", "Ltxa1");
		}
		if (favourite.Iaufnr) {
			this.filterSuggestionItems(this.getView().byId("internalorderInput"), favourite.Iaufnr, true, "Iaufnr", "Ktext");
		}
		if (favourite.Hda) {
			this.getView().byId("hda").setSelected(favourite.Hda ? true : false);
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
		if (oSource.getId().search("attendanceInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_attendanceSet", new sap.ui.core.ListItem({
					key : "{Awart}",
					text : "{Atext}",
					additionalText : "{Awart}"
				}));
			}
		} else if (oSource.getId().search("wbsInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/PrstpSet", new sap.ui.core.ListItem({
					key : "{Posid}",
					text : "{Post1}",
					additionalText : "{Posid}"
				}));
			}
		} else if (oSource.getId().search("netInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_networkSet", new sap.ui.core.ListItem({
					key : "{Aufnr}",
					text : "{Ktext}",
					additionalText : "{Aufnr}"
				}));
			}
		} else if (oSource.getId().search("orderInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/ZhtrsEtimeOrderShSet", new sap.ui.core.ListItem({
					key : "{Aufnr}",
					text : "{Ktext}",
					additionalText : "{Aufnr}"
				}));
			}
		} else if (oSource.getId().search("causeInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_causeSet", new sap.ui.core.ListItem({
					key : "{Grund}",
					text : "{Grdtx}",
					additionalText : "{Grund}"
				}));
			}
		} else if (oSource.getId().search("operationInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_operationSet", new sap.ui.core.ListItem({
					key : "{Vornr}",
					text : "{Aufnr}",
					// text : "{Ltxa1}",	// current search help behind service cannot filter by description - must use order number instead
					additionalText : "{Ltxa1}"
					// additionalText : "{Vornr}"
				}));
			}
		} else if (oSource.getId().search("internalorderInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_internalOrderSet", new sap.ui.core.ListItem({
					key : "{Aufnr}",
					text : "{Ktext}",
					additionalText : "{Aufnr}"
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
		if (oSource.getId().search("attendanceInput") > -1) {
			oFilter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (oSource.getId().search("wbsInput") > -1) {
			oFilter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (oSource.getId().search("netInput") > -1) {
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (oSource.getId().search("orderInput") > -1) {
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (oSource.getId().search("causeInput") > -1) {
			oFilter = new sap.ui.model.Filter("Grund", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (oSource.getId().search("operationInput") > -1) {
			oFilter = new sap.ui.model.Filter("Vornr", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (oSource.getId().search("internalorderInput") > -1) {
			oFilter = new sap.ui.model.Filter("Iaufnr", sap.ui.model.FilterOperator.Contains, sValue);
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
		} else if (source.search("attendanceInput") > -1) {
			if (!this.getRouter()._valueHelpAttDialog) {
				this.getRouter()._valueHelpAttDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.AttDialog", this);
				filter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sInputValue);
				var oBegda = this.oModel.getProperty(this.keyForView).Begda;
				var sEntityPath = '/VH_attendanceSet?$filter=Begda le datetime\'' + com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(oBegda, false) + '\'';
				this.getRouter()._valueHelpAttDialog.bindElement(sEntityPath);
				this.getView().addDependent(this.getRouter()._valueHelpAttDialog); //this makes the SAP call
				this.getRouter()._valueHelpAttDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpAttDialog.open(sInputValue);
		} else if (source.search("wbsInput") > -1) {
			if (!this.getRouter()._valueHelpWBSDialog) {
				this.getRouter()._valueHelpWBSDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.WBSDialog", this);
				filter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpWBSDialog);
				this.getRouter()._valueHelpWBSDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpWBSDialog.open(sInputValue);
		} else if (source.search("netInput") > -1) {
			if (!this.getRouter()._valueHelpNetDialog) {
				this.getRouter()._valueHelpNetDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.NetworkDialog", this);
				filter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpNetDialog);
				this.getRouter()._valueHelpNetDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpNetDialog.open(sInputValue);
		} else if (source.search("orderInput") > -1) {
			if (!this.getRouter()._valueHelpOrderDialog) {
				this.getRouter()._valueHelpOrderDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.OrderDialog", this);
				filter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpOrderDialog);
				this.getRouter()._valueHelpOrderDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpOrderDialog.open(sInputValue);
		} else if (source.search("causeInput") > -1) {
			if (!this.getRouter()._valueHelpCauseDialog) {
				this.getRouter()._valueHelpCauseDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.CauseDialog", this);
				filter = new sap.ui.model.Filter("Grdtx", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpCauseDialog);
				this.getRouter()._valueHelpCauseDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpCauseDialog.open(sInputValue);
		} else if (source.search("operationInput") > -1) {
			if (!this.getRouter()._valueHelpOperationDialog) {
				this.getRouter()._valueHelpOperationDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.OperationDialog", this);
				filter = new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, sInputValue);
				// filter = new sap.ui.model.Filter("Ltxa1", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpOperationDialog);
				this.getRouter()._valueHelpOperationDialog.getBinding("items").filter([filter]);
			}
			this.getRouter()._valueHelpOperationDialog.open(sInputValue);
		}
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
		} else if (evt.getSource().getId().search("FavouritesDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Guid", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("CauseDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Grdtx", sap.ui.model.FilterOperator.Contains, sValue);
			// oFilter = new sap.ui.model.Filter("Grund", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("OperationDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, sValue);
			// oFilter = new sap.ui.model.Filter("Vornr", sap.ui.model.FilterOperator.Contains, sValue);
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

	// makeSAPDateTime: function(field, isTime) {
	// 	var path = this.oNewDetailContext.getPath() + field;
	// 	var property = this.oModel.getProperty(path);
	// 	var datetime = new Date(property);
	// 	var sapDateTime;
	// 	if (isTime) {
	// 		sapDateTime = this.timeFormatter.format(datetime);
	// 	} else {
	// 		sapDateTime = this.dateFormatter.format(datetime);
	// 	}
	// 	this.oModel.setProperty(path, sapDateTime);
	// },

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
		// check required fields have been maintained
		var aRequiredFields = [];
		if (!this.byId("beguz").getDateValue()) {
			aRequiredFields.push({
				source : this.byId("beguz"),
				msg : "Start time is required"
			});
		}
		if (!this.byId("enduz").getDateValue()) {
			aRequiredFields.push({
				source : this.byId("enduz"),
				msg : "End time is required"
			});
		}
		if (!this.byId("attendanceInput").getDescription()) {
			aRequiredFields.push({
				source : this.byId("attendanceInput"),
				msg : "Attendance type is required"
			});
		}
		if (this.byId("hda").getSelected() && !this.byId("Enote").getValue()) {
			aRequiredFields.push({
				source : this.byId("Enote"),
				msg : "Note is required for Higher Duties"
			});
		}
		aRequiredFields.forEach(function(oRequiredField) {
			oRequiredField.source.setValueStateText(oRequiredField.msg);
            oRequiredField.source.setValueState(sap.ui.core.ValueState.Error);
            isValidated = false;
		}, this);
		// check end time is after start time
		if (!this.checkEndTimeAfterStart()) {
			isValidated = false;
		}
		// check a cost assignment has been provided
		var hasWbs = this.byId("wbsInput").getValue() ? true : false;
		var hasNetwork = this.byId("netInput").getValue() ? true : false;
		var hasOrder = this.byId("orderInput").getValue() ? true : false;
		var hasInternalOrder = this.byId("internalorderInput").getValue() ? true : false;
		if (!hasWbs && !hasNetwork && !hasOrder && !hasInternalOrder) {
			var msg = "Cost assignment (one of WBS Element/Network/Order or Internal Order) is required";
			this.byId("wbsInput").setValueStateText(msg);
            this.byId("wbsInput").setValueState(sap.ui.core.ValueState.Warning);
            isValidated = false;
		}		
		
		return isValidated;
	},
	
	sendRequest: function(statusToSend) {
		if (!this.validateRequiredFields()) {
			return false;
		}
		console.log(this.oModel);
		//Housekeeping
		// this.makeSAPDateTime('/Weekstart', false);
		// this.makeSAPDateTime('/Weekend', false);
		// this.makeSAPDateTime('/Begda', false);
		var path = this.oNewDetailContext.getPath() + '/Weekstart';
		var property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.oNewDetailContext.getPath() + '/Weekend';
		property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.oNewDetailContext.getPath() + '/Begda';
		property = this.oModel.getProperty(path);
		this.oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));

		// var property = this.oModel.getProperty(this.oNewDetailContext.getPath() + "/Vtken");
		// if (property) {
		// 	this.oModel.setProperty(this.oNewDetailContext.getPath() + "/Vtken", "X");
		// }

		var property = this.oModel.getProperty(this.oNewDetailContext.getPath() + "/Status");
		if (property && statusToSend) {
			this.oModel.setProperty(this.oNewDetailContext.getPath() + "/Status", statusToSend);
		}

		// register model as processor with message manager
		sap.ui.getCore().getMessageManager().registerMessageProcessor(this.oModel);
		sap.ui.getCore().getMessageManager().removeAllMessages();
		
		// 		this.oModel.setProperty(path,this.makeSAPdate(this.oModel.getProperty(path)));
		this.oModel.submitChanges($.proxy(function() {
			var msg = 'Request sent';
			sap.m.MessageToast.show(msg);
			this.fireDetailChanged(this.oNewDetailContext.getPath());
		}, this), $.proxy(function(oError) {
			// v2.ODataModel automatically parses messages returned; we appear to have to do it manually
			var oDataMessageParser = new sap.ui.model.odata.ODataMessageParser(
				this.oModel.sServiceUrl + this.oNewDetailContext.getPath(), 
				this.oModel.oServiceData.oMetadata
			);
			oDataMessageParser.setProcessor(this.oModel);
			oDataMessageParser.parse(oError.response, oError.request);
			// show odata errors in message popover
			if (!this._messagePopover) {
				this._messagePopover = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.MessagePopover", this);
				this._messagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel());
				// filter out messages without an actual message
				var oFilter = new sap.ui.model.Filter("message", sap.ui.model.FilterOperator.NE, "");
				if (this._messagePopover.getBinding("items")) {
					this._messagePopover.getBinding("items").filter([oFilter]);
				}

			}
			if (statusToSend === "SAV") {
				this._messagePopover.openBy(this.byId("saveButton"));
			} else {
				this._messagePopover.openBy(this.byId("sendButton"));
			}

			// var msg = 'An error occurred during the sending of the request';
			// sap.m.MessageToast.show(msg);
		},this));
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