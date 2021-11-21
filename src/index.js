const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const CONF = require("./config")
const utils = require("./backend/utils")
const vikaSDK = require("./backend/vika-sdk")
const wecomSDK = require("./backend/wecom-sdk")

//消息接口的解密与生成签名
const { decrypt, getSignature } = require('@wecom/crypto');

// Routes
app.get(`/`, async (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), {maxAge: CONF.vikaDebug ? 1 : 604800 });
});

app.get(`/quickreply`, async (req, res) => {
  res.sendFile(path.join(__dirname, 'quickreply.html'), {maxAge: CONF.vikaDebug ? 1 : 604800 });
});

app.get('/scriptcatagories', async (req, res) => {
  const views = await vikaSDK.getViews(CONF.vikaApp.DSFaq.datasheetId)

  res.send(views);
});

app.post('/search', async (req, res) => {
  const queryData = {
    filterByFormula: utils.extractKeywords(req.body.keywords),
    fieldKey: "name"
  }

  const records = await vikaSDK.get(CONF.vikaApp.DSFaq.datasheetId, queryData)

  res.send(records);
});

app.get('/category/records', async (req, res) => {
  const queryData = {
    viewId: req.query.viewId,
    fieldKey: "name",
    //sort: [{"order":"desc", "field": "修改时间"}],
    pageSize: 10
  }


  const records = await vikaSDK.get(CONF.vikaApp.DSFaq.datasheetId, queryData)

  res.send(records);
});

// app.get('/wecom', async (req, res) => {
  
//   console.log("req body", req)

//   var query = req.query

//   const signature = getSignature(CONF.token, query.timestamp, query.nonce, query.echostr);

//   if(signature == query.msg_signature){
//     const { message, id } = decrypt(CONF.encodingAESKey, query.echostr);
//     console.log({ message, id });
//     return res.send(message);
//   }

// });

/**
 * 获取wx.config和wx.agentConfig所需的参数
 */
app.get('/wecom/jsconfig', async (req, res) => {
  const app = await vikaSDK.getAppInfo(CONF.activeWecomCorpId)
  const queryData = req.query

  const currentTime = new Date().getTime()

  const corpConifg = {
    beta: true,
    debug: CONF.vikaDebug,
    appId: CONF.activeWecomCorpId,         // 必填，企业微信的corpID
    timestamp: currentTime,     // 必填，生成签名的时间戳，毫秒级
    nonceStr: CONF.wecomeNonceStr + currentTime,      // 必填，生成签名的随机串
    signature: '',
    jsApiList: ['agentConfig']
  }

  const agentConfig = {
    corpid: CONF.activeWecomCorpId,         // 必填，企业微信的corpid，必须与当前登录的企业一致
    agentid: CONF.activeWecomAgentId,     // 必填，企业微信的应用id
    timestamp: currentTime,     // 必填，生成签名的时间戳，毫秒级
    nonceStr: CONF.wecomeNonceStr + currentTime,      // 必填，生成签名的随机串
    signature: '',
    jsApiList: ['sendChatMessage', 'getContext']
  }

  console.log("queryData", queryData)

  if(app){

    let corp_jsapi_ticket = await utils.getCorpTicket(app)
    let agent_jsapi_ticket = await utils.getAgentTicket(app)

    corpConifg.signature = wecomSDK.genSignature(corp_jsapi_ticket, corpConifg.nonceStr, corpConifg.timestamp, queryData.url)
    agentConfig.signature = wecomSDK.genSignature(agent_jsapi_ticket, agentConfig.nonceStr, agentConfig.timestamp, queryData.url)
  }

  const response = {
    "code":  app ? 0 : 1,
     corpConifg,
     agentConfig
  }

  CONF.vikaDebug && console.log("response", response)

  res.send(response);
})


app.get('/404', (req, res) => {
  res.status(404).send('Not found');
});

app.get('/500', (req, res) => {
  res.status(500).send('Server Error');
});

// Error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

// 托管静态资源
app.use(express.static('frontend'))
app.use('/frontend', express.static('frontend', {maxAge: CONF.vikaDebug ? 1 : 604800 }))

module.exports = app;
