sap.ui.define([], function () {
	"use strict";
	return {
		formatStatus:function(status){
            switch(status){
                case '01':
                    return 'Started';
                case '02':
                        return 'Draft';
                case '03':
                            return 'Submit';
                case '05':
                    return 'Completed';
                
            }
        },
	};
});
