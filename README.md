[![NPM version][npm-img]][npm-url]
[![License][license-img]][license-url]

### 融云 Server SDK
融云IM服务 Server SDK Nodejs版
官网：http://www.rongcloud.cn/

### Install
```bash
npm install rongcloud
```
### How to use
```javascript
var RongAPI = require('rongcloud');
var rongAPI = new RongAPI('您的AppKey', '您的AppSecret');
rongAPI.user.getToken(100000, '张三', '', function(data){
    data = JSON.parse(data);
    if (data.code == 200)
        console.log("获取Token成功:" + data.token);
    else
        console.log("Token获取失败");
});
```

[npm-img]: https://img.shields.io/npm/v/rongcloud.svg?style=flat-square
[npm-url]: https://npmjs.org/package/rongcloud
[license-img]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: http://opensource.org/licenses/MIT