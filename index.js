const fs = require("fs");
const SAXParser = require('parse5-sax-parser');

class BlackboardTest {
    constructor(sIn, sOut) {
        //closure
        let self = {};
        self.streamOutFile = fs.createWriteStream(sOut);
        self.parser = new SAXParser();
        self.aCurState = [];
        self.nQuestion = 0;
        self.sResponse = null;
        self.bInItemFeedback = false;

        self.parser.on('startTag', tag => {
            self.aCurState.push(tag.tagName);
            if (tag.tagName == "item") {
                self.nQuestion++;
                self.sResponse = null;
                self.streamOutFile.write("<p>");
            } else if (tag.tagName == "response_lid") {
                self.sResponse = String.fromCharCode("a".charCodeAt() - 1);
                self.streamOutFile.write("</p><table><tr>")
            } else if (tag.tagName == "response_label") {
                self.sResponse = String.fromCharCode(self.sResponse.charCodeAt() + 1);
                if (self.sResponse != "a") {
                    self.streamOutFile.write("</td>");
                }
                if (self.sResponse == "c") {
                    self.streamOutFile.write("</tr><tr>");
                }
                self.streamOutFile.write("<td>");
            } else if (tag.tagName == "itemfeedback") {
                self.bInItemFeedback = true;
            }
        });

        self.parser.on("text", oText => {
            if (!oText.text || self.bInItemFeedback) {
                return;
            }
            const sTag = self.aCurState[self.aCurState.length - 1];
            let sText = oText.text.replace(/<(\/*)div.*?>/g, "<$1span>");
            if (sTag == "mat_formattedtext" || sTag == "mattext") {
                if (self.sResponse) {
                    self.streamOutFile.write(self.sResponse + ") " + sText + "\n");
                } else {
                    self.streamOutFile.write(self.nQuestion + ") " + sText + "\n");
                }

            }
        });

        self.parser.on("endTag", tag => {
            self.aCurState.pop();
            if (tag.tagName == "itemfeedback") {
                self.bInItemFeedback = false;
            } else if (tag.tagName == "item") {
                self.streamOutFile.write("</p>")
            } else if (tag.tagName == "response_lid") {
                self.streamOutFile.write("</td></tr></table><p>");
            }
        });

        self.parser.on("error", err => console.log(err));

        let streamInfile = fs.createReadStream(sIn, { encoding: 'utf8' });

        self.streamOutFile.once('open', function() {
            self.streamOutFile.write("<style>td{padding-right:2em;vertical-align:top}table, th, td {border:none} p{padding-bottom:.5em}table{padding-left:.5em}</style>");
            streamInfile.pipe(self.parser);
        });


    }
}


const sFile = process.argv[2];

new BlackboardTest(sFile, sFile + ".html");

