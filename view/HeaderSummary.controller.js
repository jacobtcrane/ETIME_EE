sap.ui.define([
], function() {
	"use strict";
	
	return sap.ui.core.mvc.Controller.extend("com.transfieldservices.view.HeaderSummary", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf com.transfieldservices.view.HeaderSummary
	 */
		onInit: function() {
			this.oEventBus = sap.ui.getCore().getEventBus();
			this.oEventBus.subscribe('HeaderSelection','headDateEvt',this.onDateSelected, this);
		},

		onDateSelected: function(sChannel, sEvent, oData) {
			// this.getView().byId('')
			var oComponent = this.getOwnerComponent();
			var date = oComponent.getModel('headDate');
			if(date != null){
				var sEntityPath = "/" + date;
				this.bindView(date);                         
			}
		},

	bindView : function (sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath); 

		//Check if the data is already on the client
		if(!oView.getModel().getData(sEntityPath)) {

			// Check that the entity specified was found
			oView.getElementBinding().attachEventOnce("dataReceived", jQuery.proxy(function() {
				var oData = oView.getModel().getData(sEntityPath);
				if (!oData) {
					this.showEmptyView();
					this.fireDetailNotFound();
				}
			}, this));
		}
	},
	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf com.transfieldservices.view.HeaderSummary
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf com.transfieldservices.view.HeaderSummary
	 */
		onExit: function() {
	
		}

	});
});