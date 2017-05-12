(function () {
    'use strict';
    var params = {
        "sugSubmit": false
    };
    BaiduSuggestion.bind("search", params);
    $(function () {
        $('#search').focus();
        document.forms[0].onsubmit = function (e) {
            e.preventDefault();
            if (!$('#search').val()) {
                $('#search').focus();
                return false;
            }
            var url = '/s/' + encodeURIComponent($('#search').val()) ;
            window.location = url;
            return false;
        };


        var tmp = '';

        $('body').on('click','.search-item',function() {
			$(this).find('.item-bar span').each(function(index,item) {
				tmp = $(item).text();
				if(tmp.indexOf('下载热度') > -1) {
					sessionStorage.setItem('hot',tmp.split('：')[1]);
				}
			})
        });

	    sessionStorage.getItem('hot') && $('#hits_num').text(sessionStorage.getItem('hot'));


	    if($('p').hasClass('error')) {
	    	$('.search-res div div').css({
		    'left': '0',
		    'top': '90px',
		    'padding': '40px',
		    'border': '1px dashed #e5e5e5'
		    });
		    $('.search-res-info em').text(0);
	    }else {
	    	if($('.last_p a').attr('href') ) {
		        var arr =  $('.last_p a').attr('href').split('_');
			    $('.search-res-info em').text($('.search-item').length * arr[arr.length-1].split('.')[0]);
		    }else {
		    	if($('.search-res-info em') && $('.search-res li').html()) {
				    $('.search-res-info em').text('10');
			    }else {
				    $('.search-res-info em').text('0');
			    }
		    }
	    }

    });



})()