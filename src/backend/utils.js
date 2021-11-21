const wecomSDK = require("./wecom-sdk")
const vikaSDK = require("./vika-sdk")
const CONF = require("../config")

utils = {}

/**
 * 从缓存中读取企业的jsapi_ticket，如果过期则自动刷新
 * @param {*} app 
 * @returns {string} corpjsapi_ticket 
 */
utils.getCorpTicket = async function (app) {
    let ticket = ""

    // 判断缓存数据中是否有企业jsapi_ticket缓存
    let corp_jsapi_data = app.fields["corp_jsapi_data"] ? JSON.parse(app.fields["corp_jsapi_data"]) : {}

    if(corp_jsapi_data.expires_in && !utils.checkExpired(corp_jsapi_data.lastUpdate, corp_jsapi_data.expires_in)){
      // 缓存未过期
      ticket = corp_jsapi_data.ticket
    }else{
      // 重新拉取ticket
      const result = await utils.getWecomAccessToken(app).then(app_access_token => wecomSDK.getCorpJsapiTicket(app_access_token))
      
      if(0 == result.errcode){
        corp_jsapi_data = {
          lastUpdate: new Date().getTime(),
          ...result
        }
        //写入 Vika 的《自建应用配置表》
        await vikaSDK.updateAppInfo(app.recordId, { "corp_jsapi_data": JSON.stringify(corp_jsapi_data) })
        CONF.vikaDebug && console.log("corp_jsapi_data", corp_jsapi_data)
        ticket = corp_jsapi_data.ticket
      }
    }

    return ticket
}

/**
 * 从缓存中读取应用的jsapi_ticket，如果过期则自动刷新
 * @param {*} app 
 * @returns {string} agent_jsapi_ticket 
 */
 utils.getAgentTicket = async function (app) {
    let ticket = ""

    // 判断缓存数据中是否有企业jsapi_ticket缓存
    let agent_jsapi_data = app.fields["agent_jsapi_data"] ? JSON.parse(app.fields["agent_jsapi_data"]) : {}

    if(agent_jsapi_data.expires_in && !utils.checkExpired(agent_jsapi_data.lastUpdate, agent_jsapi_data.expires_in)){
      // 缓存未过期
      ticket = agent_jsapi_data.ticket
    }else{
      // 重新拉取ticket
      const result = await utils.getWecomAccessToken(app).then(app_access_token => wecomSDK.getAgentJsapiTicket(app_access_token))
      
      if(0 == result.errcode){
        agent_jsapi_data = {
          lastUpdate: new Date().getTime(),
          ...result
        }
        //写入 Vika 的《自建应用配置表》
        await vikaSDK.updateAppInfo(app.recordId, { "agent_jsapi_data": JSON.stringify(agent_jsapi_data) })
        CONF.vikaDebug && console.log("agent_jsapi_data", agent_jsapi_data)
        ticket = agent_jsapi_data.ticket
      }
    }

    return ticket
}

utils.getWecomAccessToken = async function (app) {
    return await wecomSDK.getAccessToken(app.fields["corpid"], app.fields["appSecret"]).then(async (res) => {
        if (0 !== res.errcode) return "";

        //写入 Vika 的《自建应用配置表》
        var vikaResult = await vikaSDK.updateAppInfo(app.recordId, { "app_access_token": res.access_token, "corp_jsapi_ticket_expire": res.expires_in })
        CONF.vikaDebug && console.log("getWecomAccessToken", { res, vikaResult })
        return res.access_token
    })
}

/**
* 从关键词文本中，按空格分隔，转换成功符合filterByFormula使用的格式
*/
utils.extractKeywords = (keywords) => {
    let a = keywords.split(" ")
    let formulaArr = new Array()

    a.forEach(str => {
        if (str != "") {
            formulaArr.push(`OR(find("${str}", {问题})> 0, find("${str}", {回答})> 0)`)
        }
    });

    let formula = formulaArr.join(",")

    return `AND(${formula})`
}

/**
 * 判断时间是否已超过最大缓存秒数
 * @param {number} lastTime 缓存的起始时间戳，单位：毫秒
 * @param {number} expire 缓存有效时长，单位：秒
 * @returns 
 */
utils.checkExpired = (lastTime, expire) => {
    const currentTime = new Date().getTime()
    return (currentTime - lastTime) > (expire * 1000)
}

module.exports = utils