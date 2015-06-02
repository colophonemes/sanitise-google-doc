#! /usr/bin/env node

var sanitizeHTML = require('sanitize-html');
var pretty = require('pretty');
var cheerio = require('cheerio');
var ncp = require('ncp').ncp;

var fs = require('fs');
var path = require('path');

var userArgs = process.argv.splice(2);
var inputHTMLPath = userArgs[0];
var imagesPath = path.basename(inputHTMLPath,path.extname(inputHTMLPath)) + '_images';
var attachmentsFolder = "/sites/givingwhatwecan.org/files/attachments"

if(inputHTMLPath){
	inputHTMLPath = path.normalize(inputHTMLPath.toString());
	console.log('Processing '+path.basename(inputHTMLPath));
	// read the file in
	fs.readFile(inputHTMLPath,{encoding:'UTF-8'}, function(err,data){
		if(err){ console.error(err); return; }
		
		// sanitise the HTML
		allowedAttributes = sanitizeHTML.defaults.allowedAttributes
		allowedAttributes.div = ['style','class'];


		clean = sanitizeHTML(data, {
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
						attribs.src = attribs.src.replace('images',attachmentsFolder + '/' + imagesPath);
					}
					return {
						tagName: tagName,
						attribs: attribs
					}
				}
			}
		});


		// use cheerio 
		$ = cheerio.load(clean);
		// remove empty p tags
		$('p').each(function() {
		    var $this = $(this);
		    if($this.html().replace(/\s|&nbsp;/g, '').length == 0)
		        $this.remove();
		});
		// unwrap unneccesary div tags
		$("div:not([style],[class])").replaceWith(function () {
			return $(this).contents();
		});
		// output the cheerio HTML
		clean = $.html();

		// pretty-print output html
		clean = pretty(clean);
		
		//console.log(clean);

		// output file 
		outputHTMLPath = path.dirname(inputHTMLPath) + '/' + path.basename(inputHTMLPath, path.extname(inputHTMLPath)) + '.sanitized' + path.extname(inputHTMLPath);
		

		// copy images to uniquely-named directory
		ncp(path.dirname(inputHTMLPath)+'/images', path.dirname(inputHTMLPath)+'/'+imagesPath, function (err) {
			if (err) {
				return console.error(err);
			}
			console.log('Images copied from "images" to "'+imagesPath+'"');
			console.log('Put the "'+imagesPath+'" folder inside the "'+attachmentsFolder+'" folder on the server');
		});


		fs.writeFile(outputHTMLPath, clean, function(err){
			if(err){ console.error(err); return; }
			console.log('Sanitized HTML saved to ' + path.basename(outputHTMLPath) );
		})

	});
	
} else {
	console.error('Error: No input file specified');
}

