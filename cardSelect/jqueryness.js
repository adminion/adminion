$(document).ready(function(){





$('img').live( 'mouseenter', function() {
	  $(this).stop().fadeTo('fast', 0.5);
} );
$('img').live( 'mouseleave', function() {
	  $(this).stop().fadeTo('fast', 1);
} );

});
