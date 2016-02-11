sap.ui.define(["sap/ui/core/mvc/Controller",
                "sap/ui/unified/DateRange",
                "sap/ui/core/Fragment",
                "com/broadspectrum/etime/ee/view/HeaderSummary.controller"],
	function(Controller, DateRange, Fragment, HeaderSummary) {
		"use strict";

		var CalendarDateIntervalBasicController = Controller.extend("com.broadspectrum.etime.ee.view.HeaderSelection", {
			oFormatYyyymmdd: null,

			onInit: function() {
				this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
					pattern: "yyyy-MM-dd"
				});
				this.oFormatYyyymmddUTC = sap.ui.core.format.DateFormat.getInstance({
					pattern: "yyyy-MM-dd",
					UTC: true
				});
				this.getEventBus().subscribe("HeaderSummary", "WorkingWeekReceived", this.handleWorkingWeekReceived, this);
				this.getEventBus().subscribe("HeaderSummary", "MinMaxDatesReceived", this.handleMinMaxDatesReceived, this);
				this.getEventBus().subscribe("Detail", "EditingContextChanged", this.onEditingContextChanged, this);
				this.getEventBus().subscribe("Detail", "EditingDone", this.onDetailEditingDone, this);

				this.oCalendar = this.getView().byId("calendar");
				this.oCalendarLegend = this.getView().byId("calendar_legend");
			},

			handleDaySelect: function(oEvent) {
				// create new request popover
				if (!this._oPopover) {
					this._oPopover = sap.ui.xmlfragment("popover", "com.broadspectrum.etime.ee.dialogs.CreateNewRequest", this);
					this.getView().addDependent(this._oPopover);
					if (sap.ui.Device.system.phone) {
						// calendar control pushes popover out of view: raise over calendar instead
						this._oPopover.setPlacement(sap.m.PlacementType.Top);
						this._oPopover.setOffsetY(150);
					}
				}
				// this.oSelectedDate = oEvent.getParameters().date; //new Date(oEvent.getParameters().date);
				var oSelectedDate = this.oCalendar.getSelectedDates()[0].getStartDate();
				if (oSelectedDate instanceof Date && this.oMinMaxDates && (
					oSelectedDate < this.oMinMaxDates.startDate ||
					oSelectedDate > this.oMinMaxDates.endDate
				)) {
					jQuery.sap.delayedCall(0, this, function() {
						sap.m.MessageToast.show("Selected date is outside the allowed timesheet min/max dates! Please select a different date.");
					});
					return false;
				}
				if (!this.oSelectedDate || (this.oSelectedDate && this.oSelectedDate.getTime() !== oSelectedDate.getTime())) {
					// publish selected date if different from last
					this.oSelectedDate = oSelectedDate;
					this.getEventBus().publish("HeaderSelection", "headDateEvt", this.oSelectedDate);
					// if the new request popover is open, close it upon selection of a different date
					if (this._oPopover.isOpen()) {
						this._oPopover.close();
					}
				} else {
					// if a date already selected, show the new request popover upon the second press
					// if the popover is already open, close it
					// delay because addDependent will do a async rerendering and the popover will immediately close without it
					if (this._oPopover.isOpen()) {
						this._oPopover.close();
					} else {
						jQuery.sap.delayedCall(0, this, function() {
							this._oPopover.openBy(this.oCalendar);
						});
					}
				}
			},

			handleWorkingWeekReceived: function(sChannel, sEvent, oData) {
				if (oData && oData.oWeekstart instanceof Date && oData.oWeekend instanceof Date) {
					this.oWorkingWeek = {
						text: "Working week",
						tooltip: "Working week: " + this.oFormatYyyymmdd.format(oData.oWeekstart) + " to " + this.oFormatYyyymmdd.format(oData.oWeekend),
						startDate: oData.oWeekstart,
						endDate: oData.oWeekend,
						// 		type: sap.ui.unified.CalendarDayType.Type06 // green    // type is currently ignored by CalendarLegendItem, so go in sequence
						type: sap.ui.unified.CalendarDayType.Type01 // yellow
					};
					this.addSpecialDatesToCalendar();
				}
			},

			handleMinMaxDatesReceived: function(sChannel, sEvent, oData) {
				if (oData && oData.oMindate instanceof Date && oData.oMaxdate instanceof Date) {
					this.oMinMaxDates = {
						text: "Timesheet min/max",
						tooltip: "Timesheet entry min/max: " + this.oFormatYyyymmdd.format(oData.oMindate) + " to " + this.oFormatYyyymmdd.format(oData.oMaxdate),
						startDate: oData.oMindate,
						endDate: oData.oMaxdate,
						type: sap.ui.unified.CalendarDayType.Type02 // orange
					};
					this.addSpecialDatesToCalendar();
				}
			},

			addSpecialDatesToCalendar: function() {
				this.oCalendar.removeAllAggregation("specialDates");
				this.oCalendarLegend.removeAllItems();
				var oSpecialDate;
				if (this.oWorkingWeek) {
					// mark working week on calendar
					oSpecialDate = this.oWorkingWeek;
					this.oCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
						tooltip: oSpecialDate.tooltip,
						startDate: oSpecialDate.startDate,
						endDate: oSpecialDate.endDate,
						type: oSpecialDate.type
					}));
					this.oCalendarLegend.addItem(new sap.ui.unified.CalendarLegendItem({
						text: oSpecialDate.text,
						type: oSpecialDate.type
					}));
				}
				if (this.oMinMaxDates) {
					// mark min/max dates on calendar
					oSpecialDate = this.oMinMaxDates;
					this.oCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
						tooltip: oSpecialDate.tooltip,
						startDate: oSpecialDate.startDate,
						endDate: oSpecialDate.endDate,
						type: oSpecialDate.type
					}));
					this.oCalendarLegend.addItem(new sap.ui.unified.CalendarLegendItem({
						text: oSpecialDate.text,
						type: oSpecialDate.type
					}));
				}
			},

			onAfterRendering: function() {
				if (!this.didRenderFirstTime) {
					// var oNewDate = this.oCalendar.getCurrentDate();
					if (!this.oCalendar.getSelectedDates().length) {
						this.oCalendar.removeAllSelectedDates();
						var oStartDate = new Date();
						oStartDate.setHours(0, 0, 0, 0);
						this.oCalendar.addSelectedDate(new DateRange({
							startDate: oStartDate
						}));
					}
					this.oSelectedDate = this.oCalendar.getSelectedDates()[0].getStartDate();
					this.getEventBus().publish("HeaderSelection", "headDateEvt", this.oSelectedDate);
					this.didRenderFirstTime = true;
					jQuery.sap.delayedCall(2000, this, function() {
						sap.m.MessageToast.show("Select a date to view timesheets entered; select again to create a new attendance or allowance...", {
							duration: 3000,
							of: this.oCalendar
						});
					});
				}
			},

			onEditingContextChanged: function(sChannel, sEvent, oData) {
				this.sEditingContextPath = oData.editingContextPath || null;
			},

			onDetailEditingDone: function(sChannel, sEvent, oData) {
				this.sEditingContextPath = null;
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

			hasPendingChanges: function() {
				var oModel = this.getModel();
				if (oModel.hasPendingChanges() || // this seems not to cover created entries, only changes to existing entries!?
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

			//Attendance
			handleNewAttPress: function(oEvent) {
				this._oPopover.close();
				this.checkPendingChangesBeforeNav($.proxy(function() {
					this.getEventBus().publish("Any", "BusyDialogNeeded", null);
					// the busy dialog animation does not start until the routing (and associated page loading)
					// completes, so we throw this onto the call stack for deferred execution
					window.setTimeout($.proxy(function() {
						this.getRouter().navTo("attendance-create", {
							TimesheetDate: this.oFormatYyyymmdd.format(this.oSelectedDate)
						});
						this.getEventBus().publish("Any", "BusyDialogDone", null);
					}, this), 0);
				}, this));
			},

			//Allowance
			handleNewAllPress: function(oEvent) {
				this._oPopover.close();
				this.checkPendingChangesBeforeNav($.proxy(function() {
					this.getEventBus().publish("Any", "BusyDialogNeeded", null);
					// the busy dialog animation does not start until the routing (and associated page loading)
					// completes, so we throw this onto the call stack for deferred execution
					window.setTimeout($.proxy(function() {
						this.getRouter().navTo("allowance-create", {
							TimesheetDate: this.oFormatYyyymmdd.format(this.oSelectedDate)
						});
						this.getEventBus().publish("Any", "BusyDialogDone", null);
					}, this), 0);
				}, this));

			}
		});

		return CalendarDateIntervalBasicController;

	});