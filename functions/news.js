const { news } = require('../config/input')
const axios = require('axios')


//获得新闻数据
//每日新闻: http://bjb.yunwj.top/php/60miao/qq.php
//每日新闻2: http://bjb.yunwj.top/php/qq.php
const getNews = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const newsReq = axios(`http://c.3g.163.com/nc/article/list/T1467284926140/0-20.html`)
            const newsRes = await newsReq
            if (newsRes.status == 200) {// && indicesRes.data.code == 200
            /**
            let data = {
                picture: newsRes.data.tp,//封面
                content: newsRes.data.wb,//内容
             }
             **/
            let data = {
                content: newsRes.data.T1467284926140,//内容
            }

            console.log('获取每日新闻成功', data.content);
            resolve(data)
            } else {
            reject(newsRes.statusText)
            }

        } catch (error) {
            console.log('获取每日新闻失败', error.message || error);
            reject(error.message || error)
        }
    })
}

//处理新闻数据
module.exports = handleNews = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let newsContent = [] //内容数组
            const { picture, content } = await getNews()

            let newsSize = news.size;
            if(newsSize > content.length){
                newsSize = content.length;
            }
            if(content.length > 0){
                newsContent.push(`📊新闻早报\n`);
                for (let i = 0; i < newsSize; i++) {
                    const element = content[i];
                    if (null != element){
                        newsContent.push(`· ${element.source}: ${element.title}`)
                    }
                }
            }

            resolve(newsContent.join('\n'))
            console.log('处理新闻数据:', newsContent);
        } catch (error) {
            console.log('处理新闻数据失败', error.message || error);
            reject(error.message || error)
        }
    })
}