/*
 * The MIT License

Copyright (c) 2013 by Juergen Marsch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var Espruino = {};
Espruino["General"] = {};
Espruino["Script"] = {};
Espruino["Tutorial"] = {};
Espruino["Snippet"] = {};
Espruino["Device"] = {};
Espruino["Minify"] = {};
Espruino.General.pinRegExp = /\/\*.+?\*\/.+?(,|\)|\])/g;
Espruino.General["setEditorCode"] = function(code,mode){
    if(!mode){mode = $("input[name='replaceInEditor']:checked")[0];}
    if(mode){Espruino.General.codeEditor.setValue(code);}
    else{ Espruino.General.codeEditor.setValue(Espruino.General.codeEditor.getValue() + "\n" + code); }
};
Espruino.General["replaceParams"] = function(code,params,mode){
    var i = 0,t,actParam,paramDelimiter,paramPos = 0,pinType,pinsInUse = [];
    pinsInUse = Espruino.Device.getPinsInUse();
    createDivDevicesList();
    function createDivDevicesList(){
        pinType = params[i].substring(2,params[i].indexOf("*/")).trim();
        actParam = params[i].substring(params[i].indexOf("*/") + 2).trim();
        paramDelimiter = actParam.substr(actParam.length - 1);
        actParam = actParam.substring(0,actParam.length - 1);
        paramPos = code.indexOf(params[i]);
        var html = "<table><tr><td>" + Espruino.Device.PinListByType(pinType,actParam,pinsInUse) + "</td>";
        html += "<td><button id=\"cancelParam\">Cancel</button><br><button id=\"skipParam\">Skip</button></td>";
        html += "</tr>";
        html += "<tr><td colspan=\"2\"><textarea  style=\"font-size:x-small\"cols=\"80\" rows=\"6\" id=\"codeToReplace\">" + code + "</textarea></td></tr>";
        html +="</table>";
        $("#devicesList").unbind();
        $('<div id="deviceSelector" style=\"z-index:5\">' + html + '</div>').css(
            { position: 'absolute',display: 'none',top: 30,left: 50,
              border: '1px solid #fdd',padding: '2px','background-color': '#0f0',
            }
        ).appendTo("#divcode").fadeIn(200);
        $("#codeToReplace").focus(function(){
            this.selectionStart = paramPos;
            this.selectionEnd = paramPos + params[i].length;
        });
        $("#codeToReplace").focus();
        $("#devicesList").change(nextParam);
        $("#cancelParam").click(breakParam);
        $("#skipParam").click(nextParam);
        t = window.setTimeout(function(){
            Espruino.General.setEditorCode(code,mode);
            $("#deviceSelector").remove();
        },10000)
    }
    function breakParam(){
        window.clearTimeout(t);
        $("#deviceSelector").remove();
        Espruino.General.setEditorCode(code,mode);
    }
    function skipParam(){
        window.clearTimeout(t);
        i++;
        if(i < params.length){createDivDevicesList();}
        else{ Espruino.General.setEditorCode(code,mode);}
    }
    function nextParam(){
        var vals = $("#devicesList option:selected");
        $("#deviceSelector").remove();
        window.clearTimeout(t);
        if(vals.length > 0){code = code.replace(params[i],"/*" + pinType + "*/" + vals[0].value + paramDelimiter);}
        i++;
        if(i < params.length){createDivDevicesList();}
        else{ Espruino.General.setEditorCode(code,mode);}
    }
}
Espruino.General["init"] = function(codeEditor){
    Espruino.General["codeEditor"] = codeEditor;
    Espruino.Script.init();
    Espruino.Tutorial.init();
    Espruino.Snippet.init();
    Espruino.Device.init();
    Espruino.Minify.init();
    $(".infoButton").button({ text: false, icons: { primary: "ui-icon-info" } }).click(function() {
        $.get("info/info.txt",function(data){
            $('<div style="z-index:99" id="connectionImage" class=\"subform\">' + data + '</div>').css(
                { position: 'absolute',display: 'none',top: 100,left: 400,
                  border: '1px solid #fdd',padding: '2px','background-color': '#88f'
                }
            ).appendTo("body").fadeIn(200);        
        },"text").fail(function(a,b,c){console.log(a,b,c);});
    });
    $("#divcode").click(function(){$(".subform").hide();});
    $("#terminal").click(function(){$(".subform").hide();});
    CodeMirror.commands.autocomplete = function(cm) {CodeMirror.showHint(cm, CodeMirror.hint.javascript);};
    codeEditor.on("contextmenu",cursorMoved);
    function cursorMoved(cm,evt){ 
        if(cm.somethingSelected()){console.log(cm.getSelection());}
        else{
            var re =  /[\w$]/ ;
            var cur = cm.getCursor(), line = cm.getLine(cur.line), start = cur.ch, end = start;
            while (start && re.test(line.charAt(start - 1))) --start;
            while (end < line.length && re.test(line.charAt(end))) ++end;
            console.log(line.substring(start,end));
        }
    }
};
Espruino.General.setEditorLine = function(){
    var lineNr,start,end;
    lineNr = parseInt(this.title) - 1;
    start = parseInt($(this).attr("start"));
    end = parseInt($(this).attr("end")) - 1;
    Espruino.General.codeEditor.setSelection({line:lineNr,ch:start},{line:lineNr,ch:end});
}
$.fn.selectRange = function(start, end) {
    if(!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

