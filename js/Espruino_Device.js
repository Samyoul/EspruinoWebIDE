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
(function(){
    var devices,layout,layoutCSS;
    Espruino.Device.init = function(){
        $(".devicesButton").button({ text:false, icons: { primary: "ui-icon-wrench" } }).click(function(){
            $(".subform").hide();
            $("#divBoards").show();
            $("#boards").unbind();
            $("#boards").change(loadBoard);
        });
        $(".replacePins").button({ text:false, icons: { primary: "ui-icon-calculator" } }).click(function(){replacePins();});
        $(".connectionList").button({ text:false, icons: { primary: "ui-icon-document-b" } }).click(function(){connectionList();});
        loadBoards("https://api.github.com/repos/espruino/Espruino/git/trees/master","boards","blob");
    }; 
    Espruino.Device.PinListByType = function(param,preSelect,pinsInUse){
        var pins,html,pinTypes = param.split(",");
        if(devices){
            if(devices[pinTypes[0]]){
                if(devices[pinTypes[0]][pinTypes[1]]){
                    pins = devices[pinTypes[0]][pinTypes[1]];
                    html = "<select size=\"5\" id=\"devicesList\">";
                    html += "<option value=\"\">select port</option>";
                    for(var j in pins){
                        html += "<option value=\"" + pins[j] + "\"";
                        if(pins[j] === preSelect){ html += " selected"; }
                        html += ">" + pins[j];
                        if(pinsInUse){ if($.inArray(pins[j],pinsInUse) >= 0){ html += " (used)"}}
                        html += "</option>";
                    }
                    html += "</select>";
                }
                else{ html = "Board does not support this I/O function";}
            }
            else{ html = "Board does not support this I/O"; }
        }
        else{ html = "no Board selected"; }
        return html;
    }
    Espruino.Device.getPinsInUse = function (){
        var actparam,params,r = [];
        params = Espruino.General.codeEditor.getValue().match(Espruino.General.pinRegExp);
        if(params !== null){
            for(var i = 0; i < params.length; i++){
                actParam = params[i].substring(params[i].indexOf("*/") + 2).trim();
                actParam = actParam.substring(0,actParam.length - 1);
                r.push(actParam);
            }
        }
        return r;
    }
    function connectionList(){
        var params,pin,doc,line,pins = [],start,end;
        doc = Espruino.General.codeEditor;
        params = doc.getValue().match(Espruino.General.pinRegExp);
        if(params !== null){
            for(var i = 0; i < doc.lineCount(); i++){
                line = doc.getLine(i);
                for(var j = 0; j < params.length; j++){
                    start = line.indexOf(params[j]);
                    if(start > 0){
                    end = start + params[j].length;
                        pin = params[j].substring(params[j].indexOf("*/") + 2,params[j].length - 1).trim();
                        for(var k = 0; k < pins.length; k++){
                            if(pins.pin === pin){
                                if(pins[i].comment){ pins[i].comment = pins[i].comment + "\nused also in line " + (i + 1).toString();}
                                else{pins[i]["comment"] = "used also in line " + (i + 1).toString(); }
                            }
                        }
                        pins.push({pin:pin,line:line,lineNr:i + 1,start:start,end:end});
                    }
                }
            }
        }
        $("#conectionImage").remove();
        $('<div id="connectionImage" class=\"subform\" style=\"z-index:5\">' + showPinsImage(pins) + '</div>').css(
            { position: 'absolute',display: 'none',top: 30,left: 200,
              border: '1px solid #fdd',padding: '2px','background-color': '#fee'
            }
        ).appendTo("body").fadeIn(200);
        $(".connection").unbind();
        $(".connection").click(Espruino.General.setEditorLine);
    }
    function showPinsImage(pins){
        var connectorLayout,l,lCSS,html,x,y;
        if(layoutCSS){html = "<img src=\"" + layoutCSS.imageUrl + "\">";}
        else{ html = "<h3>no board selected (yet?)</h3>"};
        if(pins.length > 0){
            for(var connector in layout){
                l = layout[connector];
                lCSS = layoutCSS[connector];
                x = lCSS.left;
                y = lCSS.top;
                for(var i = 0; i < l.length; i++){
                    for(var k = 0; k < pins.length; k++){
                        if(pins[k].pin === l[i]){
                            html += "<div style=\"position:absolute;background-color:#f4f;z-index:1; top:" + y + "px; left:" + x + "px;\">";
                            html += "<font class=\"connection\" size=\"-2\" title=\"" + pins[k].lineNr + "\"";
                            html += "start=\"" + pins[k].start + "\" end=\"" + pins[k].end + "\">" + pins[k].pin + "</font></div>";
                        }
                    }
                    switch(lCSS.orientation){
                        case "vertical":y += lCSS.size;break;
                        case "horizontal":x += lCSS.size;break;
                    }
                }
            }
        }
        return html;
    }
    function replacePins(){
        var params,code;
        code = Espruino.General.codeEditor.getValue();
        params = code.match(Espruino.General.pinRegExp);
        if(params !== null){ Espruino.General.replaceParams(code,params,true); }
    }
    function loadBoards(dir,subdir,fileType){
        var board,html = "<select bgcolor=\"red\" id=\"boards\">";
        html += "<option value=\"\">select a board</option>";
        html += "<option value=\"data/ESPRUINOBOARD.json\">Espruino V1_3</options>";
        $.getJSON(dir,function(data){
            for(var i = 0; i < data.tree.length; i++){
                if(data.tree[i].path === subdir){
                    $.getJSON(data.tree[i].url,function(data){
                        for(var j = 0; j < data.tree.length; j++){
                            board = data.tree[j];
                            if(board.type === fileType){
                                html += "<option value=\"\">" + board.path.substr(0,board.path.lastIndexOf(".")) + "</option>";
                            }
                        }
                        html += "</select>";
                        selectBoards = html;
                        $("#divBoards").html(html);
                        $("#boards").change(loadBoard);
                    });
                }
            }
        });
    }
    function loadBoard(){
        var url = $("#boards option:selected")[0].value;
        if(url){
            $.getJSON(url, function(data){
                layout = data.layout;
                layoutCSS = data.layoutCSS;
                devices = getFunctionTree(data);
                setDeviceTypes();                
            }).fail(function(a,b,c){console.log(a,b,c);});
            function getFunctionTree(data){
                var sf = {},pinsi,pinssf,pinParts,pinType,src;
                for(var i = 0; i < data.pins.length; i++){
                    pinsi = data.pins[i];
                    if(checkPinAvailable() === true){
                        for(var j in pinsi.simplefunctions){
                            pinsisf = pinsi.simplefunctions[j];
                            if(j !== "DEVICE"){ getSimplePins(); }
                            else{ getDevicePins();}
                        }
                    }
                }
                return sf;
                function checkPinAvailable(){
                    var r = false;
                    for(var i in data.layout){
                        if($.inArray(pinsi.name,data.layout[i]) >= 0){ r = true;}
                    }
                    return r;
                }
                function getSimplePins(){
                    if(!sf[j]){sf[j] = {};}
                    for(k = 0; k < pinsisf.length; k++){
                        pinParts = pinsisf[k].split("_");
                        if(pinParts.length > 0) { pinType = pinParts[1]; }
                        else { pinType = pinParts[0]; }
                        if($.isNumeric(pinType.substr(pinType.length - 2,1)) === true){ 
                            pinType = pinType.substr(0,pinType.length - 2);
                        }
                        if($.isNumeric(pinType.substr(pinType.length - 1)) === true){
                            pinType = pinType.substr(0,pinType.length - 1);
                        }
                        if(!sf[j][pinType]){ sf[j][pinType] = []; }
                        if($.inArray(pinsi.name,sf[j][pinType]) < 0){ sf[j][pinType].push(pinsi.name); }
                    }
                }
                function getDevicePins(){
                    grp = pinsisf[0];
                    if($.isNumeric(grp.substr(grp.length - 1)) === true){ grp = grp.substr(0,grp.length-1); }
                    if(!sf[grp]){sf[grp] = {};}
                    pinType = pinsi.functions[pinsisf[0]];
                    if(!sf[grp][pinType]){ sf[grp][pinType] = []; }
                    if($.inArray(pinsi.name,sf[grp][pinType]) < 0){ sf[grp][pinType].push(pinsi.name); }
                }   
            }
        }
    }
    function setDeviceTypes(){
        var html = "<select id=\"deviceType\">";
        html += "<option value=\"\">Select device</option>";
        for(var device in devices){
            html += "<option value=\"" + device + "\">" + device + "</option>";
        }
        html += "</select>";
        $("#deviceTypes").html(html);
        $(".subform").hide();
        $("#deviceType").unbind();
        $("#deviceType").change(deviceTooltip);
    }
    function deviceTooltip(){
        var html = "",device = devices[$("#deviceType option:selected")[0].value];
        $(".subform").hide();
        for(pinType in device){
            html += "<ul>" + pinType;
            for(var i = 0; i < device[pinType].length; i++){
                html += "<li>" + device[pinType][i] + "</li>";
            }
            html += "</ul>";
        }
        $('<div id="deviceSelector" class=\"subform\">' + html + '</div>').css(
            { position: 'absolute',display: 'none',top: 30,left: 240,
              border: '1px solid #fdd',padding: '2px','background-color': '#fee'
            }
        ).appendTo("body").fadeIn(200);
    }
})();
