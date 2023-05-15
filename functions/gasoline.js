const { gasoline } = require('./config/input')
const axios = require('axios')

//汽油价格API: https://api.help.bj.cn/apis/youjia/
module.exports = handleGasoline = () => {
    return new Promise(async (resolve, reject) => {
        try {
            //内容数组
            let content = []
            const provinceArr = gasoline.province;
            const modelArr = gasoline.model;
            if (provinceArr.length == 0 || modelArr.length == 0){
                console.log('汽油价格模块参数未配置');
                reject('')
            }else{
                content.push(`⛽今日油价 `)
            }
            const gasolineReq = axios(`https://api.help.bj.cn/apis/youjia/`)
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
                                content.push(`· ${keyName.model95} : ${dataArr[2]}`);
                            }
                            if (keyName.model98 == modelArr[k]){
                                content.push(`· ${keyName.model98} : ${dataArr[3]}`);
                            }
                        }
                    }
               }
            }
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
}