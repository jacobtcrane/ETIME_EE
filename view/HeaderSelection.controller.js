sap.ui.define(['sap/ui/core/mvc/Controller','sap/ui/unified/DateRange','com/transfieldservices/view/HeaderSummary.controller'],
	function(Controller, DateRange, HeaderSummary) {
	"use strict";

	var CalendarDateIntervalBasicController = Controller.extend("com.transfieldservices.view.HeaderSelection", {
		oFormatYyyymmdd: null,

		onInit: function() {
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({pattern: "yyyy-MM-dd"});
			this.oEventBus = sap.ui.getCore().getEventBus();
		},

		handleCalendarSelect: function(oEvent) {
			var oCalendar = oEvent.oSource;
			// this._updateText(oCalendar);
			// var oHeaderSummary = new HeaderSummary();
			// oHeaderSummary.bindView(oCalendar.getSelectedDates()[0].startDate);
			 var oComponent = this.getOwnerComponent();
			 oComponent.setModel(oCalendar.getSelectedDates()[0].startDate,'headDate');
			 var odataParam = '{ startdate:"'+ oCalendar.getSelectedDates() +'"}';
			 this.oEventBus.publish('HeaderSelection','headDateEvt',odataParam);
			 
		},

		_updateText: function(oCalendar) {
			var oText = this.getView().byId("selectedDate");
			var aSelectedDates = oCalendar.getSelectedDates();
			var oDate;
			if (aSelectedDates.length > 0 ) {
				oDate = aSelectedDates[0].getStartDate();
				oText.setText(this.oFormatYyyymmdd.format(oDate));
			} else {
				oText.setValue("No Date Selected");
			}
		},
		
		onBeforeRendering: function() {
			// var enddate = this.getView().byId('calendar').getEndDate;
		},

		handleSelectToday: function(oEvent) {
			var oCalendar = this.getView().byId("calendar");
			oCalendar.removeAllSelectedDates();
			oCalendar.addSelectedDate(new DateRange({startDate: new Date()}));
			this._updateText(oCalendar);
		}
	});

	return CalendarDateIntervalBasicController;

});