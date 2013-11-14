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
    Espruino.Minify.init = function(){
        $(".minifyButton").button({ text:false, icons: { primary: "ui-icon-squaresmall-minus" } }).click(function(){
            $(".subform").hide();
            $("#divMinify").show();
            $("#minifyButton").unbind();
            $("#minifyButton").click(minify); 
        });   
    }; 
    function minify(){
        $("#compilation_level").val($("#minifyLevel").val());
        $("#js_code").val(codeEditor.getValue());
        $.post( "http://closure-compiler.appspot.com/compile", $( "#callMinify" ).serialize(),function(data){
            if($("input[name='sendMinify']:checked")[0]){
                var code = Espruino.General.codeEditor.getValue();
                codeEditor.setValue(data);
                $(".send").click();
                window.setTimeout(function(){
                    Espruino.General.codeEditor.setValue(code);
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
})();
