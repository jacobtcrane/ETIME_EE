jQuery.sap.require("com.broadspectrum.etime.ee.utils.Conversions");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.ui.model.odata.ODataMessageParser");
jQuery.sap.require("sap.m.MessageBox");
sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.Detail", {

	onInit: function() {
		// 		this.oInitialLoadFinishedDeferred = jQuery.Deferred();

		// 		if (sap.ui.Device.system.phone) {
		// 			//Do not wait for the master2 when in mobile phone resolution
		// 			this.oInitialLoadFinishedDeferred.resolve();
		// 		} else {
		// 			var oEventBus = this.getEventBus();
		// 			oEventBus.subscribe("Master2", "LoadFinished", this.onMasterLoaded, this);
		// 		}

		this.getEventBus().subscribe("Master2", "ItemSelected", this.onMasterItemSelected, this);

		if (this.getRouter() != null) {
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		}
	},

	onMasterItemSelected: function(sChannel, sEvent, oData) {
		if (oData.oBindingContext) {
			var oModel = this.getModel();
			var oDetailEntity = oModel.getProperty(oData.oBindingContext.getPath());
			// update the view's binding context based on the master item selection
			if (oDetailEntity) {
				if (this.formatEntityDates(oDetailEntity)) {
					oModel.setProperty(oData.oBindingContext.getPath(), oDetailEntity);
				}
				this.getView().setBindingContext(oData.oBindingContext);
				this.addModelChangeListener();
			} else {
				this.showEmptyView();
				this.fireDetailNotFound();
			}
		} else {
			this.showEmptyView();
			this.fireDetailNotFound();
		}
	},

	// 	onMasterLoaded: function(sChannel, sEvent, oData) {
	// 		if (oData.oListItem) {
	// 		    var oModel = this.getModel();
	// 		    this.oBindingContext = oData.oListItem.getBindingContext();
	// 			this.getContextPath() = this.oBindingContext.getPath();
	// 			this.oDetailEntity = oModel.getProperty(this.getContextPath());
	// 			this.bindView();
	// 			this.oInitialLoadFinishedDeferred.resolve();
	// 		}
	// 	},

	onRouteMatched: function(oEvent) {
		var oModel = this.getModel();
		var oParameters = oEvent.getParameters();
		// 		var from = oParameters.name;
		// jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function() {

		// When navigating in the Detail page, update the binding context
		if (oParameters.name === "detail" ||
		    oParameters.name === "allowancedetail") {
			// for existing detail records, setup and binding is done in onMasterItemSelected;
			// when the routing match occurs we just clean up in preparation
			// 			this.getView().unbindElement();
			// remove any unsaved new detail entities from the model
			if (this.oNewDetailContext) {
				oModel.deleteCreatedEntry(this.oNewDetailContext);
				this.oNewDetailContext = null;
			}
			// this.getContextPath() = "/" + oParameters.arguments.entity;
			// this.oDetailEntity = oModel.getProperty(this.getContextPath());
			// this.bindView();
			// reset value state for all input controls
			this.resetFormElementValueState();
			// hide favourites panel and button
			this.getView().byId("favPanel").setVisible(false);
			this.getView().byId("favButton").setVisible(false);
			// } else {	// With the commenting of the `jQuery.when` promise above, this return block exits the route matching, affecting the handling of other routes...
			// 	return;
			if (oParameters.name === "allowancedetail") {
			    this.setupAllowanceDetail();
			} else {
			    this.setupAttendanceDetail();
			}

		}
		// }, this));

		if (oParameters.name === "newdetail" ||
		    oParameters.name === "newalldetail") {
			//remove any existing view bindings
			// 			this.getView().unbindElement();
			// remove any unsaved new detail entities from the model
			if (this.oNewDetailContext) {
				oModel.deleteCreatedEntry(this.oNewDetailContext);
			}
			//create new record
			var oSelectedDate = new Date(oParameters.arguments.entity);
			// 			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			// 			oModel.refreshMetadata();
			var isAllowance = oParameters.name === "newalldetail" ? true : false;
			this.oNewDetailContext = oModel.createEntry("detailSet", {
			        batchGroupId: "detailChanges",
			        properties: this.prepareNewDetailEntity(oSelectedDate, isAllowance)
	        });
			// 			this.oDetailEntity = this.oNewDetailContext.getProperty();
			// 			this.detailEntityPath = this.oNewDetailContext.getPath();
			this.getView().setBindingContext(this.oNewDetailContext);
			// 			this.bindView();

			// reset value state for all input controls
			this.resetFormElementValueState();
			// show favourites panel and button
			this.getView().byId("favPanel").setVisible(true);
			this.getView().byId("favButton").setVisible(true);
			// reset favourites switch
// 			this.getView().byId("favSwitch").setState(false);
            this.getView().byId("loadFavButton").setPressed(false);
			if (oParameters.name === "newalldetail") {
			    this.setupAllowanceDetail();
			} else {
			    this.setupAttendanceDetail();
			}
		}
	},

	prepareNewDetailEntity: function(oSelectedDate, isAllowance) {
		return {
			Acttyp: "",
			Anzhl: "0.00",
			Atttxt: "",
			Awart: "",
			Awarttxt: "",
			Begda: oSelectedDate,
			Beguz: "PT00H00M00S",
			Costtxt: "",
			Durationtxt: "",
			Enduz: "PT00H00M00S",
			Enote: "",
			Hda: false,
			Iaufnr: "",
			Iaufnrtxt: "",
			Isabs: false,
			isAllowance: isAllowance ? true : false,
			Lgart: "",
			Lgarttxt: "",
			Mnote: "",
			Networktxt: "",
			Nwh: "",
			Operation: "",
			Operationtxt: "",
			Ordertxt: "",
			Pernr: "00000000",
			Rsnvar: "",
			Rsnvartxt: "",
			Seqnr: "000",
			Srvord: "",
			Status: "NEW",
			Statustxt: "New",
			Stdaz: "0.00",
			Timetxt: "",
			Vtken: false,
			Wbs: "",
			Wbstxt: "",
			Weekstart: oSelectedDate,
			Weekend: oSelectedDate
		}
	},

    setupAttendanceDetail: function() {
        // change view bindings for attendance
        this.byId("objectHeader").bindProperty("number", "Durationtxt");
        this.byId("objectHeaderAttr").bindProperty("text", "Timetxt");
    },
    
    setupAllowanceDetail: function() {
        // change view bindings for allowance
        this.byId("objectHeader").bindProperty("number", "Anzhl");
        this.byId("objectHeaderAttr").bindProperty("text", "Lgarttxt");
    },
    
    isAttendance: function(isAllowance) {
        return !isAllowance;
    },
    
	resetFormElementValueState: function() {
		// reset value state for all input controls
		var aFormElements = this.byId("detailForm").getContent();
		aFormElements.forEach(function(oFormElement) {
			if (oFormElement instanceof sap.m.DateTimeInput ||
				oFormElement instanceof sap.m.Input) {
				oFormElement.setValueState(sap.ui.core.ValueState.None);
				oFormElement.setValueStateText(null);
			}
		});
	},

	formatEntityDates: function(oDetailEntity) {
		var didChangeDates = false;
		if (oDetailEntity.Beguz && oDetailEntity.Beguz.ms) {
			oDetailEntity.Beguz = com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(oDetailEntity.Beguz.ms), true, true);
			didChangeDates = true;
		}
		if (oDetailEntity.Enduz && oDetailEntity.Enduz.ms) {
			oDetailEntity.Enduz = com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(oDetailEntity.Enduz.ms), true, true);
			didChangeDates = true;
		}
		return didChangeDates;
	},

	addModelChangeListener: function() {
		var oModel = this.getModel();
		if (!this.oBinding || (this.oBinding && this.oBinding.getPath() !== this.getContextPath())) {
		    if (this.oBinding) {
		        this.oBinding.destroy();    // clean up existing binding and event handlers
		    }
		    this.oBinding = new sap.ui.model.Binding(oModel, this.getContextPath(), oModel.getContext(this.getContextPath()));
		    var setStatustxtEdited = function() {
		        this.oBinding.detachChange(setStatustxtEdited, this);
				// mark the entity as edited via status text
				var property = oModel.getProperty(this.getContextPath() + "/Statustxt");
				if (property) {
					oModel.setProperty(this.getContextPath() + "/Statustxt", "Edited");
				}
		    };
			this.oBinding.attachChange(setStatustxtEdited, this);
		}
	},

	// 	bindView: function() {
	// 	    var oModel = this.getModel();
	// 		//Check if the data is already on the client
	// 		if (!this.oDetailEntity) {
	// 			// Check that the entity specified was found
	// 			this.showEmptyView();
	// 			this.fireDetailNotFound();
	// 		} else {
	// 			// this.fireDetailChanged(sEntityPath);
	// 			// convert from native odata in UTC to formatted string in local time
	// 		}

	// 	},

	getContextObject: function() {
		var oModel = this.getModel();
		return oModel.getProperty(this.getContextPath());
	},

	getContextPath: function() {
		var oContext = this.getView().getBindingContext();
		if (oContext) {
			return oContext.getPath();
		} else {
			return null;
		}
	},

	displayTimeDif: function(begda, endda) {
		var Durationtxt = "";
		var Timetxt = "";
		if (endda instanceof Date || begda instanceof Date) {
			if (endda instanceof Date) {
				begda.setFullYear(1970);
				begda.setMonth(0);
				begda.setDate(1);
			}
			if (endda instanceof Date) {
				endda.setFullYear(1970);
				endda.setMonth(0);
				endda.setDate(1);
			}
			var oTimeFormatter = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "HH':'mm"
			});
			var oTimeFormatterUTC = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "H':'mm",
				UTC: true
			});
			Timetxt = (begda instanceof Date ? oTimeFormatter.format(begda) : "?") + "-" + (endda instanceof Date ? oTimeFormatter.format(endda) :
				"?");
			if (endda instanceof Date &&
				begda instanceof Date) {
				if (endda.getTime() > begda.getTime()) {
					var diffTime = endda.getTime() - begda.getTime();
					var diffDate = new Date();
					diffDate.setFullYear(1970);
					diffDate.setMonth(0);
					diffDate.setDate(1);
					diffDate.setTime(diffTime);
					Durationtxt = oTimeFormatterUTC.format(diffDate) + " Hours";
				} else {
					Timetxt = "";
				}
			}
		}
		// now set the formatted duration and time difference texts to the model
		this.getModel().setProperty(this.getContextPath() + "/Timetxt", Timetxt);
		this.getModel().setProperty(this.getContextPath() + "/Durationtxt", Durationtxt);
	},

	onBeguzEntered: function(oEvent) {
		// 		var oBeguz = oEvent.getParameters().value;
		// 		var oEnduz = this.getView().byId("enduz").getValue();
		var oBeguz = oEvent.getParameters().dateValue;
		var oEnduz = this.getView().byId("enduz").getDateValue();
		this.displayTimeDif(oBeguz, oEnduz);
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
			this.byId("beguz").getDateValue() > this.byId("enduz").getDateValue()
		) {
			this.byId("enduz").setValueState(sap.ui.core.ValueState.Error);
			this.byId("enduz").setValueStateText("End time must be later than start time!");
			return false;
		} else {
			return true;
		}
	},

	// 	getTimeDiff: function(oEnduz, oBeguz) {
	// 		var diffTime = oEnduz.getTime() - oBeguz.getTime();
	// 		var minutes = ((diffTime / 1000) / 60) % 60;
	// 		var hours = Math.floor(((diffTime / 1000) / 60) / 60);
	// 		if (minutes < 10) {
	// 			var strTime = hours + ':' + "0" + minutes + ' Hours';
	// 		} else {
	// 			var strTime = hours + ':' + minutes + ' Hours';
	// 		}
	// 		oTimeDiff.setNumber(strTime);
	// 	},

	// timeFormatter: sap.ui.core.format.DateFormat.getDateInstance({
	// 	pattern: "PTHH'H'mm'M'ss'S'"
	// }),

	// dateFormatter: sap.ui.core.format.DateFormat.getDateInstance({
	// 	pattern: "yyyy-MM-ddTHH:mm:ss"
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
		this.getEventBus().publish("Detail", "NotFound", {});
	},

    cleanup: function() {
	    if (this.oBinding) {
	        this.oBinding.destroy();
	        this.oBinding = null;
	    }
		if (this.oNewDetailContext) {
			this.oNewDetailContext = null;
		}
	    this.getView().unbindElement();
	    this.getView().setBindingContext(null);
    },
    
	onNavBack: function() {
		var oRouter = this.getRouter();
		var oModel = this.getModel();
		if (this.getModel().hasPendingChanges()) {
			sap.m.MessageBox.show("Exit without saving changes?", {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: "Unsaved Changes",
				actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.OK],
				onClose: $.proxy(function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
                		if (this.oNewDetailContext) {
                		    // remove new record from model, if any
                			oModel.deleteCreatedEntry(this.oNewDetailContext);
                		}
						this.cleanup();
						oModel.resetChanges();
						oRouter.myNavBack("main");
					}
				}, this)
			});
		} else {
			this.cleanup();
			oRouter.myNavBack("main");
		}
	},

// 	onDetailSelect: function(oEvent) {
// 		sap.ui.core.UIComponent.getRouterFor(this).navTo("detail", {
// 			entity: oEvent.getSource().getBindingContext().getPath().slice(1)
// 		}, true);
// 	},

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
				"Multiple cost assignments", [sap.m.MessageBox.Action.CANCEL]
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
			} else if (oEvent.getSource().getId().search("allowanceInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, false, "Lgtxt", "Lgart");
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
		var oModel = this.getModel();
		var oDetailEntity = this.getContextObject();
		var aElements = this.getRouter()._oFavPopover.findElements(true);
		var favouriteName;
		for (var i = 0; i < aElements.length; i++) {
			if (aElements[i].getId().search("favname_id") > -1) {
				var oSource = aElements[i];
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
		var oNewFavEntity = {
			// "Guid": "0",
			"Pernr": "00000000",
			"Description": favouriteName,
			"Awart": oDetailEntity.Awart,
			"Beguz": oDetailEntity.Beguz,
			"Enduz": oDetailEntity.Enduz,
			"Vtken": oDetailEntity.Vtken,
			"Stdaz": oDetailEntity.Stdaz,
			"Lgart": oDetailEntity.Lgart,
			"Anzhl": oDetailEntity.Anzhl,
			"Zeinh": oDetailEntity.Zeinh,
			"Srvord": oDetailEntity.Srvord,
			"Nwh": oDetailEntity.Nwh,
			"Wbs": oDetailEntity.Wbs,
			"Iaufnr": oDetailEntity.Iaufnr,
			"Acttyp": oDetailEntity.Acttyp,
			"Operation": oDetailEntity.Operation,
			"Rsnvar": oDetailEntity.Rsnvar,
			"Enote": oDetailEntity.Enote,
			"IsPrepopulated": false, // this is only true for favs created by the backend
			"Hda": oDetailEntity.Hda
		};
		if (this.oNewDetailContext) {
			//remove the new detail entity from the model as we don't want to save that yet
			oModel.deleteCreatedEntry(this.oNewDetailContext);
		}
		oModel.createEntry("favTableSet", oNewFavEntity);
		oModel.submitChanges(function() {
			var msg = 'Favourite Added';
			sap.m.MessageToast.show(msg);
		}, function() {
			var msg = 'An error occurred during the adding of the favourite';
			sap.m.MessageToast.show(msg);
		});
		if (this.oNewDetailContext) {
			// now recreate the new detail entity on the model
			this.oNewDetailContext = oModel.createEntry("detailSet", oDetailEntity);
			this.getView().setBindingContext(this.oNewDetailContext);
		}

	},

	handleFavSelect: function(oEvent) { //Generates Popover Search Help for selecting a favourite to populate from
// 		var switchVal = oEvent.getSource().getState();
        var switchVal = oEvent.getSource().getPressed();
		if (!this.getRouter()._favSelectDialog) {
			this.getRouter()._favSelectDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.FavouriteSelectDialog", this);
    		var oDetailEntity = this.getContextObject();
			var filter = new sap.ui.model.Filter("Lgart", oDetailEntity.isAllowance ? sap.ui.model.FilterOperator.NE : sap.ui.model.FilterOperator.EQ, "");
			this.getView().addDependent(this.getRouter()._favSelectDialog);
			this.getRouter()._favSelectDialog.getBinding("items").filter([filter]);
		}
		if (switchVal) {
			this.getRouter()._favSelectDialog.open();
		}
	},

	_handlePopFromFavCan: function(oEvent) { //Handles fav popover cancelled
		this.getView().byId("loadFavButton").setPressed(false);
	},

	handlePopulateFromFav: function(oEvent) { //Populates form with favourite values
		var oModel = this.getModel();
		var oDetailEntity = this.getContextObject();
		var oItem = oEvent.getParameter("selectedItem");
		var favEntityPath = oItem.getBindingContext().getPath();
		var oFavEntity = oModel.getProperty(favEntityPath);
		oDetailEntity.pernr = oFavEntity.pernr;
		oDetailEntity.Awart = oFavEntity.Awart;
		oDetailEntity.Beguz = oFavEntity.Beguz;
		oDetailEntity.Enduz = oFavEntity.Enduz;
		oDetailEntity.Vtken = oFavEntity.Vtken;
		oDetailEntity.Stdaz = oFavEntity.Stdaz;
		oDetailEntity.Lgart = oFavEntity.Lgart;
		oDetailEntity.Anzhl = oFavEntity.Anzhl;
		oDetailEntity.Zeinh = oFavEntity.Zeinh;
		oDetailEntity.Srvord = oFavEntity.Srvord;
		oDetailEntity.Nwh = oFavEntity.Nwh;
		oDetailEntity.Wbs = oFavEntity.Wbs;
		oDetailEntity.Iaufnr = oFavEntity.Iaufnr;
		oDetailEntity.Acttyp = oFavEntity.Acttyp;
		oDetailEntity.Operation = oFavEntity.Operation;
		oDetailEntity.Rsnvar = oFavEntity.Rsnvar;
		oDetailEntity.Enote = oFavEntity.Enote;
		oDetailEntity.Hda = oFavEntity.Hda;
		this.formatEntityDates(oDetailEntity);
		oModel.setProperty(this.getContextPath(), oDetailEntity);

		// perform lookups for descritions of received values
		// if (oFavEntity.Beguz && oFavEntity.Beguz.ms) {
		// 	this.getView().byId("beguz").setValue(com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(oFavEntity.Beguz.ms), true));
		// }
		// if (oFavEntity.Enduz && oFavEntity.Enduz.ms) {
		// 	this.getView().byId("enduz").setValue(com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(new Date(oFavEntity.Enduz.ms), true));
		// }
		// if (oFavEntity.Vtken) {
		// 	this.getView().byId("vtken").setSelected(oFavEntity.Vtken ? true : false);
		// }
		if (oFavEntity.Awart) {
			this.filterSuggestionItems(this.getView().byId("attendanceInput"), oFavEntity.Awart, true, "Awart", "Atext");
		}
		if (oFavEntity.Lgart) {
			this.filterSuggestionItems(this.getView().byId("allowanceInput"), oFavEntity.Lgart, true, "Lgart", "Lgtxt");
		}
// 		if (oFavEntity.Anzhl) {
// 			this.getView().byId("quantity").setValue(oFavEntity.Anzhl);
// 		}
		if (oFavEntity.Wbs) {
			this.filterSuggestionItems(this.getView().byId("wbsInput"), oFavEntity.Wbs, true, "Posid", "Post1");
		}
		if (oFavEntity.Nwh) {
			this.filterSuggestionItems(this.getView().byId("netInput"), oFavEntity.Nwh, true, "Aufnr", "Ktext");
		}
		if (oFavEntity.Srvord) {
			this.filterSuggestionItems(this.getView().byId("orderInput"), oFavEntity.Srvord, true, "Aufnr", "Ktext");
		}
		if (oFavEntity.Rsnvar) {
			this.filterSuggestionItems(this.getView().byId("causeInput"), oFavEntity.Rsnvar, true, "Grund", "Grdtx");
		}
		if (oFavEntity.Operation) {
			this.filterSuggestionItems(this.getView().byId("operationInput"), oFavEntity.Operation, true, "Vornr", "Ltxa1");
		}
		if (oFavEntity.Iaufnr) {
			this.filterSuggestionItems(this.getView().byId("internalorderInput"), oFavEntity.Iaufnr, true, "Iaufnr", "Ktext");
		}
		// if (oFavEntity.Hda) {
		// 	this.getView().byId("hda").setSelected(oFavEntity.Hda ? true : false);
		// }
		// if (oFavEntity.Enote) {
		// 	this.getView().byId("Enote").setValue(oFavEntity.Enote);
		// }

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
					key: "{Awart}",
					text: "{Atext}",
					additionalText: "{Awart}"
				}));
			}
		} else if (oSource.getId().search("allowanceInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_lgartSet", new sap.ui.core.ListItem({
					key : "{Lgart}",
					text : "{Lgtxt}",
					additionalText : "{Lgart}"
				}));
			}
		} else if (oSource.getId().search("wbsInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/PrstpSet", new sap.ui.core.ListItem({
					key: "{Posid}",
					text: "{Post1}",
					additionalText: "{Posid}"
				}));
			}
		} else if (oSource.getId().search("netInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_networkSet", new sap.ui.core.ListItem({
					key: "{Aufnr}",
					text: "{Ktext}",
					additionalText: "{Aufnr}"
				}));
			}
		} else if (oSource.getId().search("orderInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/ZhtrsEtimeOrderShSet", new sap.ui.core.ListItem({
					key: "{Aufnr}",
					text: "{Ktext}",
					additionalText: "{Aufnr}"
				}));
			}
		} else if (oSource.getId().search("causeInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_causeSet", new sap.ui.core.ListItem({
					key: "{Grund}",
					text: "{Grdtx}",
					additionalText: "{Grund}"
				}));
			}
		} else if (oSource.getId().search("operationInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_operationSet", new sap.ui.core.ListItem({
					key: "{Vornr}",
					text: "{Aufnr}",
					// text : "{Ltxa1}",	// current search help behind service cannot filter by description - must use order number instead
					additionalText: "{Ltxa1}"
					// additionalText : "{Vornr}"
				}));
			}
		} else if (oSource.getId().search("internalorderInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_internalOrderSet", new sap.ui.core.ListItem({
					key: "{Aufnr}",
					text: "{Ktext}",
					additionalText: "{Aufnr}"
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
		} else if (oSource.getId().search("allowanceInput") > -1) {
			oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue);
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
		// 		var oModel = this.getModel();
		var oDetailEntity = this.getContextObject();
		var sInputValue = oEvent.getSource().getValue();
		var source = oEvent.getSource().getId();
		var oFilter;
		this.inputId = oEvent.getSource().getId();
		// create value help dialog
		if (source.search("favouriteDD") > -1) {
			if (!this.getRouter()._valueHelpFavouritesDialog) {
				this.getRouter()._valueHelpFavouritesDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.FavouritesDialog", this);
				oFilter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpFavouritesDialog);
				this.getRouter()._valueHelpFavouritesDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpFavouritesDialog.open(sInputValue);
		} else if (source.search("attendanceInput") > -1) {
			if (!this.getRouter()._valueHelpAttDialog) {
				this.getRouter()._valueHelpAttDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.AttDialog", this);
				oFilter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sInputValue);
				// var sEntityPath = '/VH_attendanceSet?$filter=Begda le datetime\'' + com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(oBegda, false) + '\'';
				// this.getRouter()._valueHelpAttDialog.bindElement(sEntityPath);
				this.getView().addDependent(this.getRouter()._valueHelpAttDialog); //this makes the SAP call
				// filter on both date and text
				this.getRouter()._valueHelpAttDialog.getBinding("items").filter([new sap.ui.model.Filter({
					filters: [
                        oFilter,
                        new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.LE, oDetailEntity.Begda)
                    ],
					and: true
				})]);
			}
			this.getRouter()._valueHelpAttDialog.open(sInputValue);
		} else if (source.search("allowanceInput") > -1) {
			if (!this.getRouter()._valueHelpAllDialog) {
				this.getRouter()._valueHelpAllDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.AllowanceDialog", this);
				oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpAllDialog); //this makes the SAP call
				// filter on both date and text
				this.getRouter()._valueHelpAllDialog.getBinding("items").filter([new sap.ui.model.Filter({
					filters: [
                        oFilter,
                        new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.LE, oDetailEntity.Begda)
                    ],
					and: true
				})]);
				this.getRouter()._valueHelpAllDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpAllDialog.open(sInputValue);
		} else if (source.search("wbsInput") > -1) {
			if (!this.getRouter()._valueHelpWBSDialog) {
				this.getRouter()._valueHelpWBSDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.WBSDialog", this);
				oFilter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpWBSDialog);
				this.getRouter()._valueHelpWBSDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpWBSDialog.open(sInputValue);
		} else if (source.search("netInput") > -1) {
			if (!this.getRouter()._valueHelpNetDialog) {
				this.getRouter()._valueHelpNetDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.NetworkDialog", this);
				oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpNetDialog);
				this.getRouter()._valueHelpNetDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpNetDialog.open(sInputValue);
		} else if (source.search("orderInput") > -1) {
			if (!this.getRouter()._valueHelpOrderDialog) {
				this.getRouter()._valueHelpOrderDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.OrderDialog", this);
				oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpOrderDialog);
				this.getRouter()._valueHelpOrderDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpOrderDialog.open(sInputValue);
		} else if (source.search("causeInput") > -1) {
			if (!this.getRouter()._valueHelpCauseDialog) {
				this.getRouter()._valueHelpCauseDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.CauseDialog", this);
				oFilter = new sap.ui.model.Filter("Grdtx", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpCauseDialog);
				this.getRouter()._valueHelpCauseDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpCauseDialog.open(sInputValue);
		} else if (source.search("operationInput") > -1) {
			if (!this.getRouter()._valueHelpOperationDialog) {
				this.getRouter()._valueHelpOperationDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.OperationDialog", this);
				oFilter = new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, sInputValue);
				// filter = new sap.ui.model.Filter("Ltxa1", sap.ui.model.FilterOperator.Contains, sInputValue);
				this.getView().addDependent(this.getRouter()._valueHelpOperationDialog);
				this.getRouter()._valueHelpOperationDialog.getBinding("items").filter([oFilter]);
			}
			this.getRouter()._valueHelpOperationDialog.open(sInputValue);
		}
	},

	_handleValueHelpSearch: function(evt) {
		var sValue = evt.getParameter("value");
		var oFilter;
		if (evt.getSource().getId().search("AttDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("AllowanceDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue);
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
	//	oModel = this.getModel();
	// 	var path = this.getContextPath() + field;
	// 	var property = oModel.getProperty(path);
	// 	var datetime = new Date(property);
	// 	var sapDateTime;
	// 	if (isTime) {
	// 		sapDateTime = this.timeFormatter.format(datetime);
	// 	} else {
	// 		sapDateTime = this.dateFormatter.format(datetime);
	// 	}
	// 	oModel.setProperty(path, sapDateTime);
	// },

	handleSaveRequest: function() {
		this.sendRequest("SAV"); // send as status "Saved"
	},

	handleSendRequest: function() {
		this.sendRequest("SUB"); // send as status "Submitted"
	},

	// due to the generic nature of the entity set backing this form
	// we cannot rely on nullable constraints of bound odata fields 
	// to have required fields enforced, but have to do it ourselves
	validateRequiredFields: function() {
		var isValidated = true;
		// check required fields have been maintained
		var aRequiredFields = [];
		var oDetailEntity = this.getContextObject();
		if (oDetailEntity.isAllowance) {
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
		} else {
    		if (!this.byId("beguz").getDateValue()) {
    			aRequiredFields.push({
    				source: this.byId("beguz"),
    				msg: "Start time is required"
    			});
    		}
    		if (!this.byId("enduz").getDateValue()) {
    			aRequiredFields.push({
    				source: this.byId("enduz"),
    				msg: "End time is required"
    			});
    		}
    		if (!this.byId("attendanceInput").getDescription()) {
    			aRequiredFields.push({
    				source: this.byId("attendanceInput"),
    				msg: "Attendance type is required"
    			});
    		}
		}
		if (this.byId("hda").getSelected() && !this.byId("Enote").getValue()) {
			aRequiredFields.push({
				source: this.byId("Enote"),
				msg: "Note is required for Higher Duties"
			});
		}
		aRequiredFields.forEach(function(oRequiredField) {
			oRequiredField.source.setValueStateText(oRequiredField.msg);
			oRequiredField.source.setValueState(sap.ui.core.ValueState.Error);
			isValidated = false;
		}, this);
		// check end time is after start time
		if (oDetailEntity.isAttendance) {
		if (!this.checkEndTimeAfterStart()) {
			isValidated = false;
		}
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
		var oModel = this.getModel();
		if (statusToSend === "SUB" && // validate upon submit (not save)
			!this.validateRequiredFields()) {
			return false;
		}
		console.log(oModel);
		//Housekeeping
		// this.makeSAPDateTime('/Weekstart', false);
		// this.makeSAPDateTime('/Weekend', false);
		// this.makeSAPDateTime('/Begda', false);
		var path = this.getContextPath() + '/Weekstart';
		var property = oModel.getProperty(path);
		oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.getContextPath() + '/Weekend';
		property = oModel.getProperty(path);
		oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.getContextPath() + '/Begda';
		property = oModel.getProperty(path);
		oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));

		// property = oModel.getProperty(this.getContextPath() + "/Vtken");
		// if (property) {
		// 	oModel.setProperty(this.getContextPath() + "/Vtken", "X");
		// }

		property = oModel.getProperty(this.getContextPath() + "/Status");
		if (property && statusToSend) {
			oModel.setProperty(this.getContextPath() + "/Status", statusToSend);
		}

		// remove all current messages from message manager
		sap.ui.getCore().getMessageManager().removeAllMessages();

		// note that we have to specify this submission is only for deferred batch group "detailChanges"
		// otherwise all service calls get batched together and the success/error outcome is clouded
		oModel.submitChanges({
			batchGroupId: "detailChanges",
			success: $.proxy(function() {
				// TODO: until we can figure out why batching doesn't work, check for messages
				if (sap.ui.getCore().getMessageManager().getMessageModel().oData.length > 0) {
					// show odata errors in message popover
					this.showMessagePopover(this.byId("toolbar"));
					// some errors screw up the model data, whilst our context object is still intact
					this.setContextObjectToModel();
				} else {
					// raise a toast to the user!
					var msg = statusToSend === "SAV" ? "Record saved" : "Request sent";
					this.fireDetailChanged(this.getContextPath());
        			this.cleanup();
					this.getRouter().myNavBack("main");
					sap.m.MessageToast.show(msg);
				}
			}, this),
			error: $.proxy(function() {
				// show odata errors in message popover
				this.showMessagePopover(this.byId("toolbar"));
				// some errors screw up the model data, whilst our context object is still intact
				this.setContextObjectToModel();
				// var msg = 'An error occurred during the sending of the request';
				// sap.m.MessageToast.show(msg);
			}, this)
			//  success: $.proxy(this.handleSubmitSuccess, this), 
			//  error: $.proxy(this.handleSubmitError, this)
		});
	},

    handleDeleteRequest: function() {
        var oModel = this.getModel();
        oModel.setProperty(this.getContextPath() + "/Status", 'DEL');
		// remove all current messages from message manager
		sap.ui.getCore().getMessageManager().removeAllMessages();      
		oModel.submitChanges({
			batchGroupId: "detailChanges",
			success: $.proxy(function() {
				// TODO: until we can figure out why batching doesn't work, check for messages
				if (sap.ui.getCore().getMessageManager().getMessageModel().oData.length > 0) {
					// show odata errors in message popover
					this.showMessagePopover(this.byId("toolbar"));
					// some errors screw up the model data, whilst our context object is still intact
					this.setContextObjectToModel();
				} else {
					// raise a toast to the user!
					var msg = "Request Deleted";
					this.fireDetailChanged(this.getContextPath());
        			this.cleanup();
					this.getRouter().myNavBack("main");
					sap.m.MessageToast.show(msg);
				}
			}, this),
			error: $.proxy(function() {
				// show odata errors in message popover
				this.showMessagePopover(this.byId("toolbar"));
				// some errors screw up the model data, whilst our context object is still intact
				this.setContextObjectToModel();
				// var msg = 'An error occurred during the sending of the request';
				// sap.m.MessageToast.show(msg);
			}, this)
			//  success: $.proxy(this.handleSubmitSuccess, this), 
			//  error: $.proxy(this.handleSubmitError, this)
		});		
    },

	// 	handleSubmitError: function() {
	// 		var msg = 'An error occurred during the sending of the request';
	// 		sap.m.MessageToast.show(msg);
	// 	},

	// 	handleSubmitSuccess: function() {
	// 		var msg = 'Request sent';
	// 		sap.m.MessageToast.show(msg);
	// 		this.showEmptyView();
	// 	},

    setContextObjectToModel: function() {
        if (this.getContextObject() && this.getContextPath()) {
            var oModel = this.getModel();
    		oModel.setProperty(this.getContextPath(), this.getContextObject());
        }
    },
    
	showMessagePopover: function(oOpenBy) {
		// prepare message popover dialog if not yet done
		if (!this._messagePopover) {
			this._messagePopover = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.MessagePopover", this);
			this._messagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel());
		}
		// filter out messages without an actual message
		// 	var oFilter = new sap.ui.model.Filter("message", sap.ui.model.FilterOperator.NE, "");
		// 	if (this._messagePopover.getBinding("items")) {
		// 		this._messagePopover.getBinding("items").filter([oFilter]);
		// 	}
		// filter method only works in higher UI5 runtime, so take matters into our own hands...
		var aFilteredMessages = $.map(sap.ui.getCore().getMessageManager().getMessageModel().oData, function(oMessage) {
			if (oMessage.message) {
				return oMessage;
			}
		});
		sap.ui.getCore().getMessageManager().removeMessages(sap.ui.getCore().getMessageManager().getMessageModel().oData);
		sap.ui.getCore().getMessageManager().addMessages(aFilteredMessages);

		this._messagePopover.openBy(oOpenBy || this.getView());
	},

	getModel: function() {
		return sap.ui.getCore().getModel();
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},

	onExit: function(oEvent) {
		var oModel = this.getModel();
		this.getEventBus().unsubscribe("Master2", "LoadFinished", this.onMasterLoaded, this);
		// delete the created entity
		if (this.oNewDetailContext) {
			oModel.deleteCreatedEntry(this.oNewDetailContext);
		}
	}
});