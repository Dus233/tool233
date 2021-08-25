//notation: js file can only use this kind of comments
//since comments will cause error when use in webview.loadurl,
//comments will be remove by java use regexp
(function() {
    if (window.WebViewJavascriptBridge) {
        return;
    }

    var messagingIframe;
    var sendMessageQueue = [];
    var receiveMessageQueue = [];
    var messageHandlers = {};

    var CUSTOM_PROTOCOL_SCHEME = 'yy';
    var QUEUE_HAS_MESSAGE = '__QUEUE_MESSAGE__/';

    var responseCallbacks = {};
    var uniqueId = 1;

    var base64encodechars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function base64encode(str) {
        if (str === undefined) {
            return str;
        }

        var out, i, len;
        var c1, c2, c3;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
                out += base64encodechars.charAt(c1 >> 2);
                out += base64encodechars.charAt((c1 & 0x3) << 4);
                out += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
                out += base64encodechars.charAt(c1 >> 2);
                out += base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
                out += base64encodechars.charAt((c2 & 0xf) << 2);
                out += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            out += base64encodechars.charAt(c1 >> 2);
            out += base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
            out += base64encodechars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
            out += base64encodechars.charAt(c3 & 0x3f);
        }
        return out;
    }


    function _createQueueReadyIframe(doc) {
        messagingIframe = doc.createElement('iframe');
        messagingIframe.style.display = 'none';
        doc.documentElement.appendChild(messagingIframe);
    }

    function isAndroid() {
        var ua = navigator.userAgent.toLowerCase();
        var isA = ua.indexOf("android") > -1;
        if (isA) {
            return true;
        }
        return false;
    }

    function isIphone() {
        var ua = navigator.userAgent.toLowerCase();
        var isIph = ua.indexOf("iphone") > -1;
        if (isIph) {
            return true;
        }
        return false;
    }

    //set default messageHandler
    function init(messageHandler) {
        if (WebViewJavascriptBridge._messageHandler) {
            throw new Error('WebViewJavascriptBridge.init called twice');
        }
        WebViewJavascriptBridge._messageHandler = messageHandler;
        var receivedMessages = receiveMessageQueue;
        receiveMessageQueue = null;
        for (var i = 0; i < receivedMessages.length; i++) {
            _dispatchMessageFromNative(receivedMessages[i]);
        }
    }

    function send(data, responseCallback) {
        _doSend({
            data: data
        }, responseCallback);
    }

    function registerHandler(handlerName, handler) {
        messageHandlers[handlerName] = handler;
    }

    function callHandler(handlerName, data, responseCallback) {
        _doSend({
            handlerName: handlerName,
            data: data
        }, responseCallback);
    }

    //sendMessage add message, 触发native处理 sendMessage
    function _doSend(message, responseCallback) {
        if (responseCallback) {
            var callbackId = 'cb_' + (uniqueId++) + '_' + new Date().getTime();
            responseCallbacks[callbackId] = responseCallback;
            message.callbackId = callbackId;
        }

        sendMessageQueue.push(message);
        messagingIframe.src = CUSTOM_PROTOCOL_SCHEME + '://' + QUEUE_HAS_MESSAGE;
    }

    // 提供给native调用,该函数作用:获取sendMessageQueue返回给native,由于android不能直接获取返回的内容,所以使用url shouldOverrideUrlLoading 的方式返回内容
    function _fetchQueue() {
        var messageQueueString = JSON.stringify(sendMessageQueue);
        sendMessageQueue = [];
        //add by hq
        if (isIphone()) {
            return messageQueueString;
            //android can't read directly the return data, so we can reload iframe src to communicate with java
        } else if (isAndroid()) {
            messagingIframe.src = CUSTOM_PROTOCOL_SCHEME + '://return/_fetchQueue/' + encodeURIComponent(messageQueueString);
        }
    }

    //提供给native使用,
    function _dispatchMessageFromNative(messageJSON) {
        setTimeout(function() {
            var message = JSON.parse(messageJSON);
            var responseCallback;
            //java call finished, now need to call js callback function
            if (message.responseId) {
                responseCallback = responseCallbacks[message.responseId];
                if (!responseCallback) {
                    return;
                }
                responseCallback(message.responseData);
                delete responseCallbacks[message.responseId];
            } else {
                //直接发送
                if (message.callbackId) {
                    var callbackResponseId = message.callbackId;
                    responseCallback = function(responseData) {
                        _doSend({
                            responseId: callbackResponseId,
                            responseData: responseData
                        });
                    };
                }

                var handler = WebViewJavascriptBridge._messageHandler;
                if (message.handlerName) {
                    handler = messageHandlers[message.handlerName];
                }
                //查找指定handler
                try {
                    handler(message.data, responseCallback);
                } catch (exception) {
                    if (typeof console != 'undefined') {
                        console.log("WebViewJavascriptBridge: WARNING: javascript handler threw.", message, exception);
                    }
                }
            }
        });
    }

    //提供给native调用,receiveMessageQueue 在会在页面加载完后赋值为null,所以
    function _handleMessageFromNative(messageJSON) {
        console.log(messageJSON);
        if (receiveMessageQueue) {
            receiveMessageQueue.push(messageJSON);
        } else {
            _dispatchMessageFromNative(messageJSON);
        }
    }

    var WebViewJavascriptBridge = window.WebViewJavascriptBridge = {
        init: init,
        send: send,
        registerHandler: registerHandler,
        callHandler: callHandler,
        _fetchQueue: _fetchQueue,
        _handleMessageFromNative: _handleMessageFromNative
    };

    var doc = document;
    _createQueueReadyIframe(doc);
    var readyEvent = doc.createEvent('Events');
    readyEvent.initEvent('WebViewJavascriptBridgeReady');
    readyEvent.bridge = WebViewJavascriptBridge;
    doc.dispatchEvent(readyEvent);
})();

		function connectWebViewJavascriptBridge(callback) {
		    if (window.WebViewJavascriptBridge) {
		        callback(WebViewJavascriptBridge)
		    } else {
		        document.addEventListener(
		            'WebViewJavascriptBridgeReady'
		            , function () {
		                callback(WebViewJavascriptBridge)
		            },
		            false
		        );
		    }
		}

		connectWebViewJavascriptBridge(function (bridge) {
		    bridge.init(function (message, responseCallback) {
		    });
		})
	
		//调用客户端的帖子接口
        //需要帖子ID
		function tiez(post_id){
			 var obj = {
					 post_id:post_id
			 }
		 
		  window.WebViewJavascriptBridge.callHandler('2',obj);    
		}

//调用客户端的板块接口
//板块ID，板块标签数	
function jumpPost(cid,tagCount){
			
			 var obj = {
            category_id: cid,
            tag_count: tagCount  
        };
        console.log(obj);
        window.WebViewJavascriptBridge.callHandler(7, obj);

		}
        //调用客户端的板块发帖接口
        //板块ID
function post(id){
				 var obj = {
		 cat_id:id
				}
				
			console.log(obj);
		
        window.WebViewJavascriptBridge.callHandler(11,obj);

		}
		//调用客户端的许愿

function xuyuan(){
				var obj = {
				
			};
			console.log(obj);
		
        window.WebViewJavascriptBridge.callHandler(10,obj);

		}
        //调用客户端的游戏详情
        //游戏ID
function game(gameid){
				var obj = {
				app_id:gameid
			};
			console.log(obj);
		
        window.WebViewJavascriptBridge.callHandler(12,obj);

		}
        //调用客户端的用户个人空间
        //用户ID
function uid(userid){
				var obj = {
				 user_id:userid
			};
			console.log(obj);
		
        window.WebViewJavascriptBridge.callHandler(13,obj);

		}
        //调用客户端的资源页面

function ziyaun(){
				var obj = {
				
			};
			console.log(obj);
		
        window.WebViewJavascriptBridge.callHandler(15,obj);

		}
//注释
//活动结束后自动结束
function EndDate(Endtime){
			var nextDate = new Date(Endtime);
				var currentDate = new Date();
				// 获取时间戳
				var currentTime = currentDate.getTime();
				var nextTime = nextDate.getTime();
				var allTime = currentTime-nextTime;
				if (allTime>0) {
					// document.getElementById("box").innerHTML="1";
						var a_list = document.getElementsByTagName("a")
						for (var i = 0; i < a_list.length; i++) {
							a_list[i].href="javascript:void(0)"
						}
					  alert("报名结束咯~去看看别的活动吧！")
				}
		}
        
console.log("活动结束后自动结束,按钮（ID='bm'）：\n 使用方法EndDate('时间')"),
				console.log("%c<button id='bm'>\n<a href='#' onclick='EndDate('2019/07/16 17:23:30')'>报名</a>\n</button>\n EndDate('2019/07/15 16:25:30')","color:green")
				console.log("跳转帖子：\n 使用方法tiez(帖子ID)"),
				console.log("%ctiez(903357)","color:green")
				console.log("跳转板块：\n 使用方法jumpPost(板块ID,标签数量)"),
				console.log("%cjumpPost(41,5)","color:green")
				console.log("板块发帖：\n 使用方法post(板块ID)"),
				console.log("%cpost(41)","color:#069900")
				console.log("游戏详情：\n 使用方法game(资源ID)"),
				console.log("%cgame(903357)","color:#069900")
				console.log("许愿：\n 使用方法xuyuan()"),
				console.log("%cxuyuan()","color:#f94fea")
				console.log("资源页：\n 使用方法ziyaun()"),
				console.log("%cziyaun()","color:#069900")
    