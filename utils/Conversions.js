jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.declare("com.transfieldservices.utils.Conversions");
com.transfieldservices.utils.Conversions = {
	time: function(value) {
	   // value = 'PT08H00M00S';
		if (value) {
			var date = new Date(value.ms);
			var timeinmiliseconds = date.getTime(); //date.getTime(); //date.getSeconds(); //date.getTime();  
			var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "KK:mm:ss a"
			});
			var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
			var timeStr = oTimeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));

			return timeStr;
		} else {
			return value;
		}
	}
};