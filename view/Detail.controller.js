// stop ESLint complaining about global namspaces "com", "window", etc.
/*global com*/
/*global window*/

jQuery.sap.require("com.broadspectrum.etime.ee.utils.Conversions");
jQuery.sap.require("com.broadspectrum.etime.ee.utils.Dialogs");
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

		// 		this.getEventBus().subscribe("Master2", "ItemSelected", this.onMasterItemSelected, this);

		if (this.getRouter() != null) {
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		}
		this.oRoutingParams = {};
	},

	// 	onMasterItemSelected: function(sChannel, sEvent, oData) {
	// 		if (oData.oBindingContext) {
	// 			var oModel = this.getModel();
	// 			var oDetailEntity = oModel.getProperty(oData.oBindingContext.getPath());
	// 			// update the view's binding context based on the master item selection
	// 			if (oDetailEntity) {
	// 				if (this.formatEntityDates(oDetailEntity)) {
	// 					oModel.setProperty(oData.oBindingContext.getPath(), oDetailEntity);
	// 				}
	// 				this.getView().setBindingContext(oData.oBindingContext);
	// 				this.addModelChangeListener();
	// 			} else {
	// 				this.showEmptyView();
	// 				this.fireDetailNotFound();
	// 			}
	// 		} else {
	// 			this.showEmptyView();
	// 			this.fireDetailNotFound();
	// 		}
	// 	},

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
		var isAllowance = false;

		// 		var from = oParameters.name;
		// jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function() {

		// When navigating in the Detail page, update the binding context
		if (oParameters.name === "attendance" ||
			oParameters.name === "allowance") {
			isAllowance = oParameters.name === "allowance" ? true : false;
			// extract routing parameters
			if (oParameters.arguments.OverviewEntity &&
				oParameters.arguments.DetailEntity) {
				this.oRoutingParams.OverviewEntity = oParameters.arguments.OverviewEntity;
				this.oRoutingParams.DetailEntity = oParameters.arguments.DetailEntity;
			} else {
				this.getRouter().navTo("notfound", {}, true); // don't create a history entry
				return;
			}
			this.bindView("/" + this.oRoutingParams.DetailEntity);

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
			// reset value state for all input controls
			this.resetFormElementValueState();
			// hide favourites panel and button
			this.getView().byId("favPanel").setVisible(false);
			this.getView().byId("favButton").setVisible(false);
			// } else {	// With the commenting of the `jQuery.when` promise above, this return block exits the route matching, affecting the handling of other routes...
			// 	return;
			if (isAllowance) {
				this.setupAllowanceDetail();
			} else {
				this.setupAttendanceDetail();
			}

		}
		// }, this));

		if (oParameters.name === "attendance-create" ||
			oParameters.name === "attendance-create-today" ||
			oParameters.name === "allowance-create" ||
			oParameters.name === "allowance-create-today") {
			isAllowance = String(oParameters.name).search("allowance-create") > -1 ? true : false;

			this.isNew = true;

			// extract routing parameters
			if (oParameters.arguments.TimesheetDate) {
				this.oRoutingParams.TimesheetDate = oParameters.arguments.TimesheetDate;
			} else {
				this.oRoutingParams.TimesheetDate = String(new Date());
			}

			//remove any existing view bindings
			// 			this.getView().unbindElement();
			// remove any unsaved new detail entities from the model
			if (this.oNewDetailContext) {
				oModel.deleteCreatedEntry(this.oNewDetailContext);
			}
			//create new record
			var oSelectedDate = new Date(this.oRoutingParams.TimesheetDate);
			// 			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			// 			oModel.refreshMetadata();
			// check model metadata has been loaded before attempting to create new entry
			// (for in case the page was loaded from a bookmark)
			oModel.oMetadata.loaded().then($.proxy(function() {
				this.oNewDetailContext = oModel.createEntry("detailSet", {
					batchGroupId: "detailChanges",
					properties: this.prepareNewDetailEntity(oSelectedDate, isAllowance)
				});
				this.getView().setBindingContext(this.oNewDetailContext);
				// show initial time difference
				this.displayTimeDif();
			}, this)).catch(function(error) {
				jQuery.sap.log.error("Error loading model metadata: " + error);
			});
			// 			this.oDetailEntity = this.oNewDetailContext.getProperty();
			// 			this.detailEntityPath = this.oNewDetailContext.getPath();
			// 			this.bindView();

			// reset value state for all input controls
			this.resetFormElementValueState();
			// show favourites panel and button
			this.getView().byId("favPanel").setVisible(true);
			this.getView().byId("favButton").setVisible(true);
			// reset favourites switch
			// 			this.getView().byId("favSwitch").setState(false);
			this.getView().byId("loadFavButton").setPressed(false);
			if (isAllowance) {
				this.setupAllowanceDetail();
			} else {
				this.setupAttendanceDetail();
			}
		} else {
			this.isNew = false;
		}
	},

	bindView: function(sContextPath) {
		if (sContextPath) {
			var oModel = this.getModel();
			var oDetailEntity = oModel.getProperty(sContextPath);
			// update the view's binding context
			if (oDetailEntity) {
				if (this.formatEntityDates(oDetailEntity)) {
					oModel.setProperty(sContextPath, oDetailEntity);
				}
				this.getView().bindElement(sContextPath);
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

	prepareNewDetailEntity: function(oSelectedDate, isAllowance) {
		// var oNow = new Date();
		// oNow.setMinutes(0, 0, 0);
		// var oNextHour = new Date(oNow);
		// oNextHour.setHours(oNow.getHours() + 1);
		// var sBeguz = com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(oNow, true);
		// var sEnduz = com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(oNextHour, true);
		return {
			Acttyp: "",
			Anzhl: "0.00",
			Atttxt: "",
			Awart: "",
			Awarttxt: "",
			Begda: oSelectedDate,
			// 			Beguz: sBeguz, //"PT00H00M00S",
			Beguz: "PT09H00M00S",
			Costtxt: "",
			Durationtxt: "",
			// 			Enduz: sEnduz, //"PT00H00M00S",
			Enduz: "PT17H00M00S",
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
		};
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
				this.oBinding.destroy(); // clean up existing binding and event handlers
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

	displayTimeDif: function() {
		var Durationtxt = "";
		var Timetxt = "";
		// the DateTime control will (in Time mode) internally set the date part to now in the local timezone
		// when changing the time whilst the date part set from raw format (PT00H00M00S) is 1970 in AEST
		// this results in expected differences when subtracting one date from the other due to daylight savings
		// and other timezone issues
		// as a result we construct new dates from just the time portion before comparing,
		// instead of using the DateTime control's getDateValue() method
		var sBeguz = this.byId("beguz").getValue();
		var sEnduz = this.byId("enduz").getValue();
		var begda = com.broadspectrum.etime.ee.utils.Conversions.timeFormatter.parse(sBeguz);
		var endda = com.broadspectrum.etime.ee.utils.Conversions.timeFormatter.parse(sEnduz);
		if (endda instanceof Date || begda instanceof Date) {
			if (begda instanceof Date) {
				begda.setDate(3);
			}
			if (endda instanceof Date) {
				endda.setDate(3);
			}
			var oTimeFormatter = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "HH':'mm"
			});
			Timetxt = (begda instanceof Date ? oTimeFormatter.format(begda) : "?") +
				"-" + (endda instanceof Date ? oTimeFormatter.format(endda) : "?");
			if (endda instanceof Date &&
				begda instanceof Date) {
				if (endda > begda) {
					Durationtxt = Number((endda - begda) / 1000 / 60 / 60).toFixed(2);
				} else {
					// if start later than end time, interpret it as being the day before
					begda.setDate(2);
					Durationtxt = Number((endda - begda) / 1000 / 60 / 60).toFixed(2);
				}
			}
		}
		// now set the formatted duration and time difference texts to the model
		this.getModel().setProperty(this.getContextPath() + "/Timetxt", Timetxt);
		this.getModel().setProperty(this.getContextPath() + "/Durationtxt", Durationtxt);
	},

	onBeguzEntered: function(oEvent) {
		this.displayTimeDif();
		if (oEvent.getParameters().dateValue) {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
		} else {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Warning);
		}
	},

	onEnduzEntered: function(oEvent) {
		this.displayTimeDif();
		if (oEvent.getParameters().dateValue) {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
			// Remove check to accomodate time extending after midnight
			// this.checkEndTimeAfterStart();
		} else {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Warning);
		}
	},

	checkEndTimeAfterStart: function() {
		"use strict";
		var sBeguz = this.byId("beguz").getValue();
		var sEnduz = this.byId("enduz").getValue();
		var begda = com.broadspectrum.etime.ee.utils.Conversions.timeFormatter.parse(sBeguz);
		var endda = com.broadspectrum.etime.ee.utils.Conversions.timeFormatter.parse(sEnduz);

		if (begda && endda &&
			begda > endda
		) {
			this.byId("enduz").setValueState(sap.ui.core.ValueState.Error);
			this.byId("enduz").setValueStateText("End time must be later than start time!");
			return false;
		} else {
			return true;
		}
	},

	onQuantityEntered: function(oEvent) {
		var oQuantity = oEvent.getParameters().value;
		if (oQuantity < 0) {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
		} else {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
			oEvent.getSource().setValueStateText("Only positive numbers are allowed");
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
		this.getRouter().navTo("notfound", {}, true); // don't create a history entry
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
						this.navHistoryBack();
					}
				}, this)
			});
		} else {
			this.cleanup();
			this.navHistoryBack();
		}
	},

	navHistoryBack: function() {
		window.history.go(-1);
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

	// 	handleLiveSearch: function(oEvent) {
	// 		var sInputValue = oEvent.getSource().getValue();
	// 		if (sInputValue.length > 2) {
	// 			this.handleValueHelp(oEvent);
	// 		}
	// 	},

	handleLiveChange: function(oEvent) {
		// 		// check mutually exclusive inputs are not being maintained
		// 		// (only one of wbs/network/order or internal order can be entered)
		// 		var hasConflicts = false;
		// 		var hasWbs = this.byId("wbsInput").getValue() ? true : false;
		// 		var hasNetwork = this.byId("netInput").getValue() ? true : false;
		// 		var hasOrder = this.byId("orderInput").getValue() ? true : false;
		// 		var hasInternalOrder = this.byId("internalorderInput").getValue() ? true : false;

		// 		if (oEvent.getSource().getId().search("wbsInput") > -1 && (
		// 			hasNetwork || hasOrder || hasInternalOrder
		// 		)) {
		// 			hasConflicts = true;
		// 		} else if (oEvent.getSource().getId().search("netInput") > -1 && (
		// 			hasWbs || hasOrder || hasInternalOrder
		// 		)) {
		// 			hasConflicts = true;
		// 		} else if (oEvent.getSource().getId().search("internalorderInput") > -1 && (
		// 			hasWbs || hasNetwork || hasOrder
		// 		)) {
		// 			hasConflicts = true;
		// 		} else if (oEvent.getSource().getId().search("orderInput") > -1 && (
		// 			hasWbs || hasNetwork || hasInternalOrder
		// 		)) {
		// 			hasConflicts = true;
		// 		}
		// 		if (hasConflicts) {
		// 			sap.m.MessageBox.show(
		// 				"Only one cost assignment (WBS Element/Network/Order/Internal Order) is allowed\nRemove one before choosing another...",
		// 				sap.m.MessageBox.Icon.ERROR,
		// 				"Multiple cost assignments", [sap.m.MessageBox.Action.CANCEL]
		// 			);
		// 			oEvent.getSource().setValue(null);
		// 			return false;
		// 		}

		// clear the existing description on input changes
		oEvent.getSource().setDescription(null);
		// clear operation if changing network/order
		if (oEvent.getSource().getId().search("netInput") > -1 ||
			(oEvent.getSource().getId().search("orderInput") > -1 && oEvent.getSource().getId().search("internalorderInput") === -1)) {
			this.byId("operationInput").setValue(null);
			this.byId("operationInput").setDescription(null);
		}
		// clear cause if changing order
		if ((oEvent.getSource().getId().search("orderInput") > -1 && oEvent.getSource().getId().search("internalorderInput") === -1)) {
			this.byId("causeInput").setValue(null);
			this.byId("causeInput").setDescription(null);
		}
	},

	handleInputChange: function(oEvent) {
		"use strict";
		// register control with message manager
		sap.ui.getCore().getMessageManager().registerObject(oEvent.getSource(), true);
		if (!oEvent.getSource().getDescription()) {
			var sValue = oEvent.getParameter("value");
			if (oEvent.getSource().getId().search("attendanceInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Awart", "Atext");
			} else if (oEvent.getSource().getId().search("allowanceInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Lgart", "Lgtxt");
			} else if (oEvent.getSource().getId().search("wbsInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Posid", "Post1");
			} else if (oEvent.getSource().getId().search("netInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Aufnr", "Ktext");
			} else if (oEvent.getSource().getId().search("internalorderInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Aufnr", "Ktext");
			} else if (oEvent.getSource().getId().search("orderInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Aufnr", "Ktext");
			} else if (oEvent.getSource().getId().search("causeInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Grund", "Grdtx");
			} else if (oEvent.getSource().getId().search("operationInput") > -1) {
				this.filterSuggestionItems(oEvent.getSource(), sValue, true, "Vornr", "Ltxa1");
			}
		} else {
			this.checkInputIsValid(oEvent.getSource());
		}
	},

	checkInputIsValid: function(oSource) {
		"use strict";
		if (!oSource.getValue()) {
			oSource.setValueState(sap.ui.core.ValueState.None);
			return true;
		} else {
			if (!oSource.getDescription()) {
				var msg = "Invalid entry: please check your input or use the value help!";
				oSource.setValueStateText(msg);
				oSource.setValueState(sap.ui.core.ValueState.Error);
				return false;
			} else {
				oSource.setValueState(sap.ui.core.ValueState.Success);
			}
		}
	},

	filterSuggestionItems: function(oSource, filterValue, filterValueIsKey, filterPath, dataField) {
		"use strict";
		// ensure the suggestionItems aggregation is bound
		this.bindSuggestionItems(oSource);
		if (filterValueIsKey) {
			oSource.setValue(filterValue);
		} else {
			oSource.setDescription(filterValue);
		}
		var oFilter, sAufnr;
		if (oSource.getId().search("operationInput") > -1) {
			// for operation input, add network/order as additional filter
			sAufnr = this.byId("netInput").getValue() ? this.byId("netInput").getValue() : this.byId("orderInput").getValue();
			sAufnr = sAufnr || "00000000";
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, sAufnr),
                    new sap.ui.model.Filter(filterPath, sap.ui.model.FilterOperator.EQ, filterValue)
                ],
				and: true
			});
		} else if (oSource.getId().search("causeInput") > -1) {
			// for cause input, add order as additional filter
			sAufnr = this.byId("orderInput").getValue() || "00000000";
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, sAufnr),
                    new sap.ui.model.Filter(filterPath, sap.ui.model.FilterOperator.EQ, filterValue)
                ],
				and: true
			});
		} else {
			oFilter = new sap.ui.model.Filter(filterPath, sap.ui.model.FilterOperator.EQ, filterValue);
		}

		var suggestionItemsBinding = oSource.getBinding("suggestionItems");
		if (suggestionItemsBinding) {
			// attach handler to the filter's DataReceived event to update the input field value
			var onSuggestionItemBindingDataReceived = function(oDataReceivedEvent) {
				// detach handler once we've received results for our filter
				// note that we may receive on false hit for the initial aggregation binding, which we ignore
				var data = oDataReceivedEvent.getParameter("data");
				if (data) {
					suggestionItemsBinding.detachDataReceived(onSuggestionItemBindingDataReceived, this);
					if (data.results && data.results.length === 1) {
						if (filterValueIsKey) {
							oSource.setDescription(data.results[0][dataField]);
						} else {
							oSource.setValue(data.results[0][dataField]);
						}
					}
					this.checkInputIsValid(oSource);
				}
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
		var oFavPopover = com.broadspectrum.etime.ee.util.Dialogs.getFavPopover(this);
		// delay because addDependent will do a async rerendering and the popover will immediately close without it
		var oFavButton = oEvent.getSource();
		jQuery.sap.delayedCall(0, this, function() {
			oFavPopover.openBy(oFavButton);
		});
	},

	handleManageFavs: function(oEvent) { //Launches Manage Favourites View
		var oFavPopover = com.broadspectrum.etime.ee.util.Dialogs.getFavPopover(this);
		oFavPopover.close();
		this.getRouter().navTo("favourites");
	},

	handleAddFav: function(oEvent) { //Adds the Screen content as Faourite
		var oModel = this.getModel();
		var oDetailEntity = this.getContextObject();
		var oFavPopover = com.broadspectrum.etime.ee.util.Dialogs.getFavPopover(this);
		var aElements = oFavPopover.findElements(true);
		var favouriteName;
		for (var i = 0; i < aElements.length; i++) {
			if (aElements[i].getId().search("favname_id") > -1) {
				var oSource = aElements[i];
				favouriteName = oSource.getValue();
				if (!favouriteName) {
					var msg = "Please provide a name for your favourite!";
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
		oFavPopover.close();
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
		// 		if (this.oNewDetailContext) {
		// 			//remove the new detail entity from the model as we don't want to save that yet
		// 			oModel.deleteCreatedEntry(this.oNewDetailContext);
		// 		}
		// //Reset the model to avoid calling detail updates here		
		// // 		oModel.resetChanges();
		// 		oModel.createEntry("favTableSet", oNewFavEntity);
		// 		oModel.submitChanges(function() {
		// 			var msg = 'Favourite Added';
		// 			sap.m.MessageToast.show(msg);
		// 		}, function() {
		// 			var msg = 'An error occurred during the adding of the favourite';
		// 			sap.m.MessageToast.show(msg);
		// 		});
		// 		if (this.oNewDetailContext) {
		// 			// now recreate the new detail entity on the model
		// 			this.oNewDetailContext = oModel.createEntry("detailSet", oDetailEntity);
		// 			this.getView().setBindingContext(this.oNewDetailContext);
		// 		}
		// post new favourite to service
		oModel.create("/favTableSet", oNewFavEntity, {
			success: function(oData, response) {
				sap.m.MessageToast.show("Favourite added");
			},
			error: function(oError) {
				sap.m.MessageToast.show("An error occurred during the adding of the favourite");
			}
		});

	},

	handleFavSelect: function(oEvent) { //Generates Popover Search Help for selecting a favourite to populate from
		// 		var switchVal = oEvent.getSource().getState();
		var switchVal = oEvent.getSource().getPressed();
		var oFavSelectDialog = com.broadspectrum.etime.ee.util.Dialogs.getFavSelectDialog(this);
		var oDetailEntity = this.getContextObject();
		var oFilter = new sap.ui.model.Filter("Lgart", oDetailEntity.isAllowance ? sap.ui.model.FilterOperator.NE : sap.ui.model.FilterOperator.EQ,
			"");
		oFavSelectDialog.getBinding("items").filter([oFilter]);
		if (switchVal) {
			oFavSelectDialog.open();
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
			this.filterSuggestionItems(this.getView().byId("internalorderInput"), oFavEntity.Iaufnr, true, "Aufnr", "Ktext");
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
					key: "{Lgart}",
					text: "{Lgtxt}",
					additionalText: "{Lgart}"
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
		} else if (oSource.getId().search("internalorderInput") > -1) {
			if (!oSource.getBinding("suggestionItems")) {
				// create binding to relevant service entityset if none assigned yet
				oSource.bindAggregation("suggestionItems", "/VH_internalorderSet", new sap.ui.core.ListItem({
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
		}
	},

	handleSuggest: function(evt) {
		// 		var oSource = evt.getSource();
		// 		// start by clearing the existing description
		// 		oSource.setDescription(null);
		// 		// ensure the suggestionItems aggregation is bound
		// 		this.bindSuggestionItems(evt.getSource());
		// 		var sValue = evt.getParameter("suggestValue");
		// 		var oFilter;
		// 		if (oSource.getId().search("attendanceInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("allowanceInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("wbsInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("netInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("internalorderInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Iaufnr", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("orderInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("causeInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Grund", sap.ui.model.FilterOperator.Contains, sValue);
		// 		} else if (oSource.getId().search("operationInput") > -1) {
		// 			oFilter = new sap.ui.model.Filter("Vornr", sap.ui.model.FilterOperator.Contains, sValue);
		// 		}
		// 		var suggestionItemsBinding = oSource.getBinding("suggestionItems");
		// 		if (suggestionItemsBinding) {
		// 			// set the control as busy until we've received data for the filter
		// 			oSource.setBusy(true);
		// 			var onFilterDataReceived = function() {
		// 				suggestionItemsBinding.detachDataReceived(onFilterDataReceived, this);
		// 				oSource.setBusy(false);
		// 			};
		// 			suggestionItemsBinding.attachDataReceived(onFilterDataReceived, this);
		// 			// apply the filter
		// 			suggestionItemsBinding.filter([oFilter]);
		// 		}
	},

	handleSuggestionSel: function(oEvent) {
		// 		// this.handleValueHelp(oEvent);
		// 		var selectedItem = oEvent.getParameter("selectedItem");
		// 		if (selectedItem) {
		// 			oEvent.getSource().setDescription(selectedItem.getKey());
		// 			this.checkInputIsValid(oEvent.getSource());
		// 		}
	},

	handleValueHelp: function(oEvent) {
		// 		var oModel = this.getModel();
		var oDetailEntity = this.getContextObject();
		var sInputValue = oEvent.getSource().getValue();
		var source = oEvent.getSource().getId();
		var oFilter, sAufnr;
		this.inputId = oEvent.getSource().getId();
		// create value help dialog
		if (source.search("favouriteDD") > -1) {
			var oValueHelpFavouritesDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpFavouritesDialog(this);
			oFilter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sInputValue);
			oValueHelpFavouritesDialog.getBinding("items").filter([oFilter]);
			oValueHelpFavouritesDialog.open(sInputValue);
		} else if (source.search("attendanceInput") > -1) {
			var oValueHelpAttDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpAttDialog(this);
			// filter on both date and text
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sInputValue),
                    new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.LE, oDetailEntity.Begda)
                ],
				and: true
			});
			oValueHelpAttDialog.getBinding("items").filter([oFilter]);
			oValueHelpAttDialog.open(sInputValue);
		} else if (source.search("allowanceInput") > -1) {
			var oValueHelpAllDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpAllDialog(this);
			// filter on both date and text
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sInputValue),
                    new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.LE, oDetailEntity.Begda)
                ],
				and: true
			});
			oValueHelpAllDialog.getBinding("items").filter([oFilter]);
			oValueHelpAllDialog.open(sInputValue);
		} else if (source.search("wbsInput") > -1) {
			var oValueHelpWBSDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpWBSDialog(this);
			oFilter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sInputValue);
			oValueHelpWBSDialog.getBinding("items").filter([oFilter]);
			oValueHelpWBSDialog.open(sInputValue);
		} else if (source.search("netInput") > -1) {
			var oValueHelpNetDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpNetDialog(this);
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
			oValueHelpNetDialog.getBinding("items").filter([oFilter]);
			oValueHelpNetDialog.open(sInputValue);
		} else if (source.search("internalorderInput") > -1) {
			var oValueHelpInternalorderDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpInternalorderDialog(this);
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
			oValueHelpInternalorderDialog.getBinding("items").filter([oFilter]);
			oValueHelpInternalorderDialog.open(sInputValue);
		} else if (source.search("orderInput") > -1) {
			var oValueHelpOrderDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpOrderDialog(this);
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sInputValue);
			oValueHelpOrderDialog.getBinding("items").filter([oFilter]);
			oValueHelpOrderDialog.open(sInputValue);
		} else if (source.search("causeInput") > -1) {
			var oValueHelpCauseDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpCauseDialog(this);
			// include order number in filter
			sAufnr = this.byId("orderInput").getValue() || "00000000";
			// 			oFilter = new sap.ui.model.Filter({
			// 				filters: [
			//                     new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, sAufnr),
			//                     new sap.ui.model.Filter("Grdtx", sap.ui.model.FilterOperator.Contains, sInputValue)
			//                 ],
			// 				and: true
			// 			});
			oFilter = new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, sAufnr);
			oValueHelpCauseDialog.getBinding("items").filter([oFilter]);
			oValueHelpCauseDialog.open(sInputValue);
		} else if (source.search("operationInput") > -1) {
			var oValueHelpOperationDialog = com.broadspectrum.etime.ee.util.Dialogs.getValueHelpOperationDialog(this);
			// include network/order number in filter
			sAufnr = this.byId("netInput").getValue() ? this.byId("netInput").getValue() : this.byId("orderInput").getValue();
			sAufnr = sAufnr || "00000000";
			oFilter = new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, sAufnr);
			oValueHelpOperationDialog.getBinding("items").filter([oFilter]);
			oValueHelpOperationDialog.open(sInputValue);
		}
	},

	_handleValueHelpSearch: function(evt) {
		var sValue = evt.getParameter("value");
		var oDetailEntity = this.getContextObject();
		var oFilter;
		if (evt.getSource().getId().search("AttDialog") > -1) {
			// filter on both date and text
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Atext", sap.ui.model.FilterOperator.Contains, sValue),
                    new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.LE, oDetailEntity.Begda)
                ],
				and: true
			});
		} else if (evt.getSource().getId().search("AllowanceDialog") > -1) {
			// filter on both date and text
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Lgtxt", sap.ui.model.FilterOperator.Contains, sValue),
                    new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.LE, oDetailEntity.Begda)
                ],
				and: true
			});
		} else if (evt.getSource().getId().search("WBSDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Post1", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("NetDialog") > -1 || evt.getSource().getId().search("OrderDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("FavouritesDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("CauseDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Grdtx", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("OperationDialog") > -1) {
			// include network/order number in filter
			var sAufnr = this.byId("netInput").getValue() ? this.byId("netInput").getValue() : this.byId("orderInput").getValue();
			sAufnr = sAufnr || "00000000";
			oFilter = new sap.ui.model.Filter({
				filters: [
                    new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, sAufnr),
                    new sap.ui.model.Filter("Ltxa1", sap.ui.model.FilterOperator.Contains, sValue)
                ],
				and: true
			});
		} else if (evt.getSource().getId().search("InternalorderDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		} else if (evt.getSource().getId().search("OrderDialog") > -1) {
			oFilter = new sap.ui.model.Filter("Ktext", sap.ui.model.FilterOperator.Contains, sValue);
		}

		if (evt.getSource().getBinding("items")) {
			evt.getSource().getBinding("items").filter([oFilter]);
		}
	},

	_handleValueHelpClose: function(evt) {
		var oSelectedItem = evt.getParameter("selectedItem");
		if (oSelectedItem) {
			var inputDD = this.getView().byId(this.inputId);
			inputDD.setValue(oSelectedItem.getValue());
			inputDD.setDescription(oSelectedItem.getLabel());
			this.checkInputIsValid(inputDD);

			// clear operation if changing network/order
			if (this.inputId.search("netInput") > -1 ||
				(this.inputId.search("orderInput") > -1 && this.inputId.search("internalorderInput") === -1)) {
				this.byId("operationInput").setValue(null);
				this.byId("operationInput").setDescription(null);
			}
			// clear cause if changing order
			if ((this.inputId.search("orderInput") > -1 && this.inputId.search("internalorderInput") === -1)) {
				this.byId("causeInput").setValue(null);
				this.byId("causeInput").setDescription(null);
			}

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
		if (this.isNew) {
			this.sendRequest("SVN"); // send as status "Saved"
		} else {
			this.sendRequest("SAV"); // send as status "Saved"
		}
	},

	handleSendRequest: function() {
		if (this.isNew) {
			this.sendRequest("SBN"); // send as status "Submitted"
		} else {
			this.sendRequest("SUB"); // send as status "Submitted"
		}
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
					source: this.byId("allowanceInput"),
					msg: "Allowance type is required"
				});
			}
			// 			if (!this.byId("quantity").getValue()) {
			// 				aRequiredFields.push({
			// 					source: this.byId("quantity"),
			// 					msg: "Allowance quantity is required"
			// 				});
			// 			}
			var quant = this.byId("quantity").getValue();
			if (quant === null || Number(quant) <= 0) {
				aRequiredFields.push({
					source: this.byId("quantity"),
					msg: "Allowance quantity is required"
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
		// Remove check to accomodate time extending after midnight
		// 		if (oDetailEntity.isAttendance) {
		// 			if (!this.checkEndTimeAfterStart()) {
		// 				isValidated = false;
		// 			}
		// 		}
		// check a cost assignment has been provided
		var hasWbs = this.byId("wbsInput").getValue() ? true : false;
		var hasNetwork = this.byId("netInput").getValue() ? true : false;
		var hasOperation = this.byId("operationInput").getValue() ? true : false;
		var hasOrder = this.byId("orderInput").getValue() ? true : false;
		var hasInternalOrder = this.byId("internalorderInput").getValue() ? true : false;
		if (oDetailEntity.isAttendance) {
			if (!hasWbs && !hasNetwork && !hasOrder && !hasInternalOrder) {
				var msg = "Cost assignment (one of WBS Element/Network/Order or Internal Order) is required";
				this.byId("wbsInput").setValueStateText(msg);
				this.byId("wbsInput").setValueState(sap.ui.core.ValueState.Warning);
				isValidated = false;
			}
		}
		//check Operation is entered for network
		if (hasNetwork === true && hasOperation === false) {
			var msg2 = "Operation is required when entering a Network";
			this.byId("operationInput").setValueStateText(msg2);
			this.byId("operationInput").setValueState(sap.ui.core.ValueState.Error);
			isValidated = false;
		}
		//check Operation is entered for Order
		if (hasOrder === true && hasOperation === false) {
			var msg3 = "Operation is required when entering a Work Order";
			this.byId("operationInput").setValueStateText(msg3);
			this.byId("operationInput").setValueState(sap.ui.core.ValueState.Error);
			isValidated = false;
		}

		return isValidated;
	},

	sendRequest: function(statusToSend) {
		var oModel = this.getModel();
		if ((statusToSend === "SUB" || statusToSend === "SBN") && // validate upon submit (not save)
			!this.validateRequiredFields()) {
			return false;
		}
		//Housekeeping
		// this.makeSAPDateTime('/Weekstart', false);
		// this.makeSAPDateTime('/Weekend', false);
		// this.makeSAPDateTime('/Begda', false);
		var path = this.getContextPath() + "/Weekstart";
		var property = oModel.getProperty(path);
		oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.getContextPath() + "/Weekend";
		property = oModel.getProperty(path);
		oModel.setProperty(path, com.broadspectrum.etime.ee.utils.Conversions.makeSAPDateTime(property, false));
		path = this.getContextPath() + "/Begda";
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
					oModel.setProperty(this.getContextPath() + "/Status", "NEW");
					// show odata errors in message popover
					this.showMessagePopover(this.byId("toolbar"));
					// some errors screw up the model data, whilst our context object is still intact
					this.setContextObjectToModel();
				} else {
					// raise a toast to the user!
					var msg = statusToSend === "SAV" ? "Record saved" : "Request sent";
					this.fireDetailChanged(this.getContextPath());
					this.cleanup();
					// 			var model = this.getModel();
					// 			model.clearBatch();
					oModel.resetChanges();
					this.navHistoryBack();
					sap.m.MessageToast.show(msg);
				}
			}, this),
			error: $.proxy(function() {
				oModel.setProperty(this.getContextPath() + "/Status", "NEW");
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
		oModel.setProperty(this.getContextPath() + "/Status", "DEL");
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
					oModel.resetChanges();
					this.navHistoryBack();
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
		var oMessagePopover = com.broadspectrum.etime.ee.util.Dialogs.getMessagePopover(this);
		oMessagePopover.openBy(oOpenBy || this.getView());
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