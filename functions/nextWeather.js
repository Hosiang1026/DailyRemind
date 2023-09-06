const { weather } = require('./input')
const axios = require('axios')
const publicIp = require('public-ip');

let allBrellaFlag = true;
let rainDayNum = 0;

//获取外网IP地址
const getPublicIPAddress = () => {
    return new Promise(async (resolve, reject) => {
        try {
            publicIp.v4(function (err, ipv4) {
                console.log('获取外网IP地址: ', ipv4);
                resolve(ipv4)
            });
        } catch (error) {
            console.log('获取外网IP地址失败', error.message || error);
            reject(error.message || error)
        }
    })
}

const getAllWeather = (weatherKey, weatherCityCode, allAppend) => {
	return new Promise(async (resolve, reject) => {
		try {
			let weatherContent = []
			//这是未来四天的天气预报
			const weatherReq = axios(`https://restapi.amap.com/v3/weather/weatherInfo?key=${weatherKey}&extensions=all&city=${weatherCityCode}`)
			const weatherRes = await weatherReq
			if (weatherRes.status == 200) {
				const dataArr = weatherRes.data.forecasts;
				let data = {
					province: dataArr[0].province,//省级
					city: dataArr[0].city,//区级
					casts: dataArr[0].casts //天气数据
				}
				console.log('获取未来四天的天气成功', data.casts);
				weatherContent.push(`\n🎈${data.province}${data.city}`);
				let weatherCastsArr = data.casts;
				for (let i = 0; i < weatherCastsArr.length; i++) {
					let weatherData = weatherCastsArr[i];
					let weatherWeek = weatherData.week;
					let weatherWeekName = '';
					switch (weatherWeek) {
						case "1":
							weatherWeekName = "周一";
							break;
						case "2":
							weatherWeekName = "周二";
							break;
						case "3":
							weatherWeekName = "周三";
							break;
						case "4":
							weatherWeekName = "周四";
							break;
						case "5":
							weatherWeekName = "周五";
							break;
						case "6":
							weatherWeekName = "周六";
							break;
						default:
							weatherWeekName = "周日";
					}

					let weathers = weatherData.dayweather;
					var weatherIcon = '';
					switch (weathers) {
						case "晴":
							weatherIcon = "🌤";
							break;
						case "阴":
							weatherIcon = "☁";
							break;
						case "多云":
							weatherIcon = "🌥";
							break;
						case "小雨":
							weatherIcon = "🌨";
							rainDayNum = rainDayNum+1;
							break;
						case "中雨":
							weatherIcon = "🌧";
							rainDayNum = rainDayNum+1;
							break;
						case "大雨":
							weatherIcon = "⛈";
							rainDayNum = rainDayNum+1;
							break;
						default:
							if (weathers.indexOf('晴') != -1){
								weatherIcon = "🌤";
							}
							if (weathers.indexOf('雨') != -1){
								weatherIcon = "🌨";
								rainDayNum = rainDayNum+1;
							}
					}
					weatherContent.push(`\n${weatherData.date} ${weatherWeekName}`);
					weatherContent.push(`· 天气: ${weathers}${weatherIcon}`);
					weatherContent.push(`· 气温: ${weatherData.nighttemp}℃ ~ ${weatherData.daytemp}℃`);
					weatherContent.push(`· 风况: ${weatherData.daywind}风${weatherData.daypower}级`);
				}

				if (rainDayNum > 0&&allAppend){
					weatherContent.push(`\n🌂最近${rainDayNum}天有雨, 记得带伞！`);
					rainDayNum = 0;
					allBrellaFlag = false;
				}
				resolve(weatherContent.join('\n'))
			} else {
				reject(weatherRes.data.info)
			}
		} catch (error) {
			console.log('获取今日天气失败', error.message || error);
			reject(error.message || error)
		}
	})
}

//处理实况天气数据
module.exports = handleWeather = () => {
    return new Promise(async (resolve, reject) => {
        try {
			let weatherCityContent = []
			//获取当天是周几、此刻是上午OR下午
			let nowDate = new Date();
			let nowDay = nowDate.getDay();
            let nowHour = nowDate.getHours();
			let nowTime;
			if(nowHour < 11) {
				nowTime = "AM"; //小于就是AM
			} else if(nowHour <= 13) {
				nowTime = "MM"; //大于就是PM
			} else {
                nowTime = "PM"; //大于就是PM
            }
			const baseCityCodeArr = [];
            let weatherKey = weather.key;
			let weatherBaseDataArr = weather.base_data;
			//组装实况天气城市编码参数
		    for (let i = 0; i < weatherBaseDataArr.length; i++) {
				const weatherTimeArr = weatherBaseDataArr[i].time;
				for (let j = 0; j < weatherTimeArr.length; j++) {
					const weatherTime = weatherTimeArr[j];
					if(nowTime == weatherTime) {
						const weatherBaseDayArr = weatherBaseDataArr[i].day;
						for (let k = 0; k < weatherBaseDayArr.length; k++) {
							if (nowDay == weatherBaseDayArr[k]) {
								let weatherCityCode = weatherBaseDataArr[i].city_code;
								baseCityCodeArr.push(weatherCityCode);
							}
						}
					}
				}
		    }

			//城市编码参数为空时，由IP地址获取
			if(baseCityCodeArr.length == 0){
				//获取天气数据
				let IPAddress = await getPublicIPAddress()
				//let IPAddress = '112.10.223.108'
			    let weatherCityCode = await getWeatherCityCode(IPAddress)
				baseCityCodeArr.push(weatherCityCode);
			}

			//获取实况天气数据
			let baseAppend = false;
			if(baseCityCodeArr.length > 0){
				weatherCityContent.push(`🌍实时天气`);
				for (let i = 0; i < baseCityCodeArr.length; i++) {
					//获取天气数据
					let weatherCityCode = baseCityCodeArr[i]
					if(i+1 == baseCityCodeArr.length){
						baseAppend = true;
					}
					let cityContent = await getBaseWeather(weatherKey, weatherCityCode, baseAppend)
					weatherCityContent.push(cityContent);
				}
			}

			if(baseCityCodeArr.length > 0) {
				if (allBrellaFlag){
					if (nowDay != 6 && nowDay != 0) {
						if (nowTime == "AM") {
							weatherCityContent.push(`\n🕘9点上班，记得打卡!`)
						}

						if (nowTime == "PM") {
							weatherCityContent.push(`\n🕡18点30分下班，记得打卡!`)
						}
					}
				}
			}

			resolve(weatherCityContent.join('\n'))
        } catch (error) {
            console.log('处理天气数据失败', error.message || error);
            reject(error.message || error)
        }
    })
}

//处理未来天气数据
module.exports = handleNextWeather = () => {
	return new Promise(async (resolve, reject) => {
		try {
			let weatherCityContent = []
			//获取当天是周几、此刻是上午OR下午
			let nowDate = new Date();
			let nowDay = nowDate.getDay();
			let nowHour = nowDate.getHours();
			let nowTime;
			if(nowHour < 11) {
				nowTime = "AM"; //小于就是AM
			} else if(nowHour <= 13) {
				nowTime = "MM"; //大于就是PM
			} else {
				nowTime = "PM"; //大于就是PM
			}

			const allCityCodeArr = [];
			let weatherKey = weather.key;
			let weatherAllDataArr = weather.all_data;

			//组装未来天气城市编码参数
			for (let i = 0; i < weatherAllDataArr.length; i++) {
				const weatherTimeArr = weatherAllDataArr[i].time;
				for (let j = 0; j < weatherTimeArr.length; j++) {
					const weatherTime = weatherTimeArr[j];
					if(nowTime == weatherTime) {
						const weatherAllDayArr = weatherAllDataArr[i].day;
						for (let k = 0; k < weatherAllDayArr.length; k++) {
							if (nowDay == weatherAllDayArr[k]) {
								let weatherCityCode = weatherAllDataArr[i].city_code;
								allCityCodeArr.push(weatherCityCode);
							}
						}
					}
				}
			}

			//获取未来天气数据
			let allAppend = false;
			if(allCityCodeArr.length > 0){
				weatherCityContent.push(`🌍天气预报`);
				for (let i = 0; i < allCityCodeArr.length; i++) {
					//获取天气数据
					let weatherCityCode = allCityCodeArr[i]
					if(i+1 == allCityCodeArr.length){
						allAppend = true;
					}
					let cityContent = await getAllWeather(weatherKey, weatherCityCode, allAppend)
					weatherCityContent.push(cityContent);
				}
			}

			resolve(weatherCityContent.join('\n'))
		} catch (error) {
			console.log('处理天气数据失败', error.message || error);
			reject(error.message || error)
		}
	})
}

//根据IP地址获得城市代码
const getWeatherCityCode = (IPAddress) => {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await axios.get(`https://restapi.amap.com/v3/ip?ip=${IPAddress}&key=${weather.key}`)
			// console.log('城市代码', res.data);
			if (res.status == 200) {
				resolve(res.data.adcode)
			} else {
				reject(res.data)
			}
		} catch (error) {
			console.log('获取城市代码失败', error.message || error);
			reject(error.message || error)
		}
	})
}