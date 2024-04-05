const { gasoline } = require('./input')
const axios = require('axios');
const cheerio = require('cheerio');
//内容数组
let content = [];
let textContent = '';
//汽油价格API: https://api.help.bj.cn/apis/youjia/
module.exports = handleGasoline = () => {
    fetchContent(`http://www.qiyoujiage.com`);
    return new Promise(async (resolve, reject) => {
        try {
            const provinceArr = gasoline.province;
            const modelArr = gasoline.model;
            if (provinceArr.length == 0 || modelArr.length == 0){
                console.log('汽油价格模块参数未配置');
                reject('')
            }else{
                content.push(`⛽今日油价 `)
            }
            const gasolineReq = axios(`http://api.help.bj.cn/apis/youjia/`)
            const gasolineRes = await gasolineReq
            if (gasolineRes.status == 200) {
                const gasolineArr = gasolineRes.data.data;
                //名称
                const keyNameArr = gasolineArr[0];
                let keyName = {
                    province: keyNameArr[0],//地区
                    model92: keyNameArr[1],//92
                    model95: keyNameArr[2],//95
                    model98: keyNameArr[3],//98
                    model0: keyNameArr[4],//0
                }

            for (let i = 0; i < provinceArr.length; i++) {
                const provinceName = provinceArr[i];
               for (let j = 1; j < gasolineArr.length; j++) {
                    const dataArr = gasolineArr[j];
                    const value = dataArr[0];
                    if (value == provinceName){
                        content.push(`\n🚘${value}`);
                        for (let k = 0; k < modelArr.length; k++) {
                            if (keyName.model0 == modelArr[k]){
                                content.push(`· ${keyName.model0} : ${dataArr[4]}`);
                            }
                            if (keyName.model92 == modelArr[k]){
                                content.push(`· ${keyName.model92} : ${dataArr[1]}`);
                            }
                            if (keyName.model95 == modelArr[k]){
                                content.push(`· ${keyName.model95} : ${dataArr[2]}🚩`);
                            }
                            if (keyName.model98 == modelArr[k]){
                                content.push(`· ${keyName.model98} : ${dataArr[3]}`);
                            }
                        }
                    }
               }
            }
            content.push(textContent);
            console.log('获取汽油价格成功', content);
             resolve(content.join('\n'))
            } else {
            reject(weatherRes.weatherinfo)
            }

        } catch (error) {
            console.log('获取汽油价格失败', error.message || error);
            reject(error.message || error)
        }
    })

    async function fetchContent(url) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            //选择id为"left"的div下的第一个div
            const firstDiv = $('#left > div:first-child');
            // 使用text()获取文本内容，不包括子元素的HTML
            textContent = firstDiv.text();
            // 使用.split()分割字符串，保留split之前的部分
            const splitIndex = textContent.split('document.writeln').shift().lastIndexOf('');
            if (splitIndex >= 0) {
                textContent = textContent.substring(0, splitIndex-1);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
}
