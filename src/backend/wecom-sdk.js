const axios = require('axios');
const sha1 = require('sha1');  

sdk = {
    debug: true
}

/**
 * 获取企业的jsapi_ticket
 * https://work.weixin.qq.com/api/doc/90000/90136/90506#%E8%8E%B7%E5%8F%96%E4%BC%81%E4%B8%9A%E7%9A%84jsapi_ticket
 */
sdk.getCorpJsapiTicket = async function (access_token) {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${access_token}`

    return await axios.get(url).then(res => {
        sdk.debug && console.log("getCorpJssdkTicket", res.data);
        return res.data
    }).catch(error => {
        console.log(error)
    });
}

/**
 * 获取应用的jsapi_ticket
 * https://work.weixin.qq.com/api/doc/90000/90136/90506#%E8%8E%B7%E5%8F%96%E5%BA%94%E7%94%A8%E7%9A%84jsapi_ticket
 */
 sdk.getAgentJsapiTicket = async function (access_token) {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/ticket/get?access_token=${access_token}&type=agent_config`

    return await axios.get(url).then(res => {
        sdk.debug && console.log("getAgentJsapiTicket", res.data);
        return res.data
    }).catch(error => {
        console.log(error)
    });
}

/**
 * 获取access_token
 * 
 * https://work.weixin.qq.com/api/doc/90000/90135/91039
 */
 sdk.getAccessToken = async function (corpid, appSecret) {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${appSecret}`

    return await axios.get(url).then(res => {
        sdk.debug && console.log("getAccessToken", res.data)
        return res.data
    }).catch(error => {
        console.log(error)
    });
}

/**
 * 计算 h5sdk.config 的签名参数
 *
 * @param jsTicket  之前获取的 jsTicket
 * @param nonceStr  随机字符串
 * @param timeStamp 当前时间戳
 * @param url       调用 h5sdk.config 的当前页面 URL
 * @return
 */
 sdk.genSignature = function(jsTicket, nonceStr, timeStamp, url) {
    const verifyStr = `jsapi_ticket=${jsTicket}&noncestr=${nonceStr}&timestamp=${timeStamp}&url=${url}`;
    sdk.debug && console.log("verifyStr: ", verifyStr);
    return sha1(verifyStr);
  }

module.exports = sdk;