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
    var selectHTML;
    Espruino.Script.init = function(){
        $(".scriptsButton").button({ text: false, icons: { primary: "ui-icon-document" } }).click(function() {
            $("#scriptList").html(selectHTML);
            $(".subform").hide();
            $("#divScripts").show();
            $("#scripts").unbind();
            $("#scripts").change(loadScript);  
        });
        loadScripts("https://api.github.com/repos/espruino/Espruino/git/trees/master","code","blob");
    };  
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
                            selectHTML = html;
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
                Espruino.General.setEditorCode(window.atob(data.content.replace(/(\r\n|\n|\r)/gm,"")));
                $(".subform").hide();
            }).fail(function(a,b,c){console.log(a,b,c);});
        }
    }

})();