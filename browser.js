
var sanitizeHTML = require('sanitize-html');
var pretty = require('pretty');
var cheerio = require('cheerio');
var path = require('path');



var sanitise = function(inputHTML,imagesPath){
	imagesPath = imagesPath ? imagesPath : 'images';
	// sanitise the HTML
	allowedAttributes = sanitizeHTML.defaults.allowedAttributes
	allowedAttributes.div = ['id','style','class'];
	allowedAttributes.td = ['colspan','rowspan'];


	clean = sanitizeHTML(inputHTML, {
		allowedTags: sanitizeHTML.defaults.allowedTags.concat([ 'img','h1','h2','hr', 'sup','sub' ]),
		allowedAttributes: allowedAttributes,
		transformTags: {
			'a': function(tagName,attribs){
				// search for google links and remove them
				var href = attribs.href
				if(href && href.search("www.google.com/url?")!==-1){
					href = href.split('q=');
					href = href[1].split('&');
					href = decodeURIComponent(href[0]);
					attribs.href = href;
				}

				return {
					tagName: tagName,
					attribs: attribs
				}
			},
			'img': function (tagName, attribs){
				if(path.dirname(attribs.src) ==="images" ){
					attribs.src = attribs.src.replace('images',imagesPath);
				}
				return {
					tagName: tagName,
					attribs: attribs
				}
			},
			'td':function(tagName,attribs){
				if(attribs.colspan === '' || attribs.colspan==='1'){
					delete attribs.colspan;
				}
				if(attribs.rowspan === '' || attribs.rowspan==='1'){
					delete attribs.rowspan;
				}
				return {
					tagName: tagName,
					attribs: attribs
				}
			}
		}
	});


	// use cheerio 
	$$ = cheerio.load(clean);
	// remove empty p tags
	$$('p').each(function() {
	    var $$this = $$(this);
	    if($$this.html().replace(/\s|&nbsp;/g, '').length == 0)
	        $$this.remove();
	});
	// remove p tags in tables 
	$$('tr p').replaceWith(function () {
		return $$(this).contents();
	});
	// add 'even' and 'odd' tags to table rows
	$$('tr').each(function(index){
		if(index % 2 == 1){
			$$(this).addClass('even');
		} else {
			$$(this).addClass('odd');
		}
	});
	// get rid of 'Published by Google Drive' footer
	$$('div#footer').remove();
	// unwrap unneccesary div tags
	$$("div:not([style],[class])").replaceWith(function () {
		return $$(this).contents();
	});
	// output the cheerio HTML
	clean = $$.html();

	// pretty-print output html
	clean = pretty(clean);
	
	return clean;


};

window.sanitise = sanitise;
