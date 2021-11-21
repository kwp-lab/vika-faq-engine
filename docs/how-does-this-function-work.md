# vika企业微信话术库的工作原理

本工程选用 [腾讯云函数（SCF）](https://cloud.tencent.com/product/scf) 作为执行环境，所有代码通过 [Serverless Framework CLI](https://cloud.tencent.com/document/product/583/44751) 一键部署到云端。

## 工作原理

### 一、访问话术库首页

```mermaid
sequenceDiagram
    participant  cs as 客服人员
    participant app as 企业微信<br/>客户端
    participant scf as api gateway&云函数
    cs->>app: 打开群聊/单聊会话的工具栏，<br/>选择“话术库”
    app->>scf: 发送请求（GET "/"）
    activate scf
    scf->>scf: API 网关将请求转发到云函数
    scf->>scf: Express 处理请求，send response
    scf-->>app: 返回话术库 html 页面（index.html）
    deactivate scf
    app-->>cs: 展示页面
```


### 访问话术库“快捷回复”页面

```mermaid
sequenceDiagram
    participant  cs as 客服人员
    participant app as 企业微信<br/>客户端
    participant scf as api gateway&云函数
    participant vika as 维格表 
    cs->>app: 打开群聊/单聊会话的工具栏，<br/>选择“话术库”
    app->>scf: 发送请求（GET "/quickreply"）
    activate scf
    scf->>scf: API 网关将请求转发到云函数
    scf->>scf: Express 处理请求，send response
    scf-->>app: 返回“快捷回复”页面（quickreply.html）
    deactivate scf
    app-->>cs: 展示页面

    par [获取自定义话术分类标签]
    app-->scf: 发送ajax请求（GET "/scriptcatagories"）
    scf->>scf: API 网关将请求转发到云函数
    scf->>vika: 通过 API 获取分类标签<br/>（GET ".../views"）
    vika-->>scf: 返回指定表格ID的视图列表<br/>视图列表即“话术库分类标签”
    scf-->>app: 截取前 3 个视图的名称组成数组，send response
    and [获取JS权限配置必要的签名和参数]
    app-->scf: 发送ajax请求（GET "/wecom/jsconfig"）
    scf->>scf: API 网关将请求转发到云函数
    scf->>vika: 通过 API 获取自建应用的配置参数<br/>（GET ".../records"）
    vika-->>scf: 返回app_access_token，corp_jsapi_data，agent_jsapi_data
    scf-->app: 返回signature和JS权限配置的必要参数
    app-->>app: 注入企业微信自建应用的JS权限配置
    app-->>cs: 页面就绪，可以一键发送话术到会话群
    end

```