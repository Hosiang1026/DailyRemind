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
		await sleep(5000); // 等待 3000 毫秒（3 秒）
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

		lotteryContent.push(`\n🎈3D\n`);
		lotteryContent.push(`· 开奖期号: ` + SD.code);
		lotteryContent.push(`· 开奖时间: ` + SD.date);
		lotteryContent.push(`· 中奖号码: ` + SD.red);

		lotteryContent.push(`\n🎈快乐8\n`);
		lotteryContent.push(`· 开奖期号: ` + KL8.code);
		lotteryContent.push(`· 开奖时间: ` + KL8.date);
		lotteryContent.push(`· 中奖号码: ` + KL8.red);

		lotteryContent.push(`\n🎈七乐彩\n`);
		lotteryContent.push(`· 开奖期号: ` + QLC.code);
		lotteryContent.push(`· 开奖时间: ` + QLC.date);
		lotteryContent.push(`· 红球号码: ` + QLC.red);
		lotteryContent.push(`· 蓝球号码: ` + QLC.blue);

		lotteryContent.push(`\n🎈双色球\n`);
		lotteryContent.push(`· 开奖期号: ` + SSQ.code);
		lotteryContent.push(`· 开奖时间: ` + SSQ.date);
		lotteryContent.push(`· 红球号码: ` + SSQ.red);
		lotteryContent.push(`· 蓝球号码: ` + SSQ.blue);

		resolve(lotteryContent.join('\n'))
		console.log("获取福利彩票结果" + lotteryContent.join('\n'));
	} catch (error) {
		console.log('处理福利彩票数据失败', error.message || error);
		reject(error.message || error)
	}
	})
}
