// @flow
import o from "ospec/ospec.js"
import {htmlSanitizer, PREVENT_EXTERNAL_IMAGE_LOADING_ICON} from "../../../src/misc/HtmlSanitizer"

o.spec("HtmlSanitizerTest", browser(function () {

	o("OWASP XSS attacks", function () {
		// see https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
		let tests = [
			{
				html: "<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT></div>",
				expected: "<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n&gt;\"&gt;'&gt;</div>"
			},
			{html: "<div>'';!--\"<XSS>=&{()}</div>", expected: "<div>'';!--\"=&amp;{()}</div>"},
			{html: "<SCRIPT SRC=http://ha.ckers.org/xss.js></SCRIPT>", expected: ""},
			{html: "<IMG SRC=\"javascript:alert('XSS');\">", expected: '<img>'},
			{html: "<IMG SRC=javascript:alert('XSS')>", expected: '<img>'}
		];
		tests.forEach(test => {
			// attacks should not be possible even if we load external content
			o(htmlSanitizer.sanitize(test.html, false).text).equals(test.expected)
		})
	})

	o("blockquotes", function () {
		//var sanitizer = DOMPurify.sanitize("");
		o(htmlSanitizer.sanitize("<blockquote class=\"tutanota_quote\">test</blockquote>", true).text).equals('<blockquote class=\"tutanota_quote\">test</blockquote>')
	})


	o("custom classes", function () {
		//var sanitizer = DOMPurify.sanitize("");
		o(htmlSanitizer.sanitize("<div class=\"custom1 custom2\">test</div>", true).text).equals('<div class=\"\">test</div>')
	})

	o("leading text node", function () {
		o(htmlSanitizer.sanitize("hello<blockquote>test</blockquote>", true).text).equals('hello<blockquote>test</blockquote>')
	})

	o("html links", function () {
		let simpleHtmlLink = '<a href="https://tutanota.com">here</a>';
		let sanitizedLink = htmlSanitizer.sanitize(simpleHtmlLink, true).text;
		o(sanitizedLink.includes('href="https://tutanota.com"')).equals(true);
		o(sanitizedLink.includes('target="_blank"')).equals(true);
		o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true);
		o(sanitizedLink.includes('>here</a>')).equals(true);

		let htmlLink = '<a href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw=">here</a>';
		sanitizedLink = htmlSanitizer.sanitize(htmlLink, true).text;

		o(sanitizedLink.includes('href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw="')).equals(true)
		o(sanitizedLink.includes('target="_blank"')).equals(true)
		o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
		o(sanitizedLink.includes('>here</a>')).equals(true)
	})

	o("area element", function () {
		let element = '<area href="https://tutanota.com">here</area>';
		let sanitizedElement = htmlSanitizer.sanitize(element, true).text;
		o(sanitizedElement.includes('href="https://tutanota.com"')).equals(true);
		o(sanitizedElement.includes('target="_blank"')).equals(true);
		o(sanitizedElement.includes('rel="noopener noreferrer"')).equals(true);
	})


	o("sanitizing empty body", function () {
		let sanitized = htmlSanitizer.sanitize("", true).text;
		o(sanitized).equals("");

		sanitized = htmlSanitizer.sanitize(" ", true).text;
		o(sanitized).equals(" ");

		sanitized = htmlSanitizer.sanitize("yo", true).text;
		o(sanitized).equals("yo");

		sanitized = htmlSanitizer.sanitize("<br>", true).text;
		o(sanitized).equals("<br>")

		sanitized = htmlSanitizer.sanitize("<div></div>", true).text;
		o(sanitized).equals("<div></div>")

		sanitized = htmlSanitizer.sanitize("<html></html>", true).text;
		o(sanitized).equals("")

		sanitized = htmlSanitizer.sanitize("<html><body></body></html>", true).text;
		o(sanitized).equals("")

		sanitized = htmlSanitizer.sanitize("<html><body>yo</body></html>", true).text;
		o(sanitized).equals("yo")
	})

	o("detect background images", function () {
		o(PREVENT_EXTERNAL_IMAGE_LOADING_ICON).equals("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path d='M256 64L48 448h416L256 64zm-11.8 144h24v65.7l-6 70.3h-12l-6-70.3V208zM256 400c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z'/></svg>")
		let result = htmlSanitizer.sanitize('<p style="background-image: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', true);
		o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image");
		o(result.text.includes("data:image/svg+xml;utf8,")).equals(true);

		result = htmlSanitizer.sanitize('<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', true);
		o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image");
		o(result.text.includes("data:image/svg+xml;utf8,")).equals(true);

		result = htmlSanitizer.sanitize('<p style="background: url(&#39;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&#39;)"></p>', true);
		o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image");
		o(result.text.includes("data:image/svg+xml;utf8,")).equals(true);

		result = htmlSanitizer.sanitize('<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', false);
		o(result.externalContent.length).equals(0);
		o(result.text.includes("data:image/svg+xml;utf8,")).equals(false);
	})

	o("detect images", function () {
		let result = htmlSanitizer.sanitize('<img src="https://emailprivacytester.com/cb/510828b5a8f43ab5">', true)
		o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/510828b5a8f43ab5")
		o(result.text.includes('<img style="max-width: 100px;" src="data:image/svg+xml;utf8,')).equals(true);
	})

	o("detect figure", function () {
		let inputElement = '<figure src="https://tutanota.com/images/favicon/favicon.ico" type="image">'
		let result = htmlSanitizer.sanitize(inputElement, true)
		o(result.externalContent[0]).equals("https://tutanota.com/images/favicon/favicon.ico");
		o(result.text.includes('src="https://tutanota.com')).equals(false);
	})

	o("detect video posters", function () {
		let result = htmlSanitizer.sanitize('<video poster="https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster" height="1" width="1"></video>', true);
		o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster");
		o(result.text.includes('poster="data:image/svg+xml;utf8,')).equals(true);
	})

	o("detect style list images", function () {
		let result = htmlSanitizer.sanitize('<ul style="list-style-image: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif);"><li>Zeile 1</li></ul>', true);
		o(result.externalContent[0]).equals("http://www.heise.de/icons/ho/heise_online_logo_top.gif");
		o(result.text.includes('list-style-image: url(&quot;data:image/svg+xml;utf8,')).equals(true);
	})


	o("detect style content urls", function () {
		let result = htmlSanitizer.sanitize('<div style="content: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif)"></div>', true);
		o(result.externalContent[0]).equals("http://www.heise.de/icons/ho/heise_online_logo_top.gif");
		o(result.text.includes('content: url(&quot;data:image/svg+xml;utf8,')).equals(true);

		// do not modify non url content
		result = htmlSanitizer.sanitize('<div style="content: blabla"> </div >', true);
		o(result.externalContent.length).equals(0);
		o(result.text.includes('content: blabla')).equals(true);
	})


	o("detect style cursor images", function () {
		let result = htmlSanitizer.sanitize('<div style="cursor:url(https://tutanota.com/images/favicon/favicon.ico),auto;" ></div>', true);
		o(result.externalContent.length).equals(1);
		o(result.text).equals("<div style=\"\"></div>")
		o(result.text.includes('cursor:')).equals(false)

		result = htmlSanitizer.sanitize('<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>', false);
		o(result.externalContent.length).equals(0);
		o(result.text).equals('<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>');
	})

	o("detect style filter files", function () {
		let result = htmlSanitizer.sanitize('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>', true);
		o(result.externalContent.length).equals(1);
		o(result.text.includes('filter:')).equals(false)

		result = htmlSanitizer.sanitize('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>', false);
		o(result.externalContent.length).equals(0);
		o(result.text).equals('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);"></div>');
	})


	o("detect style element", function () {
		let result = htmlSanitizer.sanitize('<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>', true);
		o(result.externalContent.length).equals(0);
		o(result.text).equals('<div></div>');

		result = htmlSanitizer.sanitize('<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>', false);
		o(result.externalContent.length).equals(0);
		o(result.text).equals('<div></div>');
	})

	o("replace images and links", function () {
		let result = htmlSanitizer.sanitize('<html><img src="https://localhost/1.png"><img src="https://localhost/2.png"><img src="https://localhost/3.png"><img src="https://localhost/4.png"><img src="https://localhost/5.png"><img src="https://localhost/6.png"><img src="https://localhost/7.png"><img src="https://localhost/8.png"><img src="https://localhost/9"><a href="http://localhost/index.html"></a> </html>', true)
		o(result.externalContent.length).equals(9);
		// do not replace links
		o(result.text.includes('<a target="_blank" rel="noopener noreferrer" href="http://localhost/index.html">') || result.text.includes('<a href="http://localhost/index.html" target="_blank" rel="noopener noreferrer">')).equals(true)
	})

	o("audio tag", function () {
		let result = htmlSanitizer.sanitize('<audio controls autoplay loop muted preload src="https://www.w3schools.com/tags/horse.mp3" type="audio/mpeg"></audio>', true)
		o(result.externalContent[0]).equals("https://www.w3schools.com/tags/horse.mp3");
		o(result.text.includes("data:image/svg+xml;utf8,")).equals(true);
	})

	o("embed tag", function () {
		let result = htmlSanitizer.sanitize('<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>', true)
		o(result.externalContent.length).equals(0);
		o(result.text).equals('<div></div>')

		result = htmlSanitizer.sanitize('<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>', false)
		o(result.externalContent.length).equals(0);
		o(result.text).equals('<div></div>')
	})


}))