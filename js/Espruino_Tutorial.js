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
    Espruino.Tutorial.init = function(){
        $(".tutorialsButton").button({ text: false, icons: { primary: "ui-icon-comment" } }).click(function() {
            $("#scriptList").html(selectHTML);
            $(".subform").hide();
            $("#divScripts").show();
            $("#tutorials").unbind();
            $("#tutorials").change(loadTutorial);  
        });    
        loadTutorials("https://api.github.com/repos/espruino/EspruinoDocs/git/trees/master",["datasheets","devices","peripherals","tasks","tutorials"],"blob");
    }; 
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
                    selectHTML = html;
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
                        Espruino.General.setEditorCode(window.atob(data.content.replace(/(\r\n|\n|\r)/gm,"")));
                    }).fail(function(a,b,c){console.log(a,b,c);});
            }
        }
    }
})();
