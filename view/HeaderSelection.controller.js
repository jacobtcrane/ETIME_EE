sap.ui.define(['sap/ui/core/mvc/Controller','sap/ui/unified/DateRange','sap/ui/core/Fragment','com/transfieldservices/view/HeaderSummary.controller'],
	function(Controller, DateRange, HeaderSummary,Fragment) {
	"use strict";

	var CalendarDateIntervalBasicController = Controller.extend("com.transfieldservices.view.HeaderSelection", {
		oFormatYyyymmdd: null,

		onInit: function() {
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({pattern: "yyyy-MM-dd"});
			this.oEventBus = sap.ui.getCore().getEventBus();
			
			 this.oCalendar = this.getView().byId("calendar_old");
        	this.oCalendar.setWidth("300px");
        	this.oCalendar.setWeeksPerRow(1);
        	this.oCalendar.setSingleRow(true);
	
		// var oView = this.getView();
		
		// oView.bindElement("/headerSet"); 

		},
		
		handleDaySelect: function(oEvent){
			var oSelectedDate = new Date(oEvent.getParameters().date);
			var selDateStr = this.oFormatYyyymmdd.format(oSelectedDate);

			var oView = this.getView();
			// var sEntityPath = '/headerSet(Weekstart=datetime\'' + selDateStr + 'T22:00:00\',Weekend=datetime\'' + selDateStr + 'T22:00:00\')';
			// var oData = oView.getModel().getData(sEntityPath);
			
			//create new record
			// var headerSet = oModel.getProperty("/headerSet",this);
			var oNewRequest = {	Seqnr: "0", Begda: oSelectedDate , Weekstart: oSelectedDate, Weekend: oSelectedDate};
			var oModel = this.getView().getModel( "theOdataModel" );
			oModel.createEntry("/detailSet", oNewRequest);

			// create popover
			if (! this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("popover", "com.transfieldservices.view.CreateNewRequest", this);
				// this._oPopover.title = "Test";
				this.getView().addDependent(this._oPopover);
			}

				var pop = this.getView().byId("popover_id");
				pop.setTitle(selDateStr);
			// delay because addDependent will do a async rerendering and the popover will immediately close without it
			var oCalendar = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oPopover.openBy(oCalendar);
			});	
		},
		
		handleCalendarSelect: function(oEvent) {
			// var oCalendar = this.byId("calendar_old");
			 var oNewDate = this.oCalendar.getCurrentDate();
			 this.oEventBus.publish('HeaderSelection','headDateEvt',oNewDate);
		},


		// onBeforeRendering: function() {
		// 	// var enddate = this.getView().byId('calendar').getEndDate;
		// },
		onAfterRendering: function() {
			 var oNewDate = this.oCalendar.getCurrentDate();
			 this.oEventBus.publish('HeaderSelection','headDateEvt',oNewDate);
		}

	});

	return CalendarDateIntervalBasicController;

});