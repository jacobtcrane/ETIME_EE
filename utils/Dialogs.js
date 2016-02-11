jQuery.sap.declare("com.broadspectrum.etime.ee.util.Dialogs");

com.broadspectrum.etime.ee.util.Dialogs = {
	getValueHelpOperationDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpOperationDialog) {
			oController.getOwnerComponent()._valueHelpOperationDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.OperationDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpOperationDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpOperationDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpOperationDialog;
	},

	getValueHelpCauseDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpCauseDialog) {
			oController.getOwnerComponent()._valueHelpCauseDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.CauseDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpCauseDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpCauseDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpCauseDialog;
	},

	getValueHelpOrderDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpOrderDialog) {
			oController.getOwnerComponent()._valueHelpOrderDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.OrderDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpOrderDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpOrderDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpOrderDialog;
	},

	getValueHelpInternalorderDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpInternalorderDialog) {
			oController.getOwnerComponent()._valueHelpInternalorderDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.InternalorderDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpInternalorderDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpInternalorderDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpInternalorderDialog;
	},

	getValueHelpNetDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpNetDialog) {
			oController.getOwnerComponent()._valueHelpNetDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.NetworkDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpNetDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpNetDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpNetDialog;
	},

	getValueHelpWBSDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpWBSDialog) {
			oController.getOwnerComponent()._valueHelpWBSDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.WBSDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpWBSDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpWBSDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpWBSDialog;
	},

	getValueHelpAllDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpAllDialog) {
			oController.getOwnerComponent()._valueHelpAllDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.AllowanceDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpAllDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpAllDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpAllDialog;
	},

	getValueHelpAttDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpAttDialog) {
			oController.getOwnerComponent()._valueHelpAttDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.AttDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpAttDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpAttDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpAttDialog;
	},

	getValueHelpFavouritesDialog: function(oController) {
		if (!oController.getOwnerComponent()._valueHelpFavouritesDialog) {
			oController.getOwnerComponent()._valueHelpFavouritesDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.FavouritesDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._valueHelpFavouritesDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._valueHelpFavouritesDialog);
			}
		}
		return oController.getOwnerComponent()._valueHelpFavouritesDialog;
	},

	getFavSelectDialog: function(oController) {
		if (!oController.getOwnerComponent()._favSelectDialog) {
			oController.getOwnerComponent()._favSelectDialog = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.FavouriteSelectDialog", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._favSelectDialog) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._favSelectDialog);
			}
		}
		return oController.getOwnerComponent()._favSelectDialog;
	},

	getFavPopover: function(oController) {
		if (!oController.getOwnerComponent()._oFavPopover) {
			oController.getOwnerComponent()._oFavPopover = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.Favourites", oController);
			if (oController.getView().indexOfDependent(oController.getOwnerComponent()._oFavPopover) === -1) {
                oController.getView().addDependent(oController.getOwnerComponent()._oFavPopover);
			}
		}
		return oController.getOwnerComponent()._oFavPopover;
	},

	getMessagePopover: function(oController) {
		// prepare message popover dialog if not yet done
		if (!oController.getOwnerComponent()._dialogMessagePopover) {
			oController.getOwnerComponent()._dialogMessagePopover = sap.ui.xmlfragment("com.broadspectrum.etime.ee.dialogs.MessagePopover", oController);
			oController.getOwnerComponent()._dialogMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel());
		}
		var aFilteredMessages = $.map(sap.ui.getCore().getMessageManager().getMessageModel().oData, function(oMessage) {
			if (oMessage.message) {
				return oMessage;
			}
		});
		sap.ui.getCore().getMessageManager().removeMessages(sap.ui.getCore().getMessageManager().getMessageModel().oData);
		sap.ui.getCore().getMessageManager().addMessages(aFilteredMessages);
		
		return oController.getOwnerComponent()._dialogMessagePopover;
	}
};