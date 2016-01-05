jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.declare("com.broadspectrum.etime.ee.utils.Conversions");
com.broadspectrum.etime.ee.utils.Conversions = {
	time: function(value) {
		// value = 'PT08H00M00S';
		if (value) {
			var date = new Date(value.ms);
			var timeinmiliseconds = date.getTime(); //date.getTime(); //date.getSeconds(); //date.getTime();  
			var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "KK:mm a"
			});
			var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
			var timeStr = oTimeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));

			return timeStr;
		} else {
			return value;
		}
	},
	commonFieldVisibilityTrigger: function(v) {
		if (v == '' || v == null) {
			return false;
		} else {
			return true;
		}
	},
	reverseFieldVisibilityTrigger: function(v) {
		if (v == '' || v == null) {
			return true;
		} else {
			return false;
		}
	},
	TwoFieldVisibilityTrigger: function(v,w) {
		if ((v == '' || v == null) && (w == '' || w == null)) {
			return true;
		} else {
			return false;
		}
	},
	makeSAPDateTime: function(property, isTime) {
		// var path = this.oNewDetailContext.getPath() + field;
		// var property = this.oModel.getProperty(field);
		var datetime = new Date(property);
		var sapDateTime;
		if (isTime) {
			sapDateTime = this.timeFormatter.format(datetime);
		} else {
			sapDateTime = this.dateFormatter.format(datetime);
		}
		return sapDateTime;
		// this.oModel.setProperty(path, sapDateTime);
	},
	
	timeFormatter: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "PThh'H'mm'M'ss'S'"
	}),

	dateFormatter: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "yyyy-MM-ddThh:mm:ss"
	})
};