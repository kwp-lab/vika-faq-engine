const vikaApp = {
    // 自建应用配置表的维格表ID
    DSAppConfig: {
        "datasheetId": "填写配置表的datasheetId"
    },
    // 话术库的维格表ID
    DSFaq:{
        "datasheetId": "填写话术库表的datasheetId"
    }
}
const vikaUserToken = "填写你的维格表帐户对应的API Token"
const vikaHost = "https://vika.cn"

// 是否开启调试模式，开启后 nodejs 端会打印更多调试信息
const vikaDebug = true

// 为哪个企业的自建应用提供服务端能力，填写企业微信的corpID
// 在企业微信管理后台 > 我的企业
const activeWecomCorpId = "填写你的corpID"

// 授予哪个自建应用获得接口权限
const activeWecomAgentId = "填写你的agentID"

// 签名所需的随机串，正式使用时请自行生成，此处仅作演示
const wecomeNonceStr = "huGy38jh9gt" 

module.exports = {
    vikaApp,
    vikaUserToken,
    vikaHost,
    vikaDebug,
    activeWecomCorpId,
    activeWecomAgentId,
    wecomeNonceStr
}