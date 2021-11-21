function search() {
    window.vikaApp.keywords = document.getElementById("faq-keywords").value

    if (window.vikaApp.keywords.trim() == "") return false;

    var data = { "keywords": document.getElementById("faq-keywords").value }

    var btn = document.getElementById("btn-submit")
    btn.disabled = true
    btn.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> 搜索中...'

    function onSuccess(results) {
        btn.disabled = false;
        btn.innerHTML = '搜一搜'
        window.vikaApp.searchResults = results

        //debugLog(results)

        results.length > 0 ? renderList(results) : renderEmptyResults()
    }

    $.ajax({
        type: 'POST',
        url: "/search",
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        success: onSuccess,
    });

    return false;
}

function getRecordsByViewId(viewId){
    const urlObj = new URL(location.href)
    window.fetch(`${urlObj.origin}/category/records?viewId=${viewId}`, {
        method: 'GET',
        headers: {
            'content-type': 'application/json'
        }
    }).then(async (res) => {
        const results = await res.json()
        window.vikaApp.searchResults = results
        results.length > 0 ? renderList(results) : renderEmptyResults()
    })
}

function renderList(results) {
    let html = ""
    results.forEach((element, index) => {
        html += renderMediaItem(element, index)
    });
    document.getElementById("results-wrapper").innerHTML = html
}

function highlineKeywords(str) {
    let arr = window.vikaApp.keywords.trim().split(" ")

    arr.sort(function (a, b) {
        return a.length < b.length ? 1 : -1;
    })

    if (typeof str == "undefined") {
        str = ""
    }

    let new_str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, "<br>")

    arr.forEach(tmp => {
        if (tmp != "") {
            new_str = new_str.replace(new RegExp(tmp, 'g'), `<span class="highline">${tmp}</span>`)
        }
    });

    return new_str
}

function renderMediaItem(ele, index) {
    let wrapper = document.createElement("div")

    const displayBtn = window.vikaApp.showBtn ? "" : "d-none"

    let mediaImage = ""
    let badge = ""
    if(ele.fields["素材类型"]=="文本内容"){
        mediaImage = ele.fields["修改人"] ? `<img class="img-avatar mr-3 d-none d-md-block" src="${ele.fields["修改人"].avatar}" class="mr-3" alt="${ele.fields["修改人"].name}">` : ""
    }else {
        mediaImage = ele.fields["附件"] ? `<img class="img-avatar mr-3 d-md-block" src="${ele.fields["附件"][0].url}" class="mr-3" alt="${ele.fields["附件"][0].name}">` : ""
        badge = ` <span class="badge badge-warning badge-h5">H5</span>`
    }

    wrapper.innerHTML = `<li class="media p-3 mb-2 border rounded">
        ${badge}
        ${mediaImage}
        <div class="media-body">
            <h5></h5>
            <p class="mb-0 text-justify faq-answer"></p>
        </div>
        <button type="button" class="btn btn-send-message btn-primary btn-sm ${displayBtn}" data-id="${index}">发送</button>
        </li>`

    wrapper.querySelector("h5").innerHTML = highlineKeywords(ele.fields["问题"])
    wrapper.querySelector("p.faq-answer").innerHTML = highlineKeywords(ele.fields["回答"] ? ele.fields["回答"] : "(暂无成员补充答案)")

    if (ele.fields["附件"] && ele.fields["素材类型"] && ele.fields["素材类型"]=="文本内容") {
        let attachment = ele.fields["附件"][0]
        if (attachment.mimeType.startsWith("image/")) {
            $(".media-body", wrapper).append(`<img class="mt-2 d-block w-75" src='${attachment.url}' alt='${attachment.name}'>`)
        }

    }

    return wrapper.innerHTML
}

function renderEmptyResults() {
    let html = '<li class="p-4"><div class="alert alert-warning" role="alert">找不到匹配的记录！</div></li>'

    document.getElementById("results-wrapper").innerHTML = html
}

function debugLog(msg, key = "") {
    if(window.vikaApp.debug){
      if (typeof msg !== "string") {
        msg = JSON.stringify(msg, null, 2)
      }
    
      $("#results-output").prepend(`${key}: \n${msg}\n\n`)
    }
  }
  

/**
 * 获取当前话术库分类列表（维格视图列表）
 */
async function getScriptCatagories() {
    debugLog("getScriptCatagories is running")
    const urlObj = new URL(location.href)
    return window.fetch(`${urlObj.origin}/scriptcatagories`).then(async(res) => {
        const categories = await res.json()
        let navTabs = []

        for (let index = 0; index < 3; index++) {
            const category = categories[index];
            const element = `<li class="nav-item flex-fill text-center"><a class="nav-link ${(0==index)?"active":""}" href="#${category.id}">${category.name}</a></li>`
            navTabs.push(element)

            if(0==index){
                window.vikaApp.activeViewId = category.id
            }
        }

        return `<ul class="nav nav-tabs flex-row row mb-4 mb-lg-5 sticky-top bg-light pt-2" id="category-tabbar">${navTabs.join("")}</ul>`
    })
}

/**
 * 获取当前URL的对应签名以及其他4参数
 * 前端先调用此函数，再调用wx.config
 */
 async function getWecomConfigParameters() {
    debugLog("getWecomConfigParameters is running")
    const urlObj = new URL(location.href)
    const pageUrl = encodeURIComponent(urlObj.origin + urlObj.pathname + urlObj.search)
    return window.fetch(`${urlObj.origin}/wecom/jsconfig?url=${pageUrl}`).then(res => res.json())
}

/**
 * 通过config接口注入权限验证配置
 * https://work.weixin.qq.com/api/doc/90000/90136/90514
 */
async function initWecomConfig() {
    const parameters = await getWecomConfigParameters()

    if(!parameters.corpConifg){alert("无法获取到应用配置信息，请刷新重试")}

    let {corpConifg, agentConfig} = parameters

    wx.config(corpConifg)

    await initAgentConfig(agentConfig)

    // 获取进入H5页面的入口环境
    const entry = await getWecomContext()
    const isAvailableEntry = (["single_chat_tools", "group_chat_tools", "chat_attachment"].indexOf(entry) !== -1) ? true : false

    debugLog(entry, "initWecomConfig")
    window.vikaApp.showBtn = isAvailableEntry

    // 开始监听按钮的点击事件
    $("body").on("click", ".btn-send-message",async(element) => {
        const id = $(element.currentTarget).data("id")
        debugLog(`button #${id} clicked.`)
        if(isAvailableEntry){
            await wecomSendChatMessage(id)
        }
    })

    wx.ready(function(){
        console.log("wx is ready")
    });
}

/**
 * 分享消息到当前会话
 * 
 * 调用该接口可从聊天工具栏或附件栏打开的页面中向当前会话发送消息，
 * 消息格式支持文本(“text”)，图片(“image”)，视频(“video”)，文件(“file”)，H5(“news”）和小程序(“miniprogram”)
 * 
 * https://work.weixin.qq.com/api/doc/90000/90136/94349
 */
async function wecomSendChatMessage(resultId){
    const searchResult = window.vikaApp.searchResults[parseInt(resultId)]
    const messageType = searchResult.fields["素材类型"]
    const defaultImgUrl = "https://s1.vika.cn/public/2021/09/23/0c740e5e140b4064b3916bf4830d04af?imageView2/1/w/64/h/64/q/100!"

    let message = {
        msgtype:"news", //消息类型，必填
        enterChat: false, //为true时表示发送完成之后顺便进入会话，仅移动端3.1.10及以上版本支持该字段
    }

    if(messageType=="文本内容"){
        message.msgtype = "text"
        message.text = {
            content: searchResult.fields["回答"] ? searchResult.fields["回答"] : " "
        }
    }else if(messageType=="H5链接"){
        message.msgtype = "news"
        message.news = {
            link: searchResult.fields["链接地址"] ? searchResult.fields["链接地址"] : "https://vika.cn", //H5消息页面url 必填
            title: searchResult.fields["问题"] ? searchResult.fields["问题"] : "无标题", //H5消息标题
            desc: searchResult.fields["回答"] ? searchResult.fields["回答"] : "没有描述信息", //H5消息摘要
            imgUrl: searchResult.fields["附件"] ? searchResult.fields["附件"][0].url : defaultImgUrl, //H5消息封面图片URL
        }
    }

    debugLog(searchResult)
    debugLog(message, "message")
    wx.invoke('sendChatMessage', message, function(res) {
        if (res.err_msg != 'sendChatMessage:ok') {
            debugLog(res)
        }
    })
}

async function initAgentConfig(agentConfig) {
    return new Promise((resolve, reject) => {
        wx.agentConfig({
            ...agentConfig,
            success: function(res) {
                // 回调
                debugLog(res)
                resolve(res)
            },
            fail: function(res) {
                if(res.errMsg.indexOf('function not exist') > -1){
                    alert('版本过低请升级')
                }
                reject(res)
            }
        })
    })
}

async function getWecomContext() {
    return new Promise((resolve, reject) => {
        wx.invoke('getContext', {}, function(res){
            debugLog(res, "getWecomContext")
            if(res.err_msg == "getContext:ok"){
                resolve(res.entry) //返回进入H5页面的入口类型，目前有normal、contact_profile、single_chat_tools、group_chat_tools、chat_attachment
            }else {
                //错误处理
                reject(res)
            }
        });
    })
}

function enableDebugMode() {
    $("#wrapper-debug-box").removeClass("d-none")
    $("div.wrapper-logo").click(() => { location.reload() })
}

function debugLog(msg, key = "debug") {

    if(window.vikaApp.debug){
      if (typeof msg !== "string") {
        msg = JSON.stringify(msg, null, 2)
      }
    
      $("#results-output").prepend(`${key}: \n${msg}\n\n`)
    }
} 
