sap.ui.core.mvc.Controller.extend("com.transfieldservices.view.Detail", {

	onInit : function() {
		this.oInitialLoadFinishedDeferred = jQuery.Deferred();

		if(sap.ui.Device.system.phone) {
			//Do not wait for the master2 when in mobile phone resolution
			this.oInitialLoadFinishedDeferred.resolve();
		} else {
            var oEventBus = this.getEventBus();
			oEventBus.subscribe("Master2", "LoadFinished", this.onMasterLoaded, this);
		}
		
        if (this.getRouter() != null){
		    this.getRouter().attachRouteMatched(this.onRouteMatched, this);
        }
	},

	onMasterLoaded :  function (sChannel, sEvent, oData) {
		if(oData.oListItem){
 			this.bindView(oData.oListItem.getBindingContext().getPath());
			this.oInitialLoadFinishedDeferred.resolve();
		}
	},

	onRouteMatched : function(oEvent) {
		var oParameters = oEvent.getParameters();
        var from = oParameters.name;
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function () {

			// When navigating in the Detail page, update the binding context 
			if (oParameters.name === "detail") { 
    			var sEntityPath = "/" + oParameters.arguments.entity;
    			this.bindView(sEntityPath);
			}
            else {
                return;
            }
		}, this));
		
		if ( oParameters.name === "newdetail") { 

		   	//create new record
		    var oSelectedDate = new Date(oParameters.arguments.entity);
			var oNewRequest = {	Seqnr: "0", 
			                    Atttxt: oParameters.arguments.entity,
			                    Begda: oSelectedDate, 
			                    Weekstart: oSelectedDate, 
			                    Weekend: oSelectedDate,
			                    Statustxt: "New"};
			var oModel = this.getView().getModel( "theOdataModel" );
			var oContext = oModel.createEntry("detailSet", oNewRequest);

    // 		var sEntityPath = "/" + oParameters.arguments.entity;
    // 		this.bindView(sEntityPath);
            var oView = this.getView();
		    oView.setBindingContext(oContext); 
		}
	},

	bindView : function (sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath); 

		//Check if the data is already on the client
		if(!oView.getModel().getData(sEntityPath)) {

		// Check that the entity specified was found
			var oData = oView.getModel().getData(sEntityPath);
			if (!oData) {
				this.showEmptyView();
				this.fireDetailNotFound();
			} else {
				this.fireDetailChanged(sEntityPath);
			}

		} else {
			this.fireDetailChanged(sEntityPath);
		}

	},
    
    onBeguzEntered : function(oEvent){
        var oBeguz = oEvent.getParameters().dateValue;
        var oEnduz =  this.getView().byId("enduz").getDateValue();
        oBeguz.setFullYear(1970);
        oBeguz.setMonth(0);
        oBeguz.setDate(1);
        if (oEnduz != null && oEnduz > oBeguz){
            this.getTimeDiff(oEnduz,oBeguz);
        }else{
            this.getView().byId("objectHeader").setNumber('');
        }
    },
    
    onEnduzEntered : function(oEvent){
        var oEnduz = oEvent.getParameters().dateValue;
        var oBeguz =  this.getView().byId("beguz").getDateValue();
        oEnduz.setFullYear(1970);
        oEnduz.setMonth(0);
        oEnduz.setDate(1);
        if (oBeguz != null && oEnduz > oBeguz){
            this.getTimeDiff(oEnduz,oBeguz);
        }else{
            this.getView().byId("objectHeader").setNumber('');
        }
    },
    
    getTimeDiff: function(oEnduz, oBeguz){
        var oTimeDiff = this.getView().byId("objectHeader");
            var diffTime = oEnduz.getTime() - oBeguz.getTime();
            var minutes = ((diffTime / 1000) / 60) % 60;
            var hours = (((diffTime / 1000) / 60) / 60) % 60;
            var strTime = hours + ':' + minutes + ' Hours';
            oTimeDiff.setNumber(strTime);
    },
    
	showEmptyView : function () {
		this.getRouter().myNavToWithoutHash({ 
			currentView : this.getView(),
			targetViewName : "com.transfieldservices.view.NotFound",
			targetViewType : "XML"
		});
	},

	fireDetailChanged : function (sEntityPath) {
		this.getEventBus().publish("Detail", "Changed", { sEntityPath : sEntityPath });
	},

	fireDetailNotFound : function () {
		this.getEventBus().publish("Detail", "NotFound");
	},

	onNavBack : function() {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("main");
	},

	onDetailSelect : function(oEvent) {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("detail",{
			entity : oEvent.getSource().getBindingContext().getPath().slice(1)
		}, true);
	},
	
	getEventBus : function () {
		return sap.ui.getCore().getEventBus();
	},

	getRouter : function () {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	onExit : function(oEvent){
	    this.getEventBus().unsubscribe("Master2", "LoadFinished", this.onMasterLoaded, this);
	}
});