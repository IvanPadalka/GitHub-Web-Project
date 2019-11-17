
String.prototype.queryStringToJSON = String.prototype.queryStringToJSON || function ( )
{	
	var params = String(this);
	params = params.substring(params.indexOf('?')+1);
	params = params.replace(/\+/g, '%20');
	if ( params.substring(0,1) === '{' && params.substring(params.length-1) === '}' )
	{	
		return eval(decodeURIComponent(params));
	}
	params = params.split(/\&(amp\;)?/);
	var json = {};
	for ( var i = 0, n = params.length; i < n; ++i )
	{
		var param = params[i] || null;
		if ( param === null ) { continue; }
		param = param.split('=');
		if ( param === null ) { continue; }

		var key = param[0] || null;
		if ( key === null ) { continue; }
		if ( typeof param[1] === 'undefined' ) { continue; }
		var value = param[1];

		key = decodeURIComponent(key);
		value = decodeURIComponent(value);
		value = eval(value);

		var keys = key.split('.');
		if ( keys.length === 1 )
		{	
			json[key] = value;
		}
		else
		{	
			var path = '',
				cmd = '';
			$.each(keys,function(ii,key){
				path += '["'+key.replace(/"/g,'\\"')+'"]';
				jsonCLOSUREGLOBAL = json;
				cmd = 'if ( typeof jsonCLOSUREGLOBAL'+path+' === "undefined" ) jsonCLOSUREGLOBAL'+path+' = {}';
				eval(cmd);
				json = jsonCLOSUREGLOBAL;
				delete jsonCLOSUREGLOBAL;
			});
			jsonCLOSUREGLOBAL = json; 
			valueCLOSUREGLOBAL = value; 
			cmd = 'jsonCLOSUREGLOBAL'+path+' = valueCLOSUREGLOBAL';
			eval(cmd);
			json = jsonCLOSUREGLOBAL;
			delete jsonCLOSUREGLOBAL;
			delete valueCLOSUREGLOBAL;
		}
	}
	return json;
};

$.extend( $.expr[':'], {

	inViewport : function( el ) {

		var scrollTop = ( document.documentElement.scrollTop || document.body.scrollTop ),
			elOffsetTop = $( el ).offset().top,
			elH = $( el ).height()
			winH = ( window.innerHeight && window.innerHeight < $( window ).height() ) ? window.innerHeight : $( window ).height();

		return ( elOffsetTop + elH ) > scrollTop && elOffsetTop < ( scrollTop + winH );

	}

});

function getHiddenProp(){
    var prefixes = ['webkit','moz','ms','o'];
    
    if ('hidden' in document) return 'hidden';
    
    for (var i = 0; i < prefixes.length; i++){
        if ((prefixes[i] + 'Hidden') in document) 
            return prefixes[i] + 'Hidden';
    }
    return null;
}
function isHidden() {
    var prop = getHiddenProp();
    if (!prop) return false;
    
    return document[prop];
}

var Gamma = (function() {

	var $window = $( window ),
		$body = $( 'body' ),
		$document = $( document ),
		Modernizr = window.Modernizr,
		transEndEventNames = {
			'WebkitTransition' : 'webkitTransitionEnd',
			'MozTransition' : 'transitionend',
			'OTransition' : 'oTransitionEnd',
			'msTransition' : 'MSTransitionEnd',
			'transition' : 'transitionend'
		},
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		defaults = {
			columns : 4,
			speed : 300,
			easing : 'ease',
			overlayAnimated : true,
			nextOnClickImage : true,
			circular : true,
			svImageTransitionSpeedFade : 300,
			svImageTransitionEasingFade : 'ease-in-out',
			svImageTransitionSpeedResize : 300,
			svImageTransitionEasingResize : 'ease-in-out',
			svMarginsVH : {
				vertical : 140,
				horizontal : 120
			},
			keyboard : true,
			swipe : true,
			interval : 4000,
			historyapi : true
		},
		init = function( settings, callback ) {

			Gamma.settings = $.extend( true, {}, defaults, settings );

			_config();
			_layout();
			_initMasonry( function() {

				Gamma.container.removeClass( 'gamma-loading' );
				Gamma.items.show();
				if( Gamma.settings.historyapi ) {

					_goto();

				}

				_initEvents( 'window' );

				if( callback ) {

					callback.call();

				}

			} );

		},
		_config = function() {

			Gamma.container = $( '#gamma-container' );
			Gamma.overlay = Gamma.container.find( 'div.gamma-overlay' );
			Gamma.controls = Gamma.container.children( 'div.gamma-options' );
			Gamma.gallery = Gamma.container.children( 'ul.gamma-gallery' );
			Gamma.items = Gamma.gallery.children();
			Gamma.itemsCount = Gamma.items.length;
			Gamma.columns = Gamma.settings.columns;
			Gamma.isAnimating = true;
			Gamma.svMargins = Gamma.settings.svMarginsVH;
			var History = window.History; 
			if ( !History.enabled && Gamma.settings.historyapi ) {

				Gamma.settings.historyapi = false;
			
			}
			Gamma.supportTransitions = Modernizr.csstransitions;

		},
		_createSingleView = function() {


			if( !Gamma.singleview ) {

				$( '<div class="gamma-single-view"><div class="gamma-options gamma-options-single"><div class="gamma-buttons"><button class="gamma-btn-close"></button></div></div></div>' )
				.appendTo( Gamma.container );

				Gamma.singleview = Gamma.container.children( 'div.gamma-single-view' );
				Gamma.svclose = Gamma.singleview.find( 'button.gamma-btn-close' );

				_initEvents( 'singleview' );

				_createSingleViewNavigation();
			
			}
			else if( !Gamma.nav ) {

				_createSingleViewNavigation();

			}

		},
		_createSingleViewNavigation = function() {

			if( Gamma.itemsCount > 1 ) {

				Gamma.svplay = $( '' ).insertAfter( Gamma.svclose );
				Gamma.nav = $( '' ).appendTo( Gamma.singleview );
				Gamma.svnavnext = Gamma.nav.find( 'span.gamma-next' );
				Gamma.svnavprev = Gamma.nav.find( 'span.gamma-prev' );

				_initEvents( 'singleviewnavigation' );

			}

		},
		_goto = function( anim, id ) {

			if( Gamma.settings.historyapi ) {
				
				id = id || History.getState().url.queryStringToJSON().id;

			}

			var isSingleview = ( id != undefined ),
				anim = anim || false;

			if( Gamma.settings.historyapi && Gamma.isSV && id === undefined ) {

				_closesingleview();

			}

			if( isSingleview ) {

				var $item = Gamma.items.eq( Math.abs( id ) );

				if( $item.length ) {

					if( Gamma.svImage ) {

						if( Gamma.supportTransitions ) {

							_setTransition( Gamma.svImage , 'all', Gamma.settings.svImageTransitionSpeedFade , Gamma.settings.svImageTransitionEasingFade );
						
						}

						_applyAnimation( Gamma.svImage, { opacity : 0 }, Gamma.settings.svImageTransitionSpeedFade, Gamma.supportTransitions, function() {
						
							$( this ).remove();
							anim = false;
							_singleviewitem( $item, anim );

						} );

						if( Gamma.svDescription ) {
				
							_applyAnimation( Gamma.svDescription, { opacity : 0 }, 400, Gamma.supportTransitions );
						
						}

					}
					else {

						if( Gamma.svDescription ) {
				
							Gamma.svDescription.empty();
						
						}
						_singleviewitem( $item, anim );

					}

				}

			}

		},
		_saveState = function( id ) {

			if( !Gamma.settings.historyapi && id != undefined ) {

				Gamma.isSV ? _goto( false, id ) : _goto( true, id );

			}
			else if( id === undefined ) {

				History.pushState( null, null, url('protocol') + '://' + url('hostname') + url('path') );

			}
			else if( History.getState().url.queryStringToJSON().id !== id ) {
					
				History.pushState( null, null, '?id=' + id );
			
			}
		
		},
		_layout = function( $items ) {

			if( Gamma.itemsCount > 0 ) {

				_createSingleView();

			}

			_setMasonry();

			var $items = $items || Gamma.items.hide();
			$items.each( function() {

				var $item = $( this ),
					$picEl = $item.children(),
					sources = _getImgSources( $picEl ),
					source = _chooseImgSource( sources, $item.outerWidth( true ) ),
					description = $picEl.data( 'description' );

				$item.data( {
					description : description,
					source : sources,
					maxwidth : $picEl.data( 'maxWidth' ),
					maxheight : $picEl.data( 'maxHeight' )
				} );

				$( '<div/>' ).addClass( 'gamma-description' ).html( description ).insertAfter( $picEl );

				$( '<img/>' ).attr( {
					alt : $picEl.data( 'alt' ),
					title : $picEl.data( 'title' ),
					src : source.src
				} ).insertAfter( $picEl );

				$picEl.remove();

			} );

		},
		_getImgSources = function( $el ) {

			var theSources = [];
			$el.children( 'div' ).each( function( i ) {

				var $source = $( this );
				theSources.push( {
					width : $source.data( 'minWidth' ) || 0,
					src : $source.data( 'src' ),
					pos : i
				} );

			} );
			
			return theSources;

		},
		_setMasonry = function() {

			var containerW = Gamma.container.width();

			if( Gamma.settings.viewport ) {

				for( var i = 0, len = Gamma.settings.viewport.length; i < len; ++i ) {

					var viewport = Gamma.settings.viewport[i];

					if( containerW > viewport.width ) {

						Gamma.columns = viewport.columns;
						break;

					}

				}

			}

			Gamma.items.css( 'width', Math.floor( containerW / Gamma.columns ) * 100 / containerW + '%' );

		},
		_initMasonry = function( callback ) {

			Gamma.gallery.imagesLoaded( function() {

				Gamma.gallery.masonry( {
					itemSelector : 'li',
					columnWidth : function( containerWidth ) {
						return containerWidth / Gamma.columns;
					}
				} );

				if( callback ) {

					callback.call();

				}

			} );

		},
		_reloadMasonry = function( timeout ) {

			clearTimeout( Gamma.masonrytimeout );
			timeout = timeout || 0;
			Gamma.masonrytimeout = setTimeout( function() { Gamma.gallery.masonry( 'reload' ); }, timeout );

		},
		_chooseImgSource = function( sources, w ) {

			if( w <= 0 ) {
				w = 1;
			}

			for( var i = 0, len = sources.length; i < len; ++i ) {

				var source = sources[i];


				if( w > source.width ) {

					return source;

				}

			}

		},
		_toggleControl = function( $control, status, animStyle ) {

			animStyle ? $control.css( animStyle ) : status === 'on' ? $control.show() : $control.hide();

		},
		_onnavigate = function( dir ) {

			if( !Gamma.slideshow ) {

				_navigate( dir );

			}

		},
		_navigate = function( dir ) {

			if( !Gamma.isSV || Gamma.isAnimating ) {

				return false;

			}

			var current = Gamma.current;

			if( dir === 'next' ) {

				Gamma.current = Gamma.current < Gamma.itemsCount - 1 ? ++Gamma.current :
					Gamma.settings.circular ? 0 : Gamma.current;

			}
			else if( dir === 'prev' ) {

				Gamma.current = Gamma.current > 0 ? --Gamma.current :
					Gamma.settings.circular ? Gamma.itemsCount - 1 : Gamma.current;
				
			}

			if( current === Gamma.current ) {

				return false;

			}

			Gamma.isAnimating = true;

			_saveState( Gamma.current );

		},
		_resize = function() {

			_setMasonry();

			_resizeGrid();

			if( Gamma.isSV ) {

				_svResizeImage();

			}

			_reloadMasonry( 200 );

		}
		_resizeGrid = function() {

			Gamma.items.each( function() {

				var $item = $( this ),
					source = _chooseImgSource( $item.data( 'source' ), Gamma.items.outerWidth( true ) );

				$item.find( 'img' ).attr( 'src', source.src );

			} );

		}
		_svResizeImage = function( callback ) {
			var finalConfig = _getFinalImgConfig( {

					sources : Gamma.svImage.data( 'source' ),
					imgMaxW : Gamma.svImage.data( 'maxwidth' ),
					imgMaxH : Gamma.svImage.data( 'maxheight' ),
					wrapper : { width : $window.width() - Gamma.svMargins.horizontal, height : $window.height() - Gamma.svMargins.vertical },
					image : { width : Gamma.svImage.width(), height : Gamma.svImage.height() }

				} ),
				source = finalConfig.source,
				finalSizePosition = finalConfig.finalSizePosition,

				currentSrc = Gamma.svImage.attr('src'),

				finalStyle = {
					width : finalSizePosition.width,
					height : finalSizePosition.height,
					left : finalSizePosition.left + Gamma.svMargins.horizontal / 2,
					top : finalSizePosition.top + Gamma.svMargins.vertical / 2
				};

			_applyAnimation( Gamma.svImage, finalStyle, Gamma.settings.svImageTransitionSpeedResize, Gamma.supportTransitions, function() {

				if( Gamma.supportTransitions ) {
					$( this ).off( transEndEventName );
				}

				if( currentSrc !== source.src ) {

					Gamma.isAnimating = true;

					var w = Gamma.svImage.width(),
						h = Gamma.svImage.height(),
						l = Gamma.svImage.position().left,
						t = Gamma.svImage.position().top;

					Gamma.svImage = $( '<img/>' ).load( function() {

						var $img = $( this );

						if( Gamma.supportTransitions ) {

							_setTransition( $img , 'all', Gamma.settings.svImageTransitionSpeedResize , Gamma.settings.svImageTransitionEasingResize );

						}

						_applyAnimation( $img.next(), { opacity : 0 }, 500, Gamma.supportTransitions, function() {

							var $img = $( this );
							if( Gamma.supportTransitions ) {
								$( this ).off( transEndEventName );
							}
							$img.remove();
							Gamma.isAnimating = false;

						} );

					} )
					.css( { width : w, height : h, left : l, top : t } )
					.data( Gamma.svImage.data() )
					.insertBefore( Gamma.svImage )
					.attr( 'src', source.src );

				}

				if( callback ) {

					callback.call();

				}

			} );

		},
		_getFinalImgConfig = function( properties ) {

			var sources = properties.sources,
				imgMaxW = properties.imgMaxW || 0,
				imgMaxH = properties.imgMaxH || 0,
				source = _chooseImgSource( sources, properties.wrapper.width ), 
				finalSizePosition = _getFinalSizePosition( properties.image, properties.wrapper );

			if( finalSizePosition.checksource ) {

				source = _chooseImgSource( sources, finalSizePosition.width );

			}

			if( source.pos === 0 && ( imgMaxW !== 0 && finalSizePosition.width > imgMaxW || imgMaxH !== 0 && finalSizePosition.height > imgMaxH ) ) {

				if( imgMaxW !== 0 && finalSizePosition.width > imgMaxW ) {

					var ratio = finalSizePosition.width / imgMaxW;
					finalSizePosition.width = imgMaxW;
					finalSizePosition.height /= ratio;

				}
				else if( imgMaxH !== 0 && finalSizePosition.height > imgMaxH ) {

					var ratio = finalSizePosition.height / imgMaxH;
					finalSizePosition.height = imgMaxH;
					finalSizePosition.width /= ratio;
					
				}

				finalSizePosition.left = properties.wrapper.width / 2 - finalSizePosition.width / 2;
				finalSizePosition.top = properties.wrapper.height / 2 - finalSizePosition.height / 2;

			}

			return {
				source : source,
				finalSizePosition : finalSizePosition
			};

		},
		_singleview = function() {

			var id = $( this ).index();
			_saveState( id );

		},
		_singleviewitem = function( $item, anim ) {

			Gamma.isSV = true;

			var id = $item.index(),
				data = $item.data(),
				$img = $item.children( 'img' );
				
			if( anim ) {

				Gamma.fly = $( '<img/>' ).attr( 'src', $img.attr( 'src' ) ).addClass( 'gamma-img-fly' ).css( {
					width : $img.width(),
					height : $img.height(),
					left : $item.offset().left + ( $item.outerWidth( true ) - $item.width() ) / 2,
					top : $item.offset().top + ( $item.outerHeight( true ) - $item.height() ) / 2
				} ).appendTo( $body );

				if( Gamma.supportTransitions ) {

					_setTransition( Gamma.fly );

				}

			}
				
			var	finalConfig = _getFinalImgConfig( {

					sources : $item.data( 'source' ),
					imgMaxW : $item.data( 'maxwidth' ),
					imgMaxH : $item.data( 'maxheight' ),
					wrapper : { width : $window.width() - Gamma.svMargins.horizontal, height : $window.height() - Gamma.svMargins.vertical },
					image : { width : $img.width(), height : $img.height() }

				} ),	
				source = finalConfig.source,
				finalSizePosition = finalConfig.finalSizePosition;

			Gamma.current = id;

			Gamma.overlay.show();

			if( Gamma.settings.overlayAnimated && anim && Gamma.supportTransitions ) {

				_setTransition( Gamma.overlay , 'opacity' );

			}
			
			setTimeout( function() {

				_applyAnimation( Gamma.overlay, { 'opacity' : 1 }, Gamma.settings.speed, Gamma.supportTransitions || !anim, function() {

					if( !Gamma.isSV ) {

						return false;
					
					}
					if( Gamma.supportTransitions ) {
						$( this ).off( transEndEventName );
					}
					
					$body.css( 'overflow-y', 'hidden' );
					var el = Gamma.overlay[0];
					el.style.display='none';
					el.offsetHeight;
					el.style.display='block';

				} );

				$item.css( 'visibility', 'hidden' );

				if( !anim ) {

					_loadSVItemFromGrid( data, finalSizePosition, source.src );

				}
				else {

					var styleCSS = {
							width : finalSizePosition.width,
							height : finalSizePosition.height,
							left : finalSizePosition.left + $window.scrollLeft() + Gamma.svMargins.horizontal / 2,
							top : finalSizePosition.top + $window.scrollTop() + Gamma.svMargins.vertical / 2
						}, 
						cond = Gamma.supportTransitions;

					_applyAnimation( Gamma.fly, styleCSS, Gamma.settings.speed, cond, function() {
						
						if( cond ) {
							$( this ).off( transEndEventName );
						}

						_loadSVItemFromGrid( data, finalSizePosition, source.src );

					} );

				}

			}, 25 );

		},
		_loadSVItemFromGrid = function( data, position, src ) {

			Gamma.singleview.show();

			if( !Gamma.svDescription ) {
				
				Gamma.svDescription = $( '<div/>' )
										.addClass( 'gamma-description' )
										.appendTo( Gamma.singleview ).wrap( '<div class="gamma-description-wrapper"></div>' );

				if( Gamma.supportTransitions ) {

					_setTransition( Gamma.svDescription , 'opacity', Gamma.settings.svImageTransitionSpeedFade / 2 , Gamma.settings.svImageTransitionEasingFade );

				}

			}
			Gamma.svDescription.html( data.description );

			var loadingtimeout = setTimeout( function() { Gamma.singleview.addClass( 'gamma-loading' );	}, Gamma.settings.svImageTransitionSpeedFade + 250 );
			
			Gamma.svImage = $( '<img/>' ).load( function() {

				var $img = $( this );

				clearTimeout( loadingtimeout );
				Gamma.singleview.removeClass( 'gamma-loading' );

				setTimeout( function() {

					_applyAnimation( Gamma.svDescription, { 'opacity' : 1 }, Gamma.settings.svImageTransitionSpeedFade / 2, Gamma.supportTransitions );

				}, 25 );

				$img.css( {
					width : position.width,
					height : position.height,
					left : position.left + Gamma.svMargins.horizontal / 2,
					top : position.top + Gamma.svMargins.vertical / 2
				} ).appendTo( Gamma.singleview );

				if( Gamma.supportTransitions ) {

					_setTransition( $img , 'all', Gamma.settings.svImageTransitionSpeedResize , Gamma.settings.svImageTransitionEasingResize );

				}

				if( Gamma.fly ) {
					
					if( Gamma.supportTransitions ) {

						_setTransition( Gamma.fly, 'opacity', 1000 );

					}
					setTimeout( function() {

						_applyAnimation( Gamma.fly, { 'opacity' : 0 }, 1000, Gamma.supportTransitions, function() {

							var $this = $( this );

							if( Gamma.supportTransitions ) {
								$this.off( transEndEventName );
							}
							$this.remove();
							Gamma.fly = null;
							Gamma.isAnimating = false;

						} );

					}, 25 );

				}
				else {

					Gamma.isAnimating = false;

				}

			} ).data( data ).attr( 'src', src );

		},
		_getFinalSizePosition = function( imageSize, wrapperSize ) {

			var imgW = imageSize.width,
				imgH = imageSize.height,

				wrapperW = wrapperSize.width,
				wrapperH = wrapperSize.height,

				finalW, finalH, finalL, finalT,
				checksource = false;

			if( imgW > imgH ) {

				finalW = wrapperW;
				var ratio = imgW / wrapperW;

				finalH = imgH / ratio;
				
				if( finalH > wrapperH ) {

					checksource = true;
					ratio = finalH / wrapperH;
					finalW /= ratio;
					finalH = wrapperH;
				
				}

			}
			else {

				finalH = wrapperH;
				var ratio = imgH / wrapperH;

				finalW = imgW / ratio;

				checksource = true;
				
				if( finalW > wrapperW ) {

					checksource = false;

					ratio = finalW / wrapperW;
					finalW = wrapperW;
					finalH /= ratio;
				
				}

			}

			return {
				width : finalW,
				height : finalH,
				left : wrapperW / 2 - finalW / 2,
				top : wrapperH / 2 - finalH / 2,
				checksource : checksource
			};

		},
		_closesingleview = function() {

			if( Gamma.isAnimating || Gamma.fly ) {

				return false;

			}

			Gamma.isSV = false;

			if( Gamma.slideshow ) {

				_stopSlideshow();

			}

			var $item = Gamma.items.eq( Gamma.current ),
				$img = $item.children( 'img' );

			Gamma.items.not( $item ).css( 'visibility', 'visible' );

			var wst = $window.scrollTop();

			if( !$item.is( ':inViewport' ) ) {

				wst = $item.offset().top + ( $item.outerHeight( true ) - $item.height() ) / 2;

				var diff = $document.height() - $window.height();

				if( wst > diff ) {
					
					wst = diff;
				}

				$window.scrollTop( wst );

			}

			var l = Gamma.svImage.position().left + $window.scrollLeft(),
				t = Gamma.svImage.position().top + wst;

			Gamma.svImage.appendTo( $body ).css( {
				position : 'absolute',
				zIndex : 10000,
				left : l,
				top : t 
			} );
			
			if( Gamma.supportTransitions ) {

				_setTransition( Gamma.svImage  );

			}

			Gamma.singleview.hide();
			Gamma.svDescription.empty().css( 'opacity', 0 );
			$body.css( 'overflow-y', 'scroll' );

			setTimeout( function() {

				var styleCSS = {
					width : $img.width(),
					height : $img.height(),
					left : $item.offset().left + ( $item.outerWidth( true ) - $item.width() ) / 2,
					top : $item.offset().top + ( $item.outerHeight( true ) - $item.height() ) / 2
				}
				_applyAnimation( Gamma.svImage, styleCSS, Gamma.settings.speed, Gamma.supportTransitions, function() {
						
					$item.css( 'visibility', 'visible' );
					$( this ).remove();
					Gamma.svImage = null;

				} );

				if( Gamma.settings.overlayAnimated ) {

					if( Gamma.supportTransitions ) {

						_setTransition( Gamma.overlay , 'opacity' );

					}

					_applyAnimation( Gamma.overlay, { 'opacity' : 0 }, Gamma.settings.speed, Gamma.supportTransitions, function() {
							
						var $this = $( this );

						if( Gamma.supportTransitions ) {
							$this.off( transEndEventName );
						}

						$this.hide();

					} );

				}
				else {

					Gamma.overlay.hide();

				}

				_saveState();

			}, 25 );

		},
		_visChange = function() {

			if( Gamma.slideshow ) {

				isHidden() ? ( _stopSlideshow( true ), Gamma.slideshow = true ) : _prepareSlideshow();

			}

		},
		_prepareSlideshow = function() {

			if( Gamma.isAnimating && !Gamma.slideshow ) {
				return false;
			}
			Gamma.isAnimating = true;

			clearTimeout( Gamma.slideshowtimeout );

			Gamma.slideshow = true;
			Gamma.svMargins = {
				vertical : 0,
				horizontal : 0
			};
			_toggleControl( Gamma.svclose, 'off' );
			_toggleControl( Gamma.svnavprev, 'off', { left : -40 } );
			_toggleControl( Gamma.svnavnext, 'off', { right : -40 } );
			
			_svResizeImage( function() {

				Gamma.isAnimating = false;

				Gamma.svplay.addClass( 'gamma-btn-sspause' );
				_startSlideshow();

			} );

		},
		_preloadNext = function() {

			var next = Gamma.current < Gamma.itemsCount - 1 ? Gamma.current + 1 :
				Gamma.settings.circular ? 0 : Gamma.current,
				$item = Gamma.items.eq( next ),
				$img = $item.children( 'img' ),
				finalConfig = _getFinalImgConfig( {

					sources : $item.data( 'source' ),
					imgMaxW : $item.data( 'maxwidth' ),
					imgMaxH : $item.data( 'maxheight' ),
					wrapper : { width : $window.width() - Gamma.svMargins.horizontal, height : $window.height() - Gamma.svMargins.vertical },
					image : { width : $img.width(), height : $img.height() }

				} ),	
				source = finalConfig.source;

			$( '<img/>' ).attr( 'src', source.src );

		},
		_startSlideshow = function() {

			_preloadNext();

			Gamma.slideshowtimeout = setTimeout( function() {

				_navigate( 'next' );
				_startSlideshow();

			}, Gamma.settings.interval );

		},
		_stopSlideshow = function( pause ) {

			if( Gamma.isAnimating ) {
				return false;
			}
			Gamma.isAnimating = true;

			clearTimeout( Gamma.slideshowtimeout );
			if( !pause ) {

				Gamma.slideshow = false;
				Gamma.svplay.removeClass( 'gamma-btn-sspause' );
				Gamma.svMargins = Gamma.settings.svMarginsVH;
				_toggleControl( Gamma.svclose, 'on' );
				_toggleControl( Gamma.svnavprev, 'on', { left : 20 } );
				_toggleControl( Gamma.svnavnext, 'on', { right : 20 } );
				_svResizeImage( function() {

					Gamma.isAnimating = false;

				} );
			
			}

		},
		_initEvents = function( type ) {

			switch( type ) {

				case 'window' : 

					if( Gamma.settings.historyapi ) {

						$window.on( 'statechange.gamma', function() {

							_goto( true );

						} );

					}

					$window.on( 'smartresize.gamma', _resize );

					var visProp = getHiddenProp();
					

					if (visProp) {

						var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
						document.addEventListener(evtname, _visChange);
					
					}
					
					break;

				case 'singleview' : 

					Gamma.gallery.on( 'click.gamma', 'li', _singleview );
					Gamma.svclose.on( 'click.gamma', _closesingleview );

					break;

				case 'singleviewnavigation' : 

					Gamma.svnavnext.on( 'click.gamma', function() { _onnavigate( 'next' ); } );
					Gamma.svnavprev.on( 'click.gamma', function() { _onnavigate( 'prev' ); } );

					if( Gamma.settings.nextOnClickImage ) {

						Gamma.singleview.on( 'click.gamma', 'img', function() { _onnavigate( 'next' ); } );

					}

					if ( Gamma.settings.keyboard ) {
						
						$document.on( 'keydown.gamma', function( event ) {

							var keyCode = event.keyCode || event.which,
								arrow = {
									left: 37,
									up: 38,
									right: 39,
									down: 40
								};

							switch (keyCode) {
								
								case arrow.left :

									_onnavigate( 'prev' );
									break;
								
								case arrow.right :
									
									_onnavigate( 'next' );
									break;

							}

						} );

					}

					if( Gamma.settings.swipe ) {

						Gamma.singleview.on( {
							'swipeleft.gamma' : function() {

								_onnavigate( 'next' );
							
							},
							'swiperight.gamma' : function() {

								_onnavigate( 'prev' );
							
							}
						} );

					}

					Gamma.svplay.on( 'click.gamma', function() {

						if( Gamma.slideshow ) {

							_stopSlideshow();

						}
						else if( !Gamma.isAnimating ) {
								
							_prepareSlideshow();

						}

					} );

					break;

			};

		},
		_setTransition = function( el , property, speed, easing ) {

			if( !property ) {

				property = 'all';

			}
			if( !speed ) {

				speed = Gamma.settings.speed;

			}
			if( !easing ) {

				easing = Gamma.settings.easing;

			}

			el.css( 'transition', property + ' ' + speed + 'ms ' + easing );

		},
		_applyAnimation = function( el, styleCSS, speed, cond, fncomplete ) {

			$.fn.applyStyle = cond ? $.fn.css : $.fn.animate;

			if( fncomplete && cond ) {

				el.on( transEndEventName, fncomplete );

			}

			fncomplete = fncomplete || function() { return false; };

			el.stop().applyStyle( styleCSS, $.extend( true, [], { duration : speed + 'ms', complete : fncomplete } ) );

		},
		add = function( $newitems ) {

			Gamma.gallery.append( $newitems );
			Gamma.items = Gamma.gallery.children();
			Gamma.itemsCount = Gamma.items.length;
			_layout( $newitems );
			_reloadMasonry();

		};

	return {
		init : init,
		add : add
	}

})();