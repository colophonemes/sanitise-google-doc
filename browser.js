
var sanitizeHTML = require('sanitize-html');
var pretty = require('pretty');
var cheerio = require('cheerio');
var css = require('css');
var toMarkdown = require('to-markdown');
var path = require('path');



var sanitise = function(inputHTML,options){
	var imagesPath = options.imagesPath ? options.imagesPath : 'images';
	var addTableHeaders = options.addTableHeaders ? options.addTableHeaders : false;
	var markdown = options.markdown || false;

	// get contents of style tag, remap spans to semantic tags
	$$ = cheerio.load(inputHTML);
	var styles = css.parse($$('style').text());
	var rules = styles.stylesheet.rules;
	var boldSelector, italicSelector;
	for (var i = rules.length - 1; i >= 0; i--) {
		if(rules[i].declarations && rules[i].declarations.length === 1){
			if(rules[i].declarations[0].property ==='font-weight' && ['bold','400','700'].indexOf(rules[i].declarations[0].value)>-1){
				boldSelector = rules[i].selectors[0];
			}
			if(rules[i].declarations[0].property ==='font-style' && ['italic'].indexOf(rules[i].declarations[0].value)>-1){
				italicSelector = rules[i].selectors[0];
			}
		}
	};
	$$(boldSelector).replaceWith(function(){
	    return $$("<strong />").append($$(this).contents());
	});
	$$(italicSelector).replaceWith(function(){
	    return $$("<em />").append($$(this).contents());
	});
	inputHTML = $$.html();


	// sanitise the HTML
	allowedAttributes = sanitizeHTML.defaults.allowedAttributes
	allowedAttributes.div = ['id','style','class'];
	allowedAttributes.td = ['colspan','rowspan'];


	clean = sanitizeHTML(inputHTML, {
		allowedTags: sanitizeHTML.defaults.allowedTags.concat([ 'img','h1','h2','hr', 'sup','sub' ]),
		allowedAttributes: allowedAttributes,
		transformTags: {
			'a': function(tagName,attribs){
				// remove auto-generated anchors
				if(attribs.name){return false}
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
	// add table headers
	if(addTableHeaders){
		$$('table').each(function(){
			// add thead tag
			$$(this).prepend('<thead></thead>')
			$$(this).find('thead').append($$(this).find("tr").eq(0));
			// add 'row-header' class to first td in every row
			$$('td:first-child',this).addClass('row-header');
		})	
	}
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
	if(!markdown){
		clean = pretty(clean);
	} else {
		clean = toMarkdown(clean, {converters:[
			{
				filter: function(node){
					if(node.nodeName !== 'SUP') return false;
					return node.nodeName === 'SUP' && /^\[[\d]+\]$/.test(node.textContent)
				},
				replacement: function(content) {
					return '[^fn-' + content.replace('[','').replace(']','') + ']';
				}
			},
			{
				filter: function(node){
					if (node.nodeName !== 'P') return false;
					return node.nodeName === 'P' && /^\[[\d]+\][\s]*?/.test(node.textContent)
				},
				replacement: function(content) {
					var matches = content.match(/^\[([\d]+)\][\s]*?(.*)/);
					return '\n[^fn-' + matches[1] + ']: ' + matches[2] + '\n\n';
				}
			}
		]})
	}
	return clean;


};

window.sanitise = sanitise;
