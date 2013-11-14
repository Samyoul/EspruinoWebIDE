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
function initCodeMirrorAddons(codeEditor){
    CodeMirror.commands.autocomplete = function(cm) {CodeMirror.showHint(cm, CodeMirror.hint.javascript);};
    codeEditor.on("contextmenu",cursorMoved);
    function cursorMoved(cm,evt){ 
        if(cm.somethingSelected()){console.log(cm.getSelection());}
        else{
            var re =  /[\w$]/ ;
            var cur = cm.getCursor(), line = cm.getLine(cur.line), start = cur.ch, end = start;
            while (start && re.test(line.charAt(start - 1))) --start;
            while (end < line.length && re.test(line.charAt(end))) ++end;
        }
    }
}
function initButtons(codeEditor){
    var selectSnippets, selectScripts, selectTutorials, selectBoards;
    var dataSnippets, dataScripts, dataTutorials;
    var info,chip,board,devices,pins,deviceTypes;
    deviceTypes = {"ADC":"ADC","BLUETOOTH":"BLUETOOTH","BOOT":"BOOT","CAN":"CAN","DAC":"DAC",
        "I2C":"I2C","LCD":"LCD","POT":"POT","PWM":"TIM","SD CARD":"SD","SPI":"SPI",
        "TOUCH":"TOUCHSCREEN","UART":"UART","USART":"USART","USB":"USB"};
    loadSnippets();
    loadScripts("https://api.github.com/repos/espruino/Espruino/git/trees/master","code","blob");
    loadTutorials("https://api.github.com/repos/espruino/EspruinoDocs/git/trees/master",["datasheets","devices","peripherals","tasks","tutorials"],"blob");
    loadBoards("https://api.github.com/repos/espruino/Espruino/git/trees/master","boards","blob");
    $(".document").button({ text: false, icons: { primary: "ui-icon-document" } }).click(function() {
        $("#scriptList").html(selectScripts);
        $(".subform").hide();
        $("#divScripts").show();
        $("#scripts").unbind();
        $("#scripts").change(loadScript);  
    });
    $(".comment").button({ text: false, icons: { primary: "ui-icon-comment" } }).click(function() {
        $("#scriptList").html(selectTutorials);
        $(".subform").hide();
        $("#divScripts").show();
        $("#tutorials").unbind();
        $("#tutorials").change(loadTutorial);  
    });
    $(".script").button({ text: false, icons: { primary: "ui-icon-script" } }).click(function() {
        $("#scriptList").html(selectSnippets);
        $(".subform").hide();
        $("#divScripts").show();
        $("#snippets").unbind();
        $("#snippets").change(loadSnippet);                
    });
    $(".minify").button({ text:false, icons: { primary: "ui-icon-squaresmall-minus" } }).click(function(){
        $(".subform").hide();
        $("#divMinify").show();
        $("#minifyButton").unbind();
        $("#minifyButton").click(minify); 
    });
    $(".board").button({ text:false, icons: { primary: "ui-icon-wrench" } }).click(function(){
        $(".subform").hide();
        $("#divBoards").show();
        $("#boards").unbind();
        $("#boards").change(loadBoard);
    });
    $("#divcode").click(function(){$(".subform").hide();});
    $("#terminal").click(function(){$(".subform").hide();});
    function loadSnippets(){
        $.getJSON("data/snippets.txt",function(data){
            dataSnippets = data;
            var snippet,html = "<select id=\"snippets\">";
            html += "<option value=\"\">select a snippet</option>";
            for(var i = 0; i < data.snippetGroups.length; i++){
                html +="<optgroup label=\"" + data.snippetGroups[i].description + "\" />";
                for(var j = 0; j < data.snippetGroups[i].snippets.length; j++){
                    snippet = data.snippets[data.snippetGroups[i].snippets[j]];
                    html += "<option value=\"" + data.snippetGroups[i].snippets[j] + "\">" + snippet.description + "</option>";
                }
                html += "</optgroup>";
            }
            html += "</select>";
            selectSnippets = html;
        }).fail(function(a,b,c){console.log(a,b,c);});
    }
    function loadSnippet(){
        var snippet,code,selected = $("#snippets option:selected")[0];
        if(selected.value.length > 0){
            snippet = dataSnippets.snippets[selected.value];
            code = snippet.code.join("\n") + "\n";
            if(snippet.params){ replaceParams(code,snippet.params); }             
            else{setEditorCode(code);}            
        }
        $(".subform").hide();
        function replaceParams(code,params){
            var i = 0;
            createDivDevicesList();
            function createDivDevicesList(){
                var device,html;
                device = devices[params[i].deviceType];
                var html = "<select rows=\"5\" id=\"devicesList\">";
                html += "<option value=\"\">select port</option>";
                for(var j in device){
                    html += "<option value=\"" + j + "\">" + j + "</option>";
                }
                html += "</select>";
                $('<div id="deviceSelector">' + html + '</div>').css(
                    { position: 'absolute',display: 'none',top: 30,left: 250,
                      border: '1px solid #fdd',padding: '2px','background-color': '#fee'
                    }
                ).appendTo("body").fadeIn(200);
                $("#devicesList").change(nextParam);
            }
            function nextParam(){
                var val = $("#devicesList option:selected")[0].value;
                $("#deviceSelector").remove();
                //code = code.replace(/\$LED\$/g,val);
                code = code.replace(new RegExp("\\$" + params[i].placeHolder + "\\$","g"),val);
                i++;
                if(i < params.length){
                    createDivDevicesList();
                }
                else{ setEditorCode(code);}
            }
        }
    }
    function loadBoards(dir,subdir,fileType){
        var board,html = "<select id=\"boards\">";
        html += "<option value=\"\">select a board</option>";
        $.getJSON(dir,function(data){
            for(var i = 0; i < data.tree.length; i++){
                if(data.tree[i].path === subdir){
                    $.getJSON(data.tree[i].url,function(data){
                        for(var j = 0; j < data.tree.length; j++){
                            board = data.tree[j];
                            if(board.type === fileType){
                                html += "<option value=\"" + board.url + "\">" + board.path.substr(0,board.path.lastIndexOf(".")) + "</option>";
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
                var pinsParam,ldata;
                ldata = window.atob(data.content.replace(/(\r\n|\n|\r)/gm,""));
                info = $.parseJSON(searchObject(ldata,"info =","};"));
                chip = $.parseJSON(searchObject(ldata,"chip =","};"));
                board = $.parseJSON(searchObject(ldata,"board =","};"));
                devices = $.parseJSON(searchObject(ldata,"devices =","};"));
                pinsParams = searchText(ldata,"pins =",")");
                pinsParams = searchText(pinsParams,"(",")");
                pinsParams = pinsParams.replace("(","").replace(")","").split(",");
                loadPins("https://api.github.com/repos/espruino/Espruino/git/trees/master","boards","pins",pinsParams);
            }).fail(function(a,b,c){console.log(a,b,c);});
        }
        else{
            info = {}; chip = {}; board = {}; devices = {}; pins = [];
        }
        function searchObject(data,start,end){
            var t = data.substr(data.indexOf(start));
            t = t.substr(0,t.indexOf(end)) + "}";
            t = t.replace(/# .*\n/g,"\n");
            t = t.replace(/,\s*}/g,"\n}");
            t = t.replace(/'/g,"\"");
            t = t.substr(start.length);
            return t;
        }
        function searchText(data,start,end){
            var t = data.substr(data.indexOf(start));
            t = t.substr(0,t.indexOf(end)+1);
            return t;
        }
    }
    function loadPins(dir,subdir,pinsdir,pinParams){       
        $.getJSON(dir,function(data){
            var pinFile = pinParams[1].replace(/\'/g,"").trim();
            for(var i = 0; i < data.tree.length; i++){
                if(data.tree[i].path === subdir){
                    $.getJSON(data.tree[i].url,function(data){
                       for(var j = 0; j < data.tree.length; j++){
                           if(data.tree[j].path === pinsdir){
                               $.getJSON(data.tree[j].url,function(data){
                                   for(var k = 0; k < data.tree.length; k++){
                                       if(data.tree[k].path === pinFile){
                                           $.getJSON(data.tree[k].url,function(data){
                                               pinsLoaded(data,pinParams,chip.package);
                                           }).fail(function(a,b,c){ console.log("error ",a,b,c);});
                                       }
                                   }
                               });
                           }
                       } 
                    });
                }
            }
        });
        function pinsLoaded(data,pinParams,package){
            var pinFile,pinNameNr,pinFunc1Nr,pinFunc2Nr,packageNr,ldata,ldevice;
            ldata = window.atob(data.content.replace(/(\r\n|\n|\r)/gm,""))
            var lines = ldata.split("\n");
            pinFile = pinParams[1].replace(/\'/g,"").trim();
            pinNameNr = parseInt(pinParams[2]);
            pinFunc1Nr = parseInt(pinsParams[3]);
            pinFunc2Nr = parseInt(pinsParams[4]);
            for(var i = 0; i < lines[0].length; i++){ if(lines[0].split(",")[i] === package){packageNr = i;}}
            pins = [];
            for(var i = 1; i < lines.length; i++){
                var line = lines[i].split(",");
                if(line.length >= (pinFunc2Nr - 1)){
                    if(parseInt(line[packageNr]) !== 0){
                        var funcs = [];
                        if(line[pinFunc1Nr].length > 0){funcs = $.merge(funcs,line[pinFunc1Nr].split("/"));}
                        if(line[pinFunc2Nr].length > 0){funcs = $.merge(funcs,line[pinFunc2Nr].split("/"));}
                        pins.push({pin:line[pinNameNr],functions:funcs});
                    }
                }
            }
            for(var i in deviceTypes){
                ldevice = getDevices(deviceTypes[i]);
                if($.isEmptyObject(ldevice) === false){devices[i] = ldevice; }
            }
            var leds = {};
            if(devices.LED1){leds["LED1"] = devices.LED1; delete(devices.LED1);}
            if(devices.LED2){leds["LED2"] = devices.LED2; delete(devices.LED2);}
            if(devices.LED3){leds["LED3"] = devices.LED3; delete(devices.LED3);}
            if(devices.LED4){leds["LED4"] = devices.LED4; delete(devices.LED4);}
            devices["LED"] = leds;
            setDeviceList();
        }
        function setDeviceList(){
            var html = "<select id=\"devices\">";
            html += "<option value=\"\">select ports</option>";
            for(var i in devices){
                html += "<option value=\"" + i + "\">" + i + "</option>";
            }
            html += "</select>";
            $(".subform").hide();
            $("#deviceTypes").html(html);
            $("#devices").unbind();
            $("#devices").change(showDevices);
        }
        function showDevices(){
            var html,devs,deviceType = $("#devices option:selected")[0].value;
            $("#deviceTooltip").remove();
            if(deviceType.length > 0){
                html = deviceType;
                for(var i in devices[deviceType]){
                    if(typeof devices[deviceType][i] === "string"){
                        html += "<li>" + i + " : " + devices[deviceType][i] + "</li>";
                    }
                    else{
                        html +="<ul>" + i;
                        for(var j in devices[deviceType][i]){
                            html += "<li>" + j + " : " + devices[deviceType][i][j] + "</li>";
                        }
                        html +="</ul>";
                    }
                }
                $('<div id="deviceTooltip" class="subform">' + html + '</div>').css(
                    { position: 'absolute',display: 'none',top: 30,left: 250,
                      border: '1px solid #fdd',padding: '2px','background-color': '#fee'
                    }
                ).appendTo("body").fadeIn(200);
            }
        }
        function getDevices(deviceType){
            var deviceTypes = getDeviceDistinct(deviceType);
            for(var i in deviceTypes){
                deviceTypes[i] = getDevicePins(i);
            }
            return deviceTypes;
        }
        function getDeviceDistinct(deviceType){
            var deviceParts, device = {};
            for(var i = 0; i < pins.length; i++){
                for(var j = 0; j < pins[i].functions.length; j++){
                    deviceParts = pins[i].functions[j].split("_");
                    if(deviceParts[0].substr(0,deviceType.length) === deviceType){
                        if(!device[deviceParts[0]]){ device[deviceParts[0]] = {}; }
                    }
                }
            }
            return device;
        }
        function getDevicePins(dev){
            var deviceParts,devicePins = {};
            for(var i = 0; i < pins.length; i++){
                for(var j = 0; j < pins[i].functions.length; j++){
                    deviceParts = pins[i].functions[j].split("_");
                    if(deviceParts[0] === dev){
                        if(deviceParts.length > 1){
                            devicePins[deviceParts[1]] = pins[i].pin;
                        }
                        else{devicePins[pins[i].pin] = pins[i].pin;}
                    }
                }
            }
            return devicePins;
        }
    }
    function loadScripts(dir,subdir,fileType){
        var html = "<select id=\"scripts\">";
        html += "<option value=\"\">select a script</option>";
        $.getJSON(dir,
            function(data){
                for(var i = 0; i < data.tree.length; i++){
                    if(data.tree[i].path === subdir){
                        $.getJSON(data.tree[i].url,function(data){
                            for(var j = 0; j < data.tree.length; j++){
                                if(data.tree[j].type === fileType){
                                    html += "<option value=\"" + data.tree[j].url + "\">" + data.tree[j].path + "</option>"; 
                                }
                            }
                            html += "</select>";
                            selectScripts = html;
                        });
                    }
                }
            }
        );
    }
    function loadScript(){
        var url = $("#scripts option:selected")[0].value;
        if(url){
            $.getJSON(url, function(data){
                setEditorCode(window.atob(data.content.replace(/(\r\n|\n|\r)/gm,"")));
                $(".subform").hide();
            }).fail(function(a,b,c){console.log(a,b,c);});
        }
    }
    function loadTutorials(dir,subdirs,fileType){
        var maxWait = 5000,trees = {};
        $.getJSON(dir,
            function(data){
                var defs = [];
                for(var i = 0; i < subdirs.length; i++ ){
                    for(var j = 0; j < data.tree.length; j++){
                        if(data.tree[j].path === subdirs[i]){
                            defs.push(loadTree(data.tree[j]));
                        }
                    }
                }
                if(defs.length > 0) {$.when.apply(null,defs).then(function(){createSelect();});}
                function createSelect(){
                    html = "<select id=\"tutorials\">";
                    html += "<option value=\"\">Select a tutorial</option>";
                    for(var t in trees){
                        tree = trees[t];
                        html += "<optgroup label=\"" + t + "\">";
                        for(var k = 0; k < tree.length; k++){
                            if(tree[k].type === fileType){
                                var v = tree[k].path.substr(tree[k].path.lastIndexOf("."));
                                if(v === ".js"){ html += "<option value=\"" + tree[k].url + "\">" + tree[k].path + "</option>"; }
                                else{html += "<option value=\"" + t + "/" + tree[k].path + "\">" + tree[k].path + "</option>";}
                            }   
                        }
                        html += "</optgroup>";
                    }
                    html += "</select>";
                    selectTutorials = html;
                }      
            }
        );
        function loadTree(ghTree){
            var dfd = $.Deferred(),t;
            t = setInterval(function(){clearInterval(t);dfd.reject();},maxWait);
            $.getJSON(ghTree.url,function(data){
                trees[ghTree.path] = data.tree;
                dfd.resolve();
            });
            return dfd.promise();
        }
    }
    function loadTutorial(){
        var url,w,x,t,v = $("#tutorials option:selected")[0].value;
        $(".subform").hide();
        if(v){
            t = $("#tutorials option:selected")[0].text;
            x = t.substr(t.lastIndexOf("."));
            switch(x){
                case ".md":
                    url = "https://github.com/espruino/EspruinoDocs/tree/master/" + v;
                    w = window.open(url,"_blank");w.focus();break;
                case ".pdf":
                    url = "https://github.com/espruino/EspruinoDocs/raw/master/" + v;
                    w = window.open(url,"_blank");w.focus();break;
                case ".js":
                    url = v;
                    $.getJSON(url, function(data){
                        setEditorCode(window.atob(data.content.replace(/(\r\n|\n|\r)/gm,"")));
                    }).fail(function(a,b,c){console.log(a,b,c);});
            }
        }
    }
    function minify(){
        $("#compilation_level").val($("#minifyLevel").val());
        $("#js_code").val(codeEditor.getValue());
        $.post( "http://closure-compiler.appspot.com/compile", $( "#callMinify" ).serialize(),function(data){
            if($("input[name='sendMinify']:checked")[0]){
                var code = codeEditor.getValue();
                codeEditor.setValue(data);
                $(".send").click();
                window.setTimeout(function(){
                    codeEditor.setValue(code);
                    $("#divMinify").hide();
                },1000);
            }
            else{
                var w = window.open("","_blank");
                w.document.write("<textarea rows=\"8\" cols=\"60\">" + data + "</textarea>");
                $(".subform").hide();
            }
        },"text" ).fail(function(a,b,c){alert(a);});
    }
    function setEditorCode(code){
        if($("input[name='replaceInEditor']:checked")[0]){codeEditor.setValue(code);}
        else{ codeEditor.setValue(codeEditor.getValue() + "\n" + code); }
    }
}
