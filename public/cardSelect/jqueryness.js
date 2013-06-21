$(document).ready(function(){





	$('img').live( {
		'mouseenter': function() {
			$(this).stop().fadeTo('fast', 0.5);
		},
		'mouseleave': function() {
			$(this).stop().fadeTo('fast', 1);
		},
		'click': function() {
			$(this).stop().toggle( function() {
				$(this).animate({width:'300px'},'fast');
			}, function() {
				$(this).animate({width:'150px'},'fast');
			}).trigger('click');
		}
	});
});
