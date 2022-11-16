/**
 * @author : 홍두표(artisthong@dongwha.com)
 * @date : 2022.08.08 12:40
 * @content 
 *      웹앱용, 웹상에서 네이티브 메소드 호출 브릿지
 *      안드로이드 / iOS 공통 호출 규약
 *      
 *      DWAPI.post(arr,callback)
 * @params
 *      arr :배열형태로 파마미터를 넘깁니다. 
 *        배열에 들어갈 규칙은 아래와 같습니다.
 *        [(string)호출메소드, (ruled type)파라미터1, (ruled type)파라미터2 ...]
 *        ex1) DWAPI.post(["setPopToast","토스트메세지입니다."])
 *        ex2) DWAPI.post(["callSystemBrowser","https://daum.net"]);
 * 
 *      callback : 네이티브로부터 처리된 결과값을 리턴 받아 처리하는 콜백함수입니다.. 
 *        ex3) DWAPI.post(["getStorageData","test"],function(msg){alert(msg)});
 *        ex4) DWAPI.post(["getStoragee2hiuf","test"],function(msg){alert(msg)});  

 */
(function(window, undefined) {
    window.promises = {};
    //iOS 에서 실행한 동화웹뷰
    if (navigator.userAgent.indexOf("DWWV iOS") != -1){
        window.DWNAPI = webkit.messageHandlers.DWNAPI;
    }
    //동화웹뷰상에서 실행 
    if (navigator.userAgent.indexOf("DWWV") != -1){
        window.DWAPI = {
            post : function(arr,_cb) {
                DWAPI.postMessage(arr,_cb).then(
                    //resolve
                    function(res){
                        console.log(res);
                        if(typeof(_cb)=="function"){
                            try{
                                _cb(JSON.parse(res));
                            }
                            catch(e){
                                _cb(res);
                            }                            
                        }                        
                    },
                    //reject
                    function(err){
                        console.log(err);
                        if(typeof(_cb)=="function"){
                            try{
                                _cb(JSON.parse(err));
                            }
                            catch(e){
                                _cb(err);
                            }
                        }                       
                    }
                )
            },
            //post 함수에서 호출(직접적으로 되도록 호출하지 말것.)
            postMessage : function(arr){
                var promise = new Promise(function(resolve, reject) {
                    var idx = Object.keys(window.promises).filter(function(a){return a==arr[0]}).length+1;
                    arr.push(idx);
                    promises[arr[0]+idx] = {resolve,reject};
                    try{
                        window.DWNAPI.postMessage(arr);
                    }
                    catch(e){
                        console.log(e);
                    }
                });
                return promise;
            },
            //postMessage Promise 에 의한 리턴함수 실행 
            returnedMessage : function(name,data,err){
                if(err){
                    promises[name].reject(data);
                }
                else {
                    promises[name].resolve(data);
                }  
                delete promises[name];      
            }
        },
        //PUSH 터치이벤트시 호출
        /**
         * 푸시리시버 JS 영역으로 Native단에서 푸시터치이벤트 발생시 onRecvNotification을 호출함 
         * 화면단의 공통영역에 onDWPushDeepLinkProc 함수를 선언해주고 사전 협의된 규칙에 따라 로직 전개 
         * @param {*} data : 푸시정보 페이로드 
         */
        window.onRecvNotification = function(data) {
            console.log("push data", data);
            var dataExt = "";
            if (data.EXT) {
                dataExt = data.EXT;
            } else {
                //iphone 의 경우 mps로 탐.
                if (data.payload.EXT) {
                    dataExt = data.payload.EXT;
                } else {
                    dataExt = data.payload.mps.ext;
                }
            }
            var extArr = [];
            if(dataExt){
                extArr = dataExt.split("|");
                if(typeof(onPushDeepLinkProc)=="function"){
                    onDWPushDeepLinkProc(extArr);
                }                    
            }                               
        }      
    }
         
})(window);
