const fs = require("fs");
const SAXParser = require('parse5-sax-parser');

const sFile = process.argv[2];

let streamOutFile = fs.createWriteStream(sFile + ".html");

let parser = new SAXParser();

let aCurState = [];
let nQuestion = 0;
let sResponse = null;
let bInItemFeedback = false;

parser.on('startTag', tag => {
    //console.log(tag.tagName);
    aCurState.push(tag.tagName);
    if(tag.tagName == "item"){
        nQuestion ++;
        sResponse = null;
        streamOutFile.write("<p>");
    }else if(tag.tagName == "response_lid"){
        sResponse = String.fromCharCode("a".charCodeAt() -1);
        streamOutFile.write("</p><table><tr>")
    }else if(tag.tagName == "response_label"){
        sResponse = String.fromCharCode(sResponse.charCodeAt() + 1);
        if(sResponse != "a"){
            streamOutFile.write("</td>");
        }
        if(sResponse == "c"){
            streamOutFile.write("</tr><tr>");
        }
        streamOutFile.write("<td>");
    }else if(tag.tagName == "itemfeedback"){
        bInItemFeedback = true;
    }
});

parser.on("text", oText => {
    if(!oText.text || bInItemFeedback){
        return;
    }
    const sTag = aCurState[aCurState.length  - 1];
    let sText = oText.text.replace(/div/g, "span");
    if(sTag == "mat_formattedtext" || sTag == "mattext"){
        if(sResponse){
            streamOutFile.write(sResponse + ") " + sText + "\n");
        }else{
            streamOutFile.write(nQuestion + ") " + sText + "\n");
        }

    }
});

parser.on("endTag", tag => {
    aCurState.pop();
    if(tag.tagName == "itemfeedback"){
        bInItemFeedback = false;
    }else if(tag.tagName == "item"){
        streamOutFile.write("</p>")
    }else if(tag.tagName == "response_lid"){
        streamOutFile.write("</td></tr></table><p>");
    }
});

var streamInfile = fs.createReadStream(sFile, { encoding: 'utf8' });
parser.on("error", err => console.log(err));

streamOutFile.once('open', function(fd) {
    streamOutFile.write("<style>td{padding-right:2em;vertical-align:top}table, th, td {border:none} p{padding-bottom:.5em}table{padding-left:.5em}</style>");
    streamInfile.pipe(parser);
});

