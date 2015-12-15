sap.ui.controller("com.transfieldservices.view.Favourites", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf com.transfieldservices.view.Favourites
*/
//	onInit: function() {
//
//	},

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	onNavBack: function() {
		// This is only relevant when running on phone devices
// 		this.getRouter().myNavBack("newdetail01");
		this.getRouter().backWithoutHash(this.getView(),false);
	},
	
	handleDelete: function(oEvent) {
		this.oModel = this.getView().getModel("theOdataModel");
		var oItem = oEvent.getParameter("listItem");
		// after deletion put the focus back to the list
			oEvent.getSource().attachEventOnce("updateFinished", oEvent.getSource().focus, oEvent.getSource());
			
		var sEntityPath = oItem.getBindingContext().getPath().substr(1);
		this.oModel.remove(sEntityPath,{fnSuccess:function() {
			                                        var msg = 'Favourite deleted';
			                                        sap.m.MessageToast.show(msg);
		                                           }, 
		                                fnError:function() {
			                                        var msg = 'An error occurred during the deletion of the favourite';
			                                        sap.m.MessageToast.show(msg);
		                                }
		                                });
	}
/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf com.transfieldservices.view.Favourites
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf com.transfieldservices.view.Favourites
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf com.transfieldservices.view.Favourites
*/
//	onExit: function() {
//
//	}

});