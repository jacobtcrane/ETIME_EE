sap.ui.define(['sap/ui/core/mvc/Controller',
                'sap/ui/unified/DateRange',
                'sap/ui/core/Fragment',
                'com/broadspectrum/etime/ee/view/HeaderSummary.controller'],
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
				this.oEventBus = sap.ui.getCore().getEventBus();
				this.oEventBus.subscribe('Master', 'WorkingWeekReceived', this.handleWorkingWeekReceived, this);

				this.oCalendar = this.getView().byId("calendar");
				// this.oCalendarOld = this.getView().byId("calendar_old");
				// 			// set calendar to full width on phone, else 320px
				//     		if (sap.ui.Device.system.phone) {
				//         	    this.oCalendar.setWidth("380px");
				//     		} else {
				//         	    this.oCalendar.setWidth("320px");
				//     		}
				// 	this.oCalendar.setSingleRow(true);
				this.oCalendarLegend = this.getView().byId("calendar_legend");

				// var oView = this.getView();

				// oView.bindElement("/headerSet"); 

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
				if (!this.oSelectedDate || (this.oSelectedDate && this.oSelectedDate.getTime() !== oSelectedDate.getTime())) {
					// publish selected date if different from last
					this.oSelectedDate = oSelectedDate;
					// if (this.oCalendarOld.getSelectedDates().length) {
					//     this.oSelectedDate = new Date(this.oCalendarOld.getSelectedDates()[0];
					// } else {
					//     return;
					// }
					// 			var selDateStr = this.oFormatYyyymmdd.format(this.oSelectedDate);
					this.oEventBus.publish('HeaderSelection', 'headDateEvt', this.oSelectedDate);
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

				// var oView = this.getView();
				// var sEntityPath = '/headerSet(Weekstart=datetime\'' + selDateStr + 'T22:00:00\',Weekend=datetime\'' + selDateStr + 'T22:00:00\')';
				// var oData = oView.getModel().getData(sEntityPath);

			},

			handleWorkingWeekReceived: function(sChannel, sEvent, oData) {
				if (oData && oData.oWeekstart instanceof Date && oData.oWeekend instanceof Date) {
					// 	this.oCalendar.setStartDate(oWeekstart);    // for CalendarDateInterval
					// mark working week on calendar
					// this.oCalendar.removeAllSpecialDates();  // bug in Calendar! destroy aggregation ourselves...
					this.oCalendar.removeAllAggregation("specialDates");
					this.oCalendarLegend.removeAllItems();
					this.oCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
						tooltip: "Working week: " + this.oFormatYyyymmdd.format(oData.oWeekstart) + " to " + this.oFormatYyyymmdd.format(oData.oWeekend),
						startDate: new Date(oData.oWeekstart),
						endDate: new Date(oData.oWeekend)
					}));
					this.oCalendarLegend.addItem(new sap.ui.unified.CalendarLegendItem({
						text: "Working week"
					}));
				}
			},

			// 		handleCalendarSelect: function(oEvent) {
			// 			// var oCalendar = this.byId("calendar_old");
			// 			 var oNewDate = this.oCalendar.getCurrentDate();
			// 			 this.oEventBus.publish('HeaderSelection','headDateEvt',oNewDate);
			// 		},

			// onBeforeRendering: function() {
			// 	// var enddate = this.getView().byId('calendar').getEndDate;
			// },
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
					this.oEventBus.publish('HeaderSelection', 'headDateEvt', this.oSelectedDate);
					this.didRenderFirstTime = true;
					jQuery.sap.delayedCall(2000, this, function() {
    				    sap.m.MessageToast.show("Select a date to view timesheets entered; select again to create a new attendance or allowance...", {
    				        duration: 3000,
    				        of: this.oCalendar
    				    });
					});
				}
			},

			getRouter: function() {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},
			//Attendance
			handleNewAttPress: function(oEvent) {
				this._oPopover.close();
				this.oEventBus.publish('Any', 'BusyDialogNeeded', null); // we need to raise the busy dialog synchronous
				// the busy dialog animation does not start until the routing (and associated page loading)
				// completes, so we throw this onto the call stack for deferred execution
				setTimeout($.proxy(function() {
					this.getRouter().myNavToWithoutHash({
						currentView: this.getView(),
						targetViewName: "com.broadspectrum.etime.ee.view.Detail",
						targetViewType: "XML",
						transition: "slide"
					});
					// If we're on a phone device, include nav in history
					var bReplace = jQuery.device.is.phone ? false : true;
					this.getRouter().navTo("newdetail", {
						from: "newreq",
						entity: String(this.oSelectedDate)
					}, bReplace);
					// 			var oNavCon = sap.ui.core.Fragment.byId("popover", "navCon");
					// 			var oDetailPage = sap.ui.core.Fragment.byId("popover", "detail");
					// 			oNavCon.to(oDetailPage);
					// 			oDetailPage.bindElement(this.oContext.getPath());
					this.oEventBus.publish('Any', 'BusyDialogDone', null);
				}, this), 0);
			},

			//Allowance
			handleNewAllPress: function(oEvent) {
				this._oPopover.close();
				this.oEventBus.publish('Any', 'BusyDialogNeeded', null); // we need to raise the busy dialog synchronous
				// the busy dialog animation does not start until the routing (and associated page loading)
				// completes, so we throw this onto the call stack for deferred execution
				setTimeout($.proxy(function() {
					this.getRouter().myNavToWithoutHash({
						currentView: this.getView(),
						targetViewName: "com.broadspectrum.etime.ee.view.Detail",
						targetViewType: "XML",
						transition: "slide"
					});
					// If we're on a phone device, include nav in history
					var bReplace = jQuery.device.is.phone ? false : true;
					this.getRouter().navTo("newalldetail", {
						from: "newreq",
						entity: this.oSelectedDate
					}, bReplace);
					this.oEventBus.publish('Any', 'BusyDialogDone', null);
				}, this), 0);

			}
		});

		return CalendarDateIntervalBasicController;

	});