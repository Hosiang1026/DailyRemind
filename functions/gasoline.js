const { gasoline } = require('./input')
const axios = require('axios');
const cheerio = require('cheerio');
//内容数组
let content = [];
let textContent = '';
//汽油价格API: https://api.help.bj.cn/apis/youjia/
//抓取各个城市的汽油价格
async function fetchContent(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // 选择 <ul class="ylist"> 元素
        const priceList = $('.ylist');

        // 用于存储价格信息的对象
        const prices = {};

        // 获取所有 <li> 元素
        const allItems = priceList.find('li');

        // 遍历所有的 <li> 元素
        allItems.each((index, element) => {
            const $element = $(element);

            // 查找城市名
            if ($element.hasClass('t')) {
                // 获取城市名
                const city = $element.find('a').text().trim();

                // 获取该城市下的四个价格
                const cityPrices = {};
                // 从当前城市开始的下一个元素开始取价格
                for (let i = 0; i < 4; i++) {
                    const priceElement = allItems.eq(index + 1 + i);
                    if (priceElement.length) {
                        const price = priceElement.text().trim();
                        switch (i) {
                            case 0:
                                cityPrices['92号汽油'] = price;
                                break;
                            case 1:
                                cityPrices['95号汽油'] = price;
                                break;
                            case 2:
                                cityPrices['98号汽油'] = price;
                                break;
                            case 3:
                                cityPrices['0号柴油'] = price;
                                break;
                        }
                    }
                }

                // 将价格存储到对象中
                prices[city] = cityPrices;
            }
        });

        return prices;
    } catch (error) {
        throw new Error('An error occurred while fetching the content: ' + error.message);
    }
}

//抓取汽油调价情况
async function fetchUpdateText(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract specific text about oil price changes
        const priceUpdateText = $('#rightTop').text().trim().split('\n').filter(line => line.includes('相互转告')).join(' ');

        return priceUpdateText;
    } catch (error) {
        throw new Error('An error occurred while fetching the update text: ' + error.message);
    }
}

// Define handleGasoline function to use fetchContent
module.exports = handleGasoline = async () => {
    try {
        const url = 'http://www.qiyoujiage.com'; // The URL to fetch data from
        const prices = await fetchContent(url);
        const updateText = await fetchUpdateText(url);

        const provinceArr = gasoline.province;
        const modelArr = gasoline.model;
        let content = [];

        if (provinceArr.length === 0 || modelArr.length === 0) {
            console.log('汽油价格模块参数未配置');
            throw new Error('汽油价格模块参数未配置');
        } else {
            content.push('⛽今日油价');
        }

        for (let i = 0; i < provinceArr.length; i++) {
            const provinceName = provinceArr[i];
            const dataArr = prices[provinceName];

            if (dataArr) {
                content.push(`\n🚘${provinceName}`);
                for (let j = 0; j < modelArr.length; j++) {
                    const model = modelArr[j];
                    if (dataArr[model] !== undefined) {
                        content.push(`· ${model} : ${dataArr[model]}`);
                    }
                }
            }
        }

        console.log('获取汽油价格成功：\n', content);
        content.push('\n'+ updateText);
        console.log('获取汽油调价情况成功：\n',  updateText);
        return content.join('\n');

    } catch (error) {
        console.log('获取汽油价格失败', error.message || error);
        throw new Error(error.message || error);
    }
};
