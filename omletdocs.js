//Ompad, notepad for Omlet Chat
//Sony Theakanath

//Global Variables
var text = "";
var currentcharpos = 0;
var oldcharpos = 0;
var searchTimeout;
var saved = false;
var firsttyped = false;

//Shares document to Omlet once pressed
function shareToOmlet() {
    if(!saved) {
      text = $('#area1').val();
      var textText = JSON.stringify(text);
      documentApi.update(myDocId,Update, {"text" : textText} , ReceiveUpdate, DidNotReceiveUpdate);
      if(Omlet.isInstalled()) {
          var rdl = Omlet.createRDL({
                  noun: "note",
                  displayTitle: "OmPad",
                  displayThumbnailUrl: "https://mobi-summer-sony.s3.amazonaws.com/appimages/notepad.png",
                  displayText: "Simultaneously edit one document! Click here to see a new Doc!",  
                  webCallback: "https://mobi-summer-sony.s3.amazonaws.com/omletdocs.html",
                  callback: (window.location.href),
          });
          saved = true;
          Omlet.exit(rdl);
      }
   } else {
      callServerScript();
      Omlet.exit();
   }
}

$(document).ready(function(){
    //Updates the document to cloud after 250ms of inactivity on keyboard
    document.getElementById('area1').onkeypress = function () {
        firsttyped = true;
        if (searchTimeout != undefined) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(callServerScript, 550);
    };

    //Checks for backspace usage. Former code block doesn't handle backspaces.
    $(document).keydown(function(e) {
        if (e.keyCode === 8) {
            oldcharpos = currentcharpos;
            newtext = $('#area1').val();
            newtext = newtext.substring(0, oldcharpos-1) + newtext.substring(oldcharpos);
            console.log("Testing substring:  " + newtext);
            var textText = JSON.stringify(newtext);
            documentApi.update(myDocId,Update, {"text" : textText} , ReceiveUpdate, DidNotReceiveUpdate);
        }
    });
});

//Updates the document after 250ms
function callServerScript() {
    newtext = $('#area1').val();
    var textText = JSON.stringify(newtext);
    documentApi.update(myDocId,Update, {"text" : textText} , ReceiveUpdate, DidNotReceiveUpdate);
}

//Gets the caret position for string concatenation
function getCaret(el) { 
    if (el.selectionStart) { 
        return el.selectionStart; 
    } else if (document.selection) { 
        el.focus(); 
        var r = document.selection.createRange(); 
        if (r == null) { 
          return 0; 
        } 
        var re = el.createTextRange(), 
        rc = re.duplicate(); 
        re.moveToBookmark(r.getBookmark()); 
        rc.setEndPoint('EndToStart', re); 
        return rc.text.length; 
    }  
    return 0; 
}

//Checks for caret changes in TextArea
window.addEventListener ("load", function () {
    var input = document.getElementsByTagName ("textarea");
    input[0].addEventListener ("keydown", function () {
        currentcharpos = this.selectionStart;
    }, false);
}, false);

/**
  Shared Document API. None of the methods have been edited other than ReceiveUpdate
*/

Omlet.ready(function(){
   initDocument();
});

function ReceiveUpdate(doc) {
  myDoc = doc;
  for(key in myDoc) {
    console.log(key);
  }
  console.log("text: " + myDoc["text"]);
  text = JSON.parse(myDoc["text"]);
  if(firsttyped == false && text.length > 0) {
     saved = true;
  }
  document.getElementById('area1').value = text;
}

function Initialize(old, params) {
	return params;
}

function Update(old, params) {
	old.text = params["text"];
	return old;
	console.log("Updating!");
}

function InitialDocument() {
	var initValues = {
		'text' : "",
	};
	return initValues;
}

function DocumentCreated(doc) {
  	console.log("Document has been created.");
}

function DidNotReceiveUpdate(doc) {
	console.log("I did not receive an update");
}

/**
  Omlet Framework Code. Ignore everything below.
*/

var documentApi;
var myDoc;
var myDocId;

function watchDocument(docref, OnUpdate) {
    documentApi.watch(docref, function(updatedDocRef) {
        if (docref != myDocId) {
            console.log("Wrong document!!");
        } else {
            documentApi.get(docref, OnUpdate);
        }}, function(result) {
            var timestamp = result.Expires;
            var expires = timestamp - new Date().getTime();
            var timeout = 0.8 * expires;
            setTimeout(function() {
                watchDocument(docref, OnUpdate);
        }, timeout);
    }, Error);
}

function initDocument() {
    if (Omlet.isInstalled()) {
        documentApi = Omlet.document;
        _loadDocument();
  	}
}

function hasDocument() {
    var docIdParam = window.location.hash.indexOf("/docId/");
    return (docIdParam != -1);
}

function getDocumentReference() {
    var docIdParam = window.location.hash.indexOf("/docId/");
    if (docIdParam == -1) return false;
    var docId = window.location.hash.substring(docIdParam+7);
    var end = docId.indexOf("/");
    if (end != -1) {
      	docId = docId.substring(0, end);
    }
    return docId;
}

function _loadDocument() {
  	if (hasDocument()) {
    	  myDocId = getDocumentReference();
        documentApi.get(myDocId, ReceiveUpdate);
        watchDocument(myDocId, ReceiveUpdate);
    } else {
        documentApi.create(function(d) {
            myDocId = d.Document;
            location.hash = "#/docId/" + myDocId;
            documentApi.update(myDocId, Initialize, InitialDocument(),
            function() {
                documentApi.get(myDocId, DocumentCreated);
            }, function(e) {
                alert("error: " + JSON.stringify(e));
            });
            watchDocument(myDocId, ReceiveUpdate);
          }, function(e) {
            alert("error: " + JSON.stringify(e));
        });
  	}
}
