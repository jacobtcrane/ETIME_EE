sap.ui.define([
	"sap/ui/commons/TextView",
	"com/broadspectrum/etime/ee/utils/Conversions"
], function(TextView, Conversions) {
	"use strict";

	return sap.ui.core.mvc.Controller.extend("com.broadspectrum.etime.ee.view.HeaderSummary", {

		onInit: function() {
			this.getEventBus().subscribe("HeaderSelection", "headDateEvt", this.onDateSelected, this);
			this.getEventBus().subscribe("Detail", "Changed", this.onDetailChanged, this);

			var rejectedHoursTV = this.byId("__input3");
			rejectedHoursTV.setSemanticColor(sap.ui.commons.TextViewColor.Critical);
			rejectedHoursTV.setDesign(sap.ui.commons.TextViewDesign.H5);

			var approvedHoursTV = this.byId("__input2");
			approvedHoursTV.setSemanticColor(sap.ui.commons.TextViewColor.Positive);
			approvedHoursTV.setDesign(sap.ui.commons.TextViewDesign.H5);

			var totalhoursTV = this.byId("__input1");
			totalhoursTV.setDesign(sap.ui.commons.TextViewDesign.Standard);

			var weekTV = this.byId("__input0");
			weekTV.setDesign(sap.ui.commons.TextViewDesign.H4);

			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyy-MM-dd"
			});
		},

		onDetailChanged: function(sChannel, sEvent, oData) {
			var oModel = sap.ui.getCore().getModel();
			if (oData && oData.sEntityPath) {
				var oDetailEntity = oModel.getProperty(oData.sEntityPath);
				if (oDetailEntity && oDetailEntity.Begda) {
					this.onDateSelected("HeaderSelection", "headDateEvt", oDetailEntity.Begda);
				}
			}
		},

		onDateSelected: function(sChannel, sEvent, oDate) {
			var oStartDate = oDate instanceof Date ? oDate : new Date(oDate);
			if (!oStartDate || !(oStartDate instanceof Date)) {
				return null;
			}
			// convert to non-UTC date-only string and then instantiate a UTC date
			// as the server expects UTC for Edm.Datetime (the provided oDate will be in local timezone)
			var sStartDate = Conversions.dateFormatterISODateOnly.format(oStartDate);
			oStartDate = Conversions.dateFormatterUTC.parse(sStartDate);
			sStartDate = Conversions.dateFormatterUTC.format(oStartDate);
			sStartDate = encodeURIComponent(sStartDate);
			var sEntityPath = null;
			sEntityPath = "/headerSet(Weekstart=datetime'" + sStartDate + "',Weekend=datetime'" + sStartDate + "')";

			if (sEntityPath != null) {
				this.bindView(sEntityPath);
			}
		},

		bindView: function(sEntityPath) {
			var oView = this.getView();

			oView.bindElement(sEntityPath);

			// publish min/max dates from headerSet, when received (and different to before)
			var oBinding = oView.getElementBinding();
			this.didAttachToViewDataReceived = this.didAttachToViewDataReceived || {};
			if (!this.didAttachToViewDataReceived[sEntityPath]) {
				this.didAttachToViewDataReceived[sEntityPath] = true;
				oBinding.attachDataReceived($.proxy(function(oEvent) {
					var oHeader;
					var oData = oEvent.getParameter("data");
					if (oData && oData.results && oData.results.length) {
						// oData contains an array of results
						oHeader = oData.results[0];
					}
					if (oData &&
						(oData.Mindate || oData.Maxdate || oHeader.Weekstart || oHeader.Weekend)) {
						// oData contains a single result
						oHeader = oData;
					}
					if (oHeader && oHeader.Mindate && oHeader.Maxdate) {
						if (!this.oLastMindate || !this.oLastMaxdate) {
							this.oLastMindate = new Date();
							this.oLastMaxdate = new Date();
						}
						if (this.oLastMindate.getTime() !== oHeader.Mindate.getTime() ||
							this.oLastMaxdate.getTime() !== oHeader.Maxdate.getTime()) {
							this.oLastMindate = oHeader.Mindate;
							this.oLastMaxdate = oHeader.Maxdate;
							this.getEventBus().publish("HeaderSummary", "MinMaxDatesReceived", {
								oMindate: this.oLastMindate,
								oMaxdate: this.oLastMaxdate
							});
						}
					}
					if (oHeader && oHeader.Weekstart && oHeader.Weekend) {
						if (!this.oLastWeekstart || !this.oLastWeekend) {
							this.oLastWeekstart = new Date();
							this.oLastWeekend = new Date();
						}
						if (this.oLastWeekstart.getTime() !== oHeader.Weekstart.getTime() ||
							this.oLastWeekend.getTime() !== oHeader.Weekend.getTime()) {
							this.oLastWeekstart = oHeader.Weekstart;
							this.oLastWeekend = oHeader.Weekend;
							this.getEventBus().publish("HeaderSummary", "WorkingWeekReceived", {
								oWeekstart: this.oLastWeekstart,
								oWeekend: this.oLastWeekend
							});
						}
					}
				}, this));
			}
		},

		showEmptyView: function() {},

		getEventBus: function() {
			return sap.ui.getCore().getEventBus();
		},

		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		fireDetailChanged: function(sEntityPath) {
			this.getEventBus().publish("HeaderSummary", "Changed", {
				sEntityPath: sEntityPath
			});
		},

		fireDetailNotFound: function() {
			this.getEventBus().publish("HeaderSummary", "NotFound");
		},

		onExit: function() {

		}

	});
});