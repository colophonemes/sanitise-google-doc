
var sanitizeHTML = require('sanitize-html');
var pretty = require('pretty');
var cheerio = require('cheerio');
var path = require('path');



var sanitise = function(inputHTML,imagesPath){
	imagesPath = imagesPath ? imagesPath : 'images';
	// sanitise the HTML
	allowedAttributes = sanitizeHTML.defaults.allowedAttributes
	allowedAttributes.div = ['style','class'];


	clean = sanitizeHTML(inputHTML, {
		allowedTags: sanitizeHTML.defaults.allowedTags.concat([ 'img','h1','h2','hr' ]),
		allowedAttributes: allowedAttributes,
		transformTags: {
			// search for google links and remove them
			'a': function(tagName,attribs){
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
