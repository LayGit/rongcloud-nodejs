var Request = require('request');
var Crypto = require("crypto");
var SERVER_URL = 'https://api.cn.rong.io/';

/**
 * 融云API for nodejs 0.0.2
 * @author JserLay
 * @created 2015-02-28
 */
var RongAPI = function(appKey, appSecret, format){
    this.appKey = appKey;
    this.appSecret = appSecret;
    this.format = format || 'json';

    /**
     * 请求融云服务端
     * @param action
     * @param params
     * @param callback
     */
    this.request = function(action, params, callback){
        action = action.charAt(0) == '/' ? action : '/' + action;

        var Nonce = getRandomNum(10000, 99999),
            Timestamp = (new Date()).getTime().toString().substr(0, 10),
            sign = sha1(this.appSecret + Nonce + Timestamp);

        var options = {
            url:SERVER_URL + action,
            method:'POST',
            useQuerystring:true,
            headers:{
                'App-Key':this.appKey,
                'Nonce':Nonce,
                'Timestamp':Timestamp,
                'Signature':sign
            }
        };
        if (params)
            options.form = params;
        Request(options, function(error, response, body){
            if (error)
                throw  error;
            else
                callback ? callback(body) : 0;
        });
    };

    var that = this;
    /**
     * 用户服务
     */
    this.user = {
        /**
         * 获取 Token
         * @param userId        用户 Id，最大长度 32 字节。是用户在 App 中的唯一标识码，必须保证在同一个 App 内不重复，重复的用户 Id 将被当作是同一用户。
         * @param name          用户名称，最大长度 128 字节。用来在 Push 推送时，或者客户端没有提供用户信息时，显示用户的名称。
         * @param portraitUri   用户头像 URI，最大长度 1024 字节。
         * @param callback      获取完成回调
         */
        getToken:function(userId, name, portraitUri, callback){
            that.request('/user/getToken', {
                userId:userId,
                name:name,
                portraitUri:portraitUri
            }, callback);
        },
        /**
         * 刷新用户信息
         * @param userId        用户 Id，最大长度 32 字节。是用户在 App 中的唯一标识码，必须保证在同一个 App 内不重复，重复的用户 Id 将被当作是同一用户。（必传）
         * @param name          用户名称，最大长度 128 字节。用来在 Push 推送时，或者客户端没有提供用户信息时，显示用户的名称。（可选，提供即刷新，不提供忽略）
         * @param portraitUri   用户头像 URI，最大长度 1024 字节。用来在 Push 推送时，或者客户端没有提供用户信息时，显示用户的名称。（可选，提供即刷新，不提供忽略）
         * @param callback      获取完成回调
         */
        refresh:function(userId, name, portraitUri, callback){
            that.request('/user/refresh', {
                userId:userId,
                name:name,
                portraitUri:portraitUri
            }, callback);
        },
        /**
         * 检查用户在线状态
         * @param userId        用户 Id。（必传）
         * @param callback      检查完成回调
         */
        checkOnline:function(userId, callback){
            that.request('/user/checkOnline', {
                userId:userId
            }, callback);
        }
    };

    /**
     * 用户封禁服务
     */
    this.userBlock = {
        /**
         * 封禁用户
         * @param userId    用户 Id。（必传）
         * @param minute    封禁时长,单位为分钟，最大值为43200分钟。（必传）
         * @param callback  完成回调
         */
        block:function(userId, minute, callback){
            that.request('/user/block', {
                userId:userId,
                minute:minute
            }, callback);
        },
        /**
         * 解除用户封禁
         * @param userId    用户 Id。（必传）
         * @param callback  完成回调
         */
        unblock:function(userId, callback){
            that.request('/user/unblock', {
                userId:userId
            }, callback);
        },
        /**
         * 获取被封禁用户
         * @param callback  完成回调
         */
        query:function(callback){
            that.request('/user/block/query', null, callback);
        }
    };

    /**
     * 黑名单服务
     */
    this.userBlackList = {
        /**
         * 添加用户到黑名单
         * @param userId        用户 Id。（必传）
         * @param blackUserId   被加黑的用户Id。(必传)
         * @param callback      完成回调
         */
        add:function(userId, blackUserId, callback){
            that.request('/user/blacklist/add', {
                userId:userId,
                blackUserId:blackUserId
            }, callback);
        },
        /**
         * 从黑名单中移除用户
         * @param userId        用户 Id。（必传）
         * @param blackUserId   被加黑的用户Id。(必传)
         * @param callback      完成回调
         */
        remove:function(userId, blackUserId, callback){
            that.request('/user/blacklist/remove', {
                userId:userId,
                blackUserId:blackUserId
            }, callback);
        },
        /**
         * 获取某用户的黑名单列表
         * @param userId    用户 Id。（必传）
         * @param callback  完成回调
         */
        query:function(userId, callback){
            that.request('/user/blacklist/query', {
                userId:userId
            }, callback);
        }
    };

    /**
     * 消息发送服务
     */
    this.message = {
        /**
         * 发送单聊消息
         * @param fromUserId    发送人用户 Id。（必传）
         * @param toUserId      接收用户 Id，提供多个本参数可以实现向多人发送消息。（必传）
         * @param objectName    消息类型，参考融云消息类型表.消息标志；可自定义消息类型。（必传）
         * @param content       发送消息内容，参考融云消息类型表.示例说明；如果 objectName 为自定义消息类型，该参数可自定义格式。（必传）
         * @param pushContent   如果为自定义消息，定义显示的 Push 内容。(可选)
         * @param pushData      针对 iOS 平台，Push 通知附加的 payload 字段，字段名为 appData。(可选)
         * @param callback      发送完成回调
         */
        sendPrivate:function(fromUserId, toUserId, objectName, content, pushContent, pushData, callback){
            that.request('/message/private/publish', {
                fromUserId:fromUserId,
                toUserId:toUserId,
                objectName:objectName,
                content:content,
                pushContent:pushContent,
                pushData:pushData
            }, callback);
        },
        /**
         * 发送系统消息
         * @param fromUserId    发送人用户 Id。（必传）
         * @param toUserId      接收用户 Id，提供多个本参数可以实现向多人发送消息。（必传）
         * @param objectName    消息类型，参考融云消息类型表.消息标志；可自定义消息类型。（必传）
         * @param content       发送消息内容，参考融云消息类型表.示例说明；如果 objectName 为自定义消息类型，该参数可自定义格式。（必传）
         * @param pushContent   如果为自定义消息，定义显示的 Push 内容。(可选)
         * @param pushData      针对 iOS 平台，Push 通知附加的 payload 字段，字段名为 appData。(可选)
         * @param callback      发送完成回调
         */
        sendSystem:function(fromUserId, toUserId, objectName, content, pushContent, pushData, callback){
            if (toUserId)
            that.request('/message/system/publish', {
                fromUserId:fromUserId,
                toUserId:toUserId,
                objectName:objectName,
                content:content,
                pushContent:pushContent,
                pushData:pushData
            }, callback);
        },
        /**
         * 发送群组消息
         * @param fromUserId    发送人用户 Id。（必传）
         * @param toGroupId     接收群Id，提供多个本参数可以实现向多群发送消息。（必传）
         * @param objectName    消息类型，参考融云消息类型表.消息标志；可自定义消息类型。（必传）
         * @param content       发送消息内容，参考融云消息类型表.示例说明；如果 objectName 为自定义消息类型，该参数可自定义格式。（必传）
         * @param pushContent   如果为自定义消息，定义显示的 Push 内容。(可选)
         * @param pushData      针对 iOS 平台，Push 通知附加的 payload 字段，字段名为 appData。(可选)
         * @param callback      发送完成回调
         */
        sendGroup:function(fromUserId, toGroupId, objectName, content, pushContent, pushData, callback){
            that.request('/message/group/publish', {
                fromUserId:fromUserId,
                toGroupId:toGroupId,
                objectName:objectName,
                content:content,
                pushContent:pushContent,
                pushData:pushData
            }, callback);
        },
        /**
         * 发送聊天室消息
         * @param fromUserId    发送人用户 Id。（必传）
         * @param toChatroomId  接收聊天室Id，提供多个本参数可以实现向多个聊天室发送消息。（必传）
         * @param objectName    消息类型，参考融云消息类型表.消息标志；可自定义消息类型。（必传）
         * @param content       发送消息内容，参考融云消息类型表.示例说明；如果 objectName 为自定义消息类型，该参数可自定义格式。（必传）
         * @param callback      发送完成回调
         */
        sendChatroom:function(fromUserId, toChatroomId, objectName, content, callback){
            that.request('/message/chatroom/publish', {
                fromUserId:fromUserId,
                toChatroomId:toChatroomId,
                objectName:objectName,
                content:content
            }, callback);
        },
        /**
         * 发送广播消息
         * @param fromUserId    发送人用户 Id。（必传）
         * @param objectName    消息类型，参考融云消息类型表.消息标志；可自定义消息类型。（必传）
         * @param content       发送消息内容，参考融云消息类型表.示例说明；如果 objectName 为自定义消息类型，该参数可自定义格式。（必传）
         * @param callback      完成回调
         */
        sendBroadcast:function(fromUserId, objectName, content, callback){
            that.request('/message/broadcast', {
                fromUserId:fromUserId,
                objectName:objectName,
                content:content
            }, callback);
        }
    };

    /**
     * 消息历史记录服务
     */
    this.messageHistory = {
        /**
         * 消息历史记录服务
         * @param date      指定北京时间某天某小时，格式为2014010101,表示：2014年1月1日凌晨1点。（必传）
         * @param callback  获取完成回调
         */
        query:function(date, callback){
            that.request('/message/history', {
                date:date
            }, callback);
        },
        /**
         * 消息历史记录删除
         * @param date      指定北京时间某天某小时，格式为2014010101,表示：2014年1月1日凌晨1点。（必传）
         * @param callback  完成回调
         */
        delete:function(date, callback){
            that.request('/message/history/delete', {
                date:date
            }, callback);
        }
    };

    /**
     * 群组服务
     */
    this.group = {
        /**
         * 同步用户所属群组
         * @param userId    被同步群信息的用户Id。（必传）
         * @param groups    该用户的群信息。（必传） 形式：{'group[1001]':'TestGroup1','group[1002]':'TestGroup2',...}
         * @param callback  完成回调
         */
        sync:function(userId, groups, callback){
            var params = {
                userId:userId
            };
            if (groups)
                for (var g in groups)
                    params[g] = groups[g];
            that.request('/group/sync', params, callback);
        },
        /**
         * 创建群组
         * @param userId    要加入群的用户 Id。（必传）
         * @param groupId   要加入的群 Id。（必传）
         * @param groupName 要加入的群 Id 对应的名称。（可选）
         * @param callback  完成回调
         */
        create:function(userId, groupId, groupName, callback){
            that.request('/group/create', {
                userId:userId,
                groupId:groupId,
                groupName:groupName
            }, callback);
        },
        /**
         * 加入群组
         * @param userId        要加入群的用户 Id。（必传）
         * @param groupId       要加入的群 Id。（必传）
         * @param groupName     要加入的群 Id 对应的名称。（可选）
         * @param callback      完成回调
         */
        join:function(userId, groupId, groupName, callback){
            that.request('/group/join', {
                userId:userId,
                groupId:groupId,
                groupName:groupName
            }, callback);
        },
        /**
         * 退出群组
         * @param userId    要退出群的用户 Id。（必传）
         * @param groupId   要退出的群 Id。（必传）
         * @param callback  完成回调
         */
        quit:function(userId, groupId, callback){
            that.request('/group/quit', {
                userId:userId,
                groupId:groupId
            }, callback);
        },
        /**
         * 解散群组
         * @param userId    操作解散群的用户 Id。（必传）
         * @param groupId   要解散的群 Id。（必传）
         * @param callback  完成回调
         */
        dismiss:function(userId, groupId, callback){
            that.request('/group/dismiss', {
                userId:userId,
                groupId:groupId
            }, callback);
        },
        /**
         * 刷新群组信息
         * @param groupId       群Id。（必传）
         * @param groupName     群名称。（必传）
         * @param callback      完成回调
         */
        refresh:function(groupId, groupName, callback){
            that.request('/group/refresh', {
                groupId:groupId,
                groupName:groupName
            }, callback);
        }
    };

    /**
     * 聊天室服务
     */
    this.chatroom = {
        /**
         * 创建聊天室
         * @param chatrooms 要创建的聊天室 形式：{'chatroom[id]':'name'}
         * @param callback  完成回调
         */
        create:function(chatrooms, callback){
            that.request('/chatroom/create', chatrooms, callback);
        },
        /**
         * 销毁聊天室
         * @param chatroomId    要销毁的聊天室 Id。（必传）
         * @param callback      完成回调
         */
        destroy:function(chatroomId, callback){
            that.request('/chatroom/destroy', {
                chatroomId:chatroomId
            }, callback);
        },
        /**
         * 查询聊天室信息
         * @param chatroomId    要查询的聊天室id（必传）
         * @param callback      完成回调
         */
        query:function(chatroomId, callback){
            that.request('/chatroom/query', {
                chatroomId:chatroomId
            }, callback);
        }
    }
};

/**
 * 获取随机数
 * @param Min
 * @param Max
 * @returns {*}
 */
function getRandomNum(Min,Max)
{
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}

/**
 * SHA1加密
 * @param data
 * @returns {*}
 */
function sha1(data)
{
    return Crypto.createHash('sha1').update(data).digest('hex');
}

/**
 * 判断是否数组
 * @param obj
 */
function isArray(obj)
{

}

module.exports = RongAPI;