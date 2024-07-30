const axios = require('axios');
const cheerio = require('cheerio');

const syncDataWithRetry = async (url, headers, maxRetries = 3) => {
	let retryCount = 0;
	while (retryCount <= maxRetries) {
		try {
			const response = await axios.get(url, { headers });
			console.log(`Response status code: ${response.status}`);

			if (response.status === 200) {
				const data = response.data;

				// 检查返回数据是否为HTML页面
				if (data.toLowerCase().includes("<html>")) {
					const $ = cheerio.load(data);
					const title = $("title").text();

					// 如果标题包含“无法访问”，则重试
					if (title.includes("无法访问")) {
						throw new Error("Page not accessible");
					}
				}

				return data;
			} else {
				console.log(`Request failed with status code: ${response.status}`);
				retryCount++;
			}
		} catch (error) {
			console.error(`Error occurred: ${error.message}`);
			retryCount++;
		}
	}
	return null;
};

const extractCityDZ = (dataStr) => {
	// 正则表达式匹配 `cityDZ` 到 `alarmDZ` 之间的内容
	const regex = /var cityDZ =({.*?});\s*var alarmDZ =/s;
	const match = dataStr.match(regex);
	if (match && match[1]) {
		try {
			const data = JSON.parse(match[1]);
			const weatherInfo = data.weatherinfo || {};

			const content = [
				`城市: ${weatherInfo.city || "未知"}`,
				`城市名称: ${weatherInfo.cityname || "未知"}`,
				`温度: ${weatherInfo.temp || "未知"}°C`,
				`天气: ${weatherInfo.weather || "未知"}`,
				`风况: ${weatherInfo.wd || "未知"}`,
				`风速: ${weatherInfo.ws || "未知"}`,
				`预报时间: ${weatherInfo.fctime || "未知"}`
			].join('\n');

			return `\n城市基本信息:\n${content}`;
		} catch (error) {
			console.error(`JSONDecodeError in cityDZ: ${error.message}`);
			return null;
		}
	}
};

const extractDataSK = (dataStr, cityname) => {
	// 正则表达式匹配 `dataSK` 到 `dataZS` 之间的内容
	const regex = /var dataSK =({.*?});\s*var dataZS =/s;
	const match = dataStr.match(regex);
	if (match && match[1]) {
		try {
			const data = JSON.parse(match[1]);

			const content = [
				`地区: ${cityname}`,
				`天气: ${data.weather || "未知"}`,
				`湿度: ${data.sd || "未知"}`,
				`温度: ${data.temp || "0"}°C`,
				`降雨量: ${data.rain || "0"}mm`,
				`风况: ${data.WD || "未知"} ${data.WS || ""} ${data.wse || ""}`,
				`预报时间: ${data.date || ""} ${data.time || ""}`
			].join('\n');

			return `\n实时天气信息:\n${content}`;
		} catch (error) {
			console.error(`JSONDecodeError in dataSK: ${error.message}`);
			return null;
		}
	}
};

const extractAlarmDZ = (dataStr) => {
	// 正则表达式匹配 `alarmDZ` 到 `dataSK` 之间的内容
	const regex = /var alarmDZ =({.*?});\s*var dataSK =/s;
	const match = dataStr.match(regex);
	if (match && match[1]) {
		try {
			const data = JSON.parse(match[1]);
			const alerts = data.w || [];

			if(alerts.length > 0){
				const content = alerts.map(alert => `预警信息: ${alert.w9 || "未知"}`).join('\n\n');
				return `\n气象预警信息:\n${content}`;
			}

		} catch (error) {
			console.error(`JSONDecodeError in alarmDZ: ${error.message}`);
			return null;
		}
	}
};

const extractDataZS = (dataStr) => {
	const indices = [
		'ys', 'xc', 'lk',
		'dy', 'tr', 'gj', 'fs', 'gl',
		'ac', 'co', 'uv', 'gz'
	];
	// 正则表达式匹配 `dataZS` 到 `cf` 之间的内容
	const regex = /var dataZS =({.*?});\s*var cf =/s;
	const match = dataStr.match(regex);
	if (match && match[1]) {
		try {
			const data = JSON.parse(match[1]);
			const zs = data.zs || {};

			const content = indices.map(index => {
				const name = zs[`${index}_name`] || "未知";
				const hint = zs[`${index}_hint`] || "未知";
				const des_s = zs[`${index}_des_s`] || "未知";

				return name !== "未知" ? `${name}: ${hint}, ${des_s}` : null;
			}).filter(line => line).join('\n');

			return `\n生活指数信息:\n${content}`;
		} catch (error) {
			console.error(`JSONDecodeError in dataZS: ${error.message}`);
			return null;
		}
	}
};

const extractFc = (dataStr, cityname) => {
	// 正则表达式匹配 `fc` 到结尾之间的内容
	const regex = /var fc\s*=\s*({[\s\S]*})/;
	const match = dataStr.match(regex);
	if (match && match[1]) {
		try {
			const data = JSON.parse(match[1]);
			const forecasts = data.f || [];

			const content = forecasts.map(forecast => {
				const date = forecast.fi ? forecast.fi.replace(/\//g, '-') : "未知";
				const day = forecast.fj || "未知";
				const tempHigh = forecast.fc || "未知";
				const tempLow = forecast.fd || "未知";
				const windDirection = forecast.fe || "未知";
				const windSpeed = forecast.fg || "未知";
				const humidity = forecast.fm || "未知";
				const comfortIndex = forecast.fn || "未知";

				return `日期: ${date} (${day})\n气温: ${tempLow}°C ~ ${tempHigh}°C\n湿度: ${humidity}%\n舒适度: ${comfortIndex}\n风向: ${windDirection} ${windSpeed}\n`;
			}).join('\n');

			return `\n${cityname}未来天气预报信息:\n${content}`;
		} catch (error) {
			console.error(`JSONDecodeError in fc: ${error.message}`);
			return null;
		}
	}
};

module.exports = handleWeather = () => {
	return new Promise(async (resolve, reject) => {
		const cities = [
			{ city_name: "安徽-怀宁", city_code: "101220605" },
			{ city_name: "浙江-余杭", city_code: "101210106" },
			{ city_name: "浙江-吴兴", city_code: "101210205" },
			{ city_name: "福建-福州", city_code: "101230101" }
		];

		const baseUrl = "https://d1.weather.com.cn/weather_index/{city_code}.html?_=1722309451962";
		const headers = {
			"Referer": "http://www.weather.com.cn/"
		};

		try {
			let weatherCityContent = []
			for(const city of cities) {
				const cityname = city.city_name;
				const url = baseUrl.replace("{city_code}", city.city_code);
				const dataStr = await syncDataWithRetry(url, headers);
				console.log(`正在获取 ${city.city_name} 的数据...`);
				if (dataStr != null) {
					var dataFc = extractFc(dataStr, cityname);
					if (dataFc != null) {
						weatherCityContent.push(dataFc);
					}
					weatherCityContent.join('\n\n');
				}
			}
			console.log('获取天气预报成功数据：', weatherCityContent);
			resolve(weatherCityContent.join('\n'))
		} catch (error) {
			console.log('处理天气预报数据失败', error.message || error);
			reject(error.message || error)
		}
	})
}
