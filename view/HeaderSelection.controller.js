sap.ui.define(['sap/ui/core/mvc/Controller','sap/ui/unified/DateRange','com/transfieldservices/view/HeaderSummary.controller'],
	function(Controller, DateRange, HeaderSummary) {
	"use strict";

	var CalendarDateIntervalBasicController = Controller.extend("com.transfieldservices.view.HeaderSelection", {
		oFormatYyyymmdd: null,

		onInit: function() {
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({pattern: "yyyy-MM-dd"});
			this.oEventBus = sap.ui.getCore().getEventBus();
			
			 var oCalendar = this.getView().byId("calendar_old");
        	// oCalendar.setMonthsPerRow(1);
        	oCalendar.setWidth("300px");
        	oCalendar.setWeeksPerRow(1);
        	oCalendar.setSingleRow(true);
		},
		
		test:function(oEvent){
			var test = oEvent.oSource;	
		},
		
		handleCalendarSelect: function(oEvent) {
			var oCalendar = this.byId("calendar_old");
			// this._updateText(oCalendar);
			// var oHeaderSummary = new HeaderSummary();
			// oHeaderSummary.bindView(oCalendar.getSelectedDates()[0].startDate);
			 //var oComponent = this.getOwnerComponent();
			 //oComponent.setModel(oCalendar.getSelectedDates()[0].startDate,'headDate');
			 var oNewDate = oCalendar.getCurrentDate();
			 //var startDate = this.oFormatYyyymmdd.format(oRange[0].getStartDate());
			 //var endDate = this.oFormatYyyymmdd.format(oRange[0].getStartDate());
			 //var odataParam = 'Weekstart=datetime\'' + startDate + 'T22:00:00\',Weekend=datetime\'' + endDate + 'T22:00:00\'';
			 this.oEventBus.publish('HeaderSelection','headDateEvt',oNewDate);
			 
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
		onAfterRendering: function() {
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