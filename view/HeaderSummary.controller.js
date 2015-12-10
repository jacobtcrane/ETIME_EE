sap.ui.define([
	"sap/ui/commons/TextView"
], function(TextView) {
	"use strict";
	
	return sap.ui.core.mvc.Controller.extend("com.transfieldservices.view.HeaderSummary", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf com.transfieldservices.view.HeaderSummary
	 */
		onInit: function() {
			var oDivider = this.byId("devider");
			// oDivider.setWidth("1%");
			oDivider.setHeight(sap.ui.commons.HorizontalDividerHeight.Large);
			oDivider.setType(sap.ui.commons.HorizontalDividerType.Area);
			
			this.oEventBus = sap.ui.getCore().getEventBus();
			this.oEventBus.subscribe('HeaderSelection','headDateEvt',this.onDateSelected, this);
			
			var rejectedHoursTV = this.byId("__input3");
			rejectedHoursTV.setSemanticColor(sap.ui.commons.TextViewColor.Critical);
			rejectedHoursTV.setDesign(sap.ui.commons.TextViewDesign.H5);

			var approvedHoursTV = this.byId("__input2");
			approvedHoursTV.setSemanticColor(sap.ui.commons.TextViewColor.Positive);
			approvedHoursTV.setDesign(sap.ui.commons.TextViewDesign.H5);
			
			// var panel = this.byId("panel");
			// panel.setBackgroundDesign(sap.m.BackgroundDesign.Solid); 
			
			var totalhoursTV = this.byId("__input1");
			totalhoursTV.setDesign(sap.ui.commons.TextViewDesign.Standard);

			var weekTV = this.byId("__input0");
			weekTV.setDesign(sap.ui.commons.TextViewDesign.H4);
			
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({pattern: "yyyy-MM-dd"});
		},

		onDateSelected: function(sChannel, sEvent, oData) {
			var startDate = null; var endDate = null; var sEntityPath = null; var tmpDate = null;
			startDate = new Date(oData);
			var startDateStr = this.oFormatYyyymmdd.format(startDate);

			sEntityPath = '/headerSet(Weekstart=datetime\'' + startDateStr + 'T22:00:00\',Weekend=datetime\'' + startDateStr + 'T22:00:00\')';
			// sEntityPath = '/headerSet?$filter=Weekstart le datetime\'' + startDateStr + 'T22:00:00\' and Weekend ge datetime\'' + startDateStr + 'T22:00:00\'';

			if(sEntityPath != null){
				this.bindView(sEntityPath);                         
			}
		},

	bindView : function (sEntityPath) {
		var oView = this.getView();
		
		oView.bindElement(sEntityPath); 
	},
	
	showEmptyView : function () {
	},
	
	getEventBus : function () {
		return sap.ui.getCore().getEventBus();
	},
	
	getRouter : function () {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	fireDetailChanged : function (sEntityPath) {
		this.getEventBus().publish("HeaderSummary", "Changed", { sEntityPath : sEntityPath });
	},

	fireDetailNotFound : function () {
		this.getEventBus().publish("HeaderSummary", "NotFound");
	},
	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf com.transfieldservices.view.HeaderSummary
	 */
		// onAfterRendering: function() {
	
		// },

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf com.transfieldservices.view.HeaderSummary
	 */
		onExit: function() {
	
		}

	});
});