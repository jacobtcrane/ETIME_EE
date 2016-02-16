/*global window*/

sap.ui.controller("com.broadspectrum.etime.ee.view.Favourites", {

	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},

	getModel: function() {
		return sap.ui.getCore().getModel();
	},

	onNavBack: function() {
		this.navHistoryBack();
	},

	navHistoryBack: function() {
		window.history.go(-1);
	},

	handleDelete: function(oEvent) {
		var oItem = oEvent.getParameter("listItem");
		// after deletion put the focus back to the list
		oEvent.getSource().attachEventOnce("updateFinished", oEvent.getSource().focus, oEvent.getSource());

		var sEntityPath = oItem.getBindingContext().getPath().substr(1);
		sEntityPath = '/' + sEntityPath;
		this.getModel().remove(sEntityPath, {
			fnSuccess: function() {
				var msg = 'Favourite deleted';
				sap.m.MessageToast.show(msg);
			},
			fnError: function() {
				var msg = 'An error occurred during the deletion of the favourite';
				sap.m.MessageToast.show(msg);
			}
		});
	}

});