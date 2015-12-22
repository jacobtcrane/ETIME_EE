sap.ui.define(['sap/ui/core/mvc/Controller',
                'sap/ui/unified/DateRange',
                'sap/ui/core/Fragment',
                'com/transfieldservices/view/HeaderSummary.controller'],
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
			this.oSelectedDate = oEvent.getParameters().date;//new Date(oEvent.getParameters().date);
// 			var selDateStr = this.oFormatYyyymmdd.format(this.oSelectedDate);

			var oView = this.getView();
			// var sEntityPath = '/headerSet(Weekstart=datetime\'' + selDateStr + 'T22:00:00\',Weekend=datetime\'' + selDateStr + 'T22:00:00\')';
			// var oData = oView.getModel().getData(sEntityPath);
			
			// create popover
			if (! this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("popover", "com.transfieldservices.dialogs.CreateNewRequest", this);
				this._oPopover = sap.ui.xmlfragment("popover", "com.transfieldservices.dialogs.CreateNewRequest", this);
				this.getView().addDependent(this._oPopover);
			}
				// var pop = oView.byId("popover_id");
				// pop.setTitle(selDateStr);
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
		},
	
	    getRouter : function () {
		    return sap.ui.core.UIComponent.getRouterFor(this);
	    },
        //Attendance
        handleNewAttPress: function(oEvent){
            this._oPopover.close();
            
            this.getRouter().myNavToWithoutHash({ 
			    currentView : this.getView(),
			    targetViewName : "com.transfieldservices.view.Detail",
			    targetViewType : "XML",
			    transition: "slide"
		    });
            // If we're on a phone device, include nav in history
		    var bReplace = jQuery.device.is.phone ? false : true;
		    this.getRouter().navTo("newdetail", {
			    from: "newreq",
			    entity: this.oSelectedDate
		    }, bReplace);
// 			var oNavCon = sap.ui.core.Fragment.byId("popover", "navCon");
// 			var oDetailPage = sap.ui.core.Fragment.byId("popover", "detail");
// 			oNavCon.to(oDetailPage);
// 			oDetailPage.bindElement(this.oContext.getPath());
        },
        
        //Allowance
        handleNewAllPress: function(oEvent){
                    this._oPopover.close();
            this.getRouter().myNavToWithoutHash({ 
			    currentView : this.getView(),
			    targetViewName : "com.transfieldservices.view.AllowancesDetail",
			    targetViewType : "XML",
			    transition: "slide"
		    });
            // If we're on a phone device, include nav in history
		    var bReplace = jQuery.device.is.phone ? false : true;
		    this.getRouter().navTo("newalldetail", {
			    from: "newreq",
			    entity: this.oSelectedDate
		    }, bReplace);

        }
	});

	return CalendarDateIntervalBasicController;

});