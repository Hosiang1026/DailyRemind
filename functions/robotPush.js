
const axios = require('axios')
const { robotPush, atAll } = require('../input')
//调用机器人发送消息
const robot = async (content) => {//参数为内容
    return new Promise(async (resolve, reject) => {
        try {
            let mentioned_list = []
            atAll && mentioned_list.push("@all")
            const params = {
                method: 'POST',
                url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=' + robotPush.key,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: JSON.stringify({//携带的数据
                    "msgtype": "text",
                    "text": {
                        content,
                        mentioned_list
                    }
                }),
            }

            const { data } = await axios(params)
            if (data.errcode == 0) {
                resolve(data)
                console.log('微信机器人推送消息成功', data);
            } else {
                reject(data.errmsg || '发送失败')
            }

        } catch (error) {
            reject(error.message || error)
        }
    })
}

module.exports = handleRobotPush = async (content) => {//参数为内容
    return new Promise(async (resolve, reject) => {
        try {
            if(robotPush.open){
                const res = await robot(content)
                resolve(res)
            }else{
                console.log('微信机器人推送消息关闭', robotPush.open);
            }
        } catch (error) {
            reject(error.message || error)
        }
    })
}