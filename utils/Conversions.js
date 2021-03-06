// stop ESLint complaining about global namspaces "com", "window", etc.
/*global com*/

jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.declare("com.broadspectrum.etime.ee.utils.Conversions");
com.broadspectrum.etime.ee.utils.Conversions = {
	time: function(value) {
		if (value) {
			var date = new Date(value.ms);
			var timeinmiliseconds = date.getTime(); //date.getTime(); //date.getSeconds(); //date.getTime();  
			var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "HH:mm a"
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
	makeSAPDateTime: function(property, isTime, toUTC) {
		var datetime = new Date(property);
		var sapDateTime;
		if (isTime) {
		    if (toUTC) {
			    sapDateTime = this.timeFormatterUTC.format(datetime, true);	// format date as UTC
		    } else {
    			sapDateTime = this.timeFormatter.format(datetime);
		    }
		} else {
		    if (toUTC) {
    			sapDateTime = this.dateFormatterUTC.format(datetime, true);	// format time as UTC
		    } else {
    			sapDateTime = this.dateFormatter.format(datetime);
		    }
		}
		return sapDateTime;
	},
	
	timeFormatter: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "PTHH'H'mm'M'ss'S'",
		UTC: false
	}),

	dateFormatter: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "yyyy-MM-ddTHH:mm:ss",
		UTC: false
	}),
	
	timeFormatterUTC: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "PTHH'H'mm'M'ss'S'",
		UTC: true
	}),

	dateFormatterUTC: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "yyyy-MM-ddTHH:mm:ss",
		UTC: true
	}),

	dateFormatterBasicDateOnly: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "dd MMM yyyy",
		UTC: false
	}),
	
	dateFormatterISODateOnly: sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "yyyy-MM-dd",
		UTC: false
	}),
	
	deleteButtonVisibilityTrigger: function(v) {
		if (v == 'SUB' || v == 'SAV') {
			return true;
		} else {
			return false;
		}
	},

	sendButtonVisibilityTrigger: function(v) {
		if ( v == 'APP' || v == 'TRF' || v == 'TRE' || v == 'REM' ) {
			return false;
		} else {
			return true;
		}
	},	
	editableByStatusTrigger: function(v) {
		if ( v == 'APP' || v == 'TRF' || v == 'TRE' || v == 'REM' ) {
			return false;
		} else {
			return true;
		}
	}
	
};