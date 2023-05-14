
const axios = require('axios')
const { robotKey, atAll } = require('../input')
//调用机器人发送消息
const robot = async (content) => {//参数为内容
    return new Promise(async (resolve, reject) => {
        try {
            let mentioned_list = []
            atAll && mentioned_list.push("@all")
            const params = {
                method: 'POST',
                url: robotKey,
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
            } else {
                reject(data.errmsg || '发送失败')
            }

        } catch (error) {
            reject(error.message || error)
        }
    })
}

module.exports = robot