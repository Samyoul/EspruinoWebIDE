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
    var selectSnippets, selectScripts, selectTutorials;
    var dataSnippets, dataScripts, dataTutorials;
    loadSnippets();
    loadScripts("https://api.github.com/repos/espruino/Espruino/git/trees/master","code","blob");
    loadTutorials("https://api.github.com/repos/espruino/EspruinoDocs/git/trees/master",["datasheets","devices","peripherals","tasks","tutorials"],"blob");
    $(".document").button({ text: false, icons: { primary: "ui-icon-document" } }).click(function() {
        $("#scriptList").html(selectScripts);
        window.setTimeout(function(){
          $("#divScripts").show();
          $("#divMinify").hide();
          $("#scripts").unbind();
          $("#scripts").change(loadScript);  
        },50)
    });
    $(".comment").button({ text: false, icons: { primary: "ui-icon-comment" } }).click(function() {
        $("#scriptList").html(selectTutorials);
        window.setTimeout(function(){
          $("#divScripts").show();
          $("#divMinify").hide();
          $("#tutorials").unbind();
          $("#tutorials").change(loadTutorial);  
        },50);
    });
    $(".script").button({ text: false, icons: { primary: "ui-icon-script" } }).click(function() {
        $("#scriptList").html(selectSnippets);
        window.setTimeout(function(){
          $("#divScripts").show();
          $("#divMinify").hide();
          $("#snippets").unbind();
          $("#snippets").change(loadSnippet);                
        },50);
    });
    $(".minify").button({ text:false, icons: { primary: "ui-icon-squaresmall-minus" } }).click(function(){
       $("#divMinify").show();
       $("#divScripts").hide();
       $("#minifyButton").unbind();
       $("#minifyButton").click(minify); 
    });
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
        var snippet,selected = $("#snippets option:selected")[0];
        if(selected.value.length > 0){
            snippet = dataSnippets.snippets[selected.value].code.join("\n") + "\n";               
            setEditorCode(snippet);
        }
        $("#divScripts").hide();
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
        $.getJSON(url, function(data){
            setEditorCode(window.atob(data.content.replace(/(\r\n|\n|\r)/gm,"")));
            $("#divScripts").hide();
        }).fail(function(a,b,c){console.log(a,b,c);});
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
        $("#divScripts").hide();
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
                $("#divMinify").hide();
            }
        },"text" ).fail(function(a,b,c){alert(a);});
    }
    function setEditorCode(code){
        if($("input[name='replaceInEditor']:checked")[0]){codeEditor.setValue(code);}
        else{ codeEditor.setValue(codeEditor.getValue() + "\n" + code); }
    }
}
