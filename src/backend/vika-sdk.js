const CONF = require("../config")
const axios = require('axios')
const FormData = require('form-data');
const mime = require('mime')

var sdk = {}

var header = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": `Bearer ${CONF.vikaUserToken}`
}

/**
 * 读取《自建应用配置表》，获取企业微信应用的配置信息
 * @param {string} corpid 自建应用的corpid
 * @returns 如果有指定corpid则返回单个APP的配置，否则返回APP列表数组
 */
sdk.getAppInfo = async function (corpid) {
    let queryData = null
    if(corpid){
        queryData = {
            filterByFormula: `{corpid} = "${corpid}"`
        }
    }

    return await sdk.get(CONF.vikaApp.DSAppConfig.datasheetId, queryData).then(res => {
        return corpid ? res[0] : res
    })
}

/**
 * 获取指定维格表的视图列表
 */
sdk.getViews = async function (datasheetId) {
    const config = {
        headers: header
    }

    return await axios.get(`${CONF.vikaHost}/fusion/v1/datasheets/${datasheetId}/views`, config)
    .then(function (response) {
        if(200 == response.data.code){
            return response.data.data.views
        }else{
            console.log("sdk.get error:\n", response);
        }
        return []
    })
    .catch(function (error) {
        console.log("catch exception:\n", error);
    })
}

sdk.uploadAttachment = async function(datasheetId, attachmentObj){

    let form = new FormData();
    form.append('file', attachmentObj.arraybuffer, {
        filename: attachmentObj.filename,
        contentType: attachmentObj.contentType,
        //knownLength: 19806
    });

    const sHeader = {
        ...form.getHeaders(),
        "Authorization": `Bearer ${CONF.vikaUserToken}`
    }

    return await axios.post(
        `${CONF.vikaHost}/fusion/v1/datasheets/${datasheetId}/attachments`,
        form.getBuffer(),
        { headers: sHeader }
    ).then(function (response) {
        if(200 == response.data.code){
            return response.data.data
        }
        CONF.vikaDebug && console.log(response)
        return null
    })
    .catch(function (error) {
        console.log(error);
    });
}

// 将飞书应用身份访问凭证更新至维格表
sdk.updateAppInfo = async function(recordId, fieldValues){
    const postData = {
        "records": [
            {
                "recordId": recordId,
                "fields": fieldValues
            }
        ]
    }

    return await sdk.patch(CONF.vikaApp.DSAppConfig.datasheetId, postData)
    
}

// 更新维格表里的“审批定义”数据
sdk.updateApprovalData = async function(recordId, approvalData){
    var postData = {
        "records": [
            {
                "recordId": recordId,
                "fields": {
                    "Approval Data": JSON.stringify(approvalData,null,2)
                }
            }
        ]
    }

    return await sdk.patch(CONF.vikaApp.DSApproval.datasheetId, postData)
}

/**
 * 往维格表里插入若干行
 * @param {*} datasheetId 
 * @param {*} payload 
 * @returns 
 */
sdk.insertRecords = async function(datasheetId, payload){
    return await axios.post(
        `${CONF.vikaHost}/fusion/v1/datasheets/${datasheetId}/records`,
        payload,
        { headers: header }
    ).then(function (response) {
        CONF.vikaDebug && console.log(response)
        return response.data
    })
    .catch(function (error) {
        console.log(error);
    });
}


/**
 * 通过mimeType判断附件的后缀, 返回带上后缀的附件名称
 * @param {string} name e.g. abc
 * @param {string} mimeType e.g. image/png
 * @returns e.g. abc.png
 */
sdk.generateFilename = function(name, mimeType) {
    let extension = mime.getExtension(mimeType)

    return !extension ? null : `${name}.${extension}`
}



sdk.patch = async function(datasheetId, patchData){
    return await axios.patch(
        `${CONF.vikaHost}/fusion/v1/datasheets/${datasheetId}/records`,
        patchData,
        { headers: header }
    ).then(function (response) {
        if(200 == response.data.code){
            return response.data.data.records
        }
        CONF.vikaDebug && console.log(response)
        return null
    })
    .catch(function (error) {
        console.log(error);
    });
}

sdk.post = async function(datasheetId, posthData){
    return await axios.post(
        `${CONF.vikaHost}/fusion/v1/datasheets/${datasheetId}/records`,
        posthData,
        { headers: header }
    ).then(function (response) {
        if(200 == response.data.code){
            return response.data.data.records
        }
        CONF.vikaDebug && console.log(response)
        return null
    })
    .catch(function (error) {
        console.log(error);
    });
}

sdk.get = async function(datasheetId, queryData){
    let config = {
        headers: header
    }

    if(queryData){
        config.params = queryData
    }

    return await axios.get(`${CONF.vikaHost}/fusion/v1/datasheets/${datasheetId}/records`, config)
    .then(function (response) {
        if(200 == response.data.code){
            return response.data.data.records
        }else{
            console.log("sdk.get error:\n", response);
        }
        return []
    })
    .catch(function (error) {
        console.log("catch exception:\n", error);
    });
}

module.exports = sdk;