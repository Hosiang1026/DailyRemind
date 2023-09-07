const { lottery } = require('./input')
const axios = require("axios");
require("dotenv").config();

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.57";
const options = { headers: { "User-Agent": UA }, rejectUnauthorized: false };
const lotteryURLs = [
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&pageNo=1&pageSize=1&systemType=PC",
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=3d&pageNo=1&pageSize=1&systemType=PC",
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=kl8&pageNo=1&pageSize=1&systemType=PC",
	"http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=qlc&pageNo=1&pageSize=1&systemType=PC"
];

async function getLotteryData(url) {
	const response = await axios.get(url, options);
	return response.data.result[0];
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function getLotteryCookie() {
	return new Promise(async (resolve, reject) => {
	try{
	    const response = await axios.get("http://www.cwl.gov.cn", { headers: { "User-Agent": UA } });
		options.headers.Cookie = response.headers["set-cookie"][0];
		process.env.ck = options.headers.Cookie;
		resolve(process.env.ck)
	} catch (error) {
		console.log('处理cookie失败', error.message || error);
		reject(error.message || error)
	}
})
}

//处理福利彩票数据
module.exports = handleLottery = () => {
	return new Promise(async (resolve, reject) => {
	try {
		getLotteryCookie();
		// 等待 5000 毫秒（5 秒）
		await sleep(5000);
		let lotteryContent = [];
		const cookieString = process.env.ck;
		const expiresString = cookieString.match(/Expires=([^;]+)/)[1];
		const isExpired = new Date().getTime() > new Date(expiresString).getTime();

		if (isExpired) {
			const response = await axios.get("http://www.cwl.gov.cn", { headers: { "User-Agent": UA } });
			options.headers.Cookie = response.headers["set-cookie"][0];
			process.env.ck = options.headers.Cookie;
		} else {
			options.headers.Cookie = cookieString;
		}

		const [SSQ, SD, KL8, QLC] = await Promise.all(lotteryURLs.map(getLotteryData));

		lotteryContent.push(`📈福利彩票`);

		let nowDate = new Date();
		let nowDay = nowDate.getDay();

		let SDArr = lottery.SD;
		for (let i = 0; i < SDArr.length; i++) {
			if (SDArr[i] == nowDay){
				lotteryContent.push(`\n🎈福彩3D\n`);
				lotteryContent.push(`· 开奖期号: ` + SD.code);
				lotteryContent.push(`· 开奖日期: ` + SD.date);
				if (SD.sales != ''){
					lotteryContent.push(`· 销售金额: ` + SD.sales + '元');
				}
				if (SD.poolmoney != ''){
					lotteryContent.push(`· 奖池金额: ` + SD.poolmoney + '元');
				}
				lotteryContent.push(`· 中奖号码: ` + SD.red);
				if (SD.content != ''){
					lotteryContent.push(`· 中奖情况: ` + SD.content);
				}
			}
		}

		let KL8Arr = lottery.KL8;
		for (let i = 0; i < KL8Arr.length; i++) {
			if (KL8Arr[i] == nowDay){
				lotteryContent.push(`\n🎈快乐8\n`);
				lotteryContent.push(`· 开奖期号: ` + KL8.code);
				lotteryContent.push(`· 开奖日期: ` + KL8.date);
				if (KL8.sales != ''){
					lotteryContent.push(`· 销售金额: ` + KL8.sales + '元');
				}
				if (KL8.poolmoney != ''){
					lotteryContent.push(`· 奖池金额: ` + KL8.poolmoney + '元');
				}
				lotteryContent.push(`· 中奖号码: ` + KL8.red);
				if (KL8.content != ''){
					lotteryContent.push(`· 中奖情况: ` + KL8.content);
				}
			}
		}

		let QLCArr = lottery.QLC;
		for (let i = 0; i < QLCArr.length; i++) {
			if (QLCArr[i] == nowDay){
				lotteryContent.push(`\n🎈七乐彩\n`);
				lotteryContent.push(`· 开奖期号: ` + QLC.code);
				lotteryContent.push(`· 开奖日期: ` + QLC.date);
				if (QLC.sales != ''){
					lotteryContent.push(`· 销售金额: ` + QLC.sales + '元');
				}
				if (QLC.poolmoney != ''){
					lotteryContent.push(`· 奖池金额: ` + QLC.poolmoney + '元');
				}
				lotteryContent.push(`· 红球号码: ` + QLC.red);
				lotteryContent.push(`· 蓝球号码: ` + QLC.blue);
				if (QLC.content != ''){
					lotteryContent.push(`· 中奖情况: ` + QLC.content);
				}
			}
		}

		let SSQArr = lottery.SSQ;
		for (let i = 0; i < SSQArr.length; i++) {
			if (SSQArr[i] == nowDay){
				lotteryContent.push(`\n🎈双色球\n`);
				lotteryContent.push(`· 开奖期号: ` + SSQ.code);
				lotteryContent.push(`· 开奖日期: ` + SSQ.date);
				if (SSQ.sales != ''){
					lotteryContent.push(`· 销售金额: ` + SSQ.sales + '元');
				}
				if (SSQ.poolmoney != ''){
					lotteryContent.push(`· 奖池金额: ` + SSQ.poolmoney + '元');
				}
				lotteryContent.push(`· 红球号码: ` + SSQ.red);
				lotteryContent.push(`· 蓝球号码: ` + SSQ.blue);
				if (SSQ.content != ''){
					lotteryContent.push(`· 中奖情况: ` + SSQ.content);
				}
			}
		}

		resolve(lotteryContent.join('\n'))
		console.log("获取福利彩票结果" + lotteryContent.join('\n'));
	} catch (error) {
		console.log('处理福利彩票数据失败', error.message || error);
		reject(error.message || error)
	}
	})
}
