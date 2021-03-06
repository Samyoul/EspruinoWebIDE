/**
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
Author: Luis Leao (luisleao@gmail.com)
Author: Gordon Williams (gw@pur3.co.uk)
**/

var serial_lib=(function() {
  
  var connectionInfo;
  var readListener;
  var connectionChecker;
  var connectedPort;

  /** When connected, this is called every so often to check on the state
   of the serial port. If it detects a disconnection it calls the disconnectCallback
   which will force a disconnect (which means that hopefulyl chrome won't hog the
   serial port if we physically reconnect the board). */
  var checkConnection = function() {
    chrome.serial.getControlSignals(connectionInfo.connectionId, function (sigs) { 
      var connected = "cts" in sigs;
      if (!connected) {
        console.log("Detected Disconnect");
        if (connectionDisconnectCallback!=undefined)
          connectionDisconnectCallback();
      }
   });
  }
  
  var startListening=function(callback) {
    if (!connectionInfo || !connectionInfo.connectionId) {
      throw new "You must call openSerial first!";
    }
    readListener=callback;
    onCharRead();
  };

  var onCharRead=function(readInfo) {
    if (!readListener || !connectionInfo) {
      return;
    }
    if (readInfo && readInfo.bytesRead>0 && readInfo.data) {
      onRead(readInfo.data);
    }
    chrome.serial.read(connectionInfo.connectionId, 128, onCharRead);
  };

  var getPorts=function(callback) {
    chrome.serial.getPorts(callback);
  };
  
  var openSerial=function(serialPort, openCallback, disconnectCallback) {
    connectionDisconnectCallback = disconnectCallback;
    chrome.serial.open(serialPort, {bitrate: 9600}, 
      function(cInfo) {
        if (!cInfo || !cInfo.connectionId || cInfo.connectionId<0) {
          console.log("Could not find device (connectionInfo="+cInfo+")");
          if (openCallback) openCallback(undefined);
        } else {
          connectionInfo=cInfo;
          console.log(cInfo);
          if (openCallback) openCallback(cInfo);
          connectedPort = serialPort;
          connectionChecker = setInterval(checkConnection, 500);
        }        
    });
  };

  var writeSerial=function(str) {
    chrome.serial.write(connectionInfo.connectionId, str2ab(str), onWrite); 
  };
  
  var onWrite=function(obj) {
  };
  
  var onRead=function(readInfo) {
    if (readListener) readListener(readInfo);
  };

  var str2ab=function(str) {
    var buf=new ArrayBuffer(str.length);
    var bufView=new Uint8Array(buf);
    for (var i=0; i<str.length; i++) {
      bufView[i]=str.charCodeAt(i);
    }
    return buf;
  };
 
 
  var closeSerial=function(callback) {
   connectionDisconnectCallback = undefined;
   if (connectionChecker) {
     clearInterval(connectionChecker);
     connectedPort = undefined;
     connectionChecker = undefined;
   }
   if (connectionInfo) {
     chrome.serial.close(connectionInfo.connectionId, 
      function(result) {
        connectionInfo=null;
        if (callback) callback(result);
      });
    }
  };
   
  var isConnected = function() {
    return connectionInfo!=null && connectionInfo.connectionId>=0;
  };

  return {
    "getPorts": getPorts,
    "openSerial": openSerial,
    "isConnected": isConnected,
    "startListening": startListening,
    "writeSerial": writeSerial,
    "closeSerial": closeSerial
  };
})();
