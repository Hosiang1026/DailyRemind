const { daily } = require('./input')
var calendar = require("./calendar");
const axios = require('axios')
//var calendarplus = require("./calendarplus");

//把列表处理为字符串
module.exports = handleTimeList = () => {
    return new Promise(async (resolve, reject) => {
        try {
            //内容数组
            let content = []
            let contentArr = []
            let todayArr = []
            let latelyArr = []
            let tipsArr = []
            let loveContent;

            let todayLicenseArr = []
            let endLicenseArr = []

            //把今日日期转为YYYY-MM-DD的格式 第一天
            let date = new Date();
            let currentYear = date.getFullYear();
            let currentMonth = date.getMonth();
            let currentDate = date.getDate();
            let firstDate = calendar.conversion(`${(currentYear)}` +'-01-01');
            let nowDate = `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${(currentDate) < 10 ? '0' + (currentDate) : (currentDate)}`

            let yearDiffTime = calendar.sumTimeToNow(firstDate, nowDate)+1;
            let lunarDate = calendar.solar2lunar();
            let lunarDateStr = lunarDate.Animal +'年' +'•'+ lunarDate.gzYear +'年'+ lunarDate.IMonthCn + lunarDate.IDayCn + ' 第' + yearDiffTime + '天' ;
            content.push(`${nowDate} ${lunarDate.ncWeek} ${lunarDate.astro} \n${lunarDateStr}\n`);

            //type: 0 为累计周年(阳历)
            //type: 1 为倒计周年(阳历)
            //type: 2 为倒计周年(阴历)
            //type: 3 为倒计天数(阴历)

            //纪念日/生日
            let anniversaryArr = daily.anniversary;
            if(anniversaryArr.length > 0){
                let tempName = '';
                let tempTime = 0;
                for (let i = 0; i < anniversaryArr.length; i++) {
                    const element = anniversaryArr[i];
                    let anniversaryName = element.name;
                    let anniversaryDate = element.date;
                    let anniversaryType = element.type;
                    //计算差值 下次
                    let targetArr = anniversaryDate.split('-');
                    let anniversaryYear = targetArr[0];
                    let anniversaryMonth = targetArr[1];
                    let anniversaryDay = targetArr[2];
                    let nextAnniversaryDate = currentYear-1 +'-'+ anniversaryMonth+'-'+anniversaryDay;
                    //阴历转阳历
                    if (anniversaryType == 2 || anniversaryType == 3) {
                        nextAnniversaryDate = calendar.conversion(nextAnniversaryDate);
                    }
                    //如果当前日期大于今年纪念日期，则获取下一年的纪念日期
                    if (new Date(nowDate) > new Date(nextAnniversaryDate) && new Date(currentYear+1+'-01-01') > new Date(nextAnniversaryDate)){
                        nextAnniversaryDate = currentYear+1+'-'+ anniversaryMonth+'-'+anniversaryDay;
                        //阴历转阳历
                        if (anniversaryType == 2 || anniversaryType == 3) {
                            nextAnniversaryDate = calendar.conversion(nextAnniversaryDate);
                        }
                    }

                    if (nowDate == nextAnniversaryDate) {
                        if (anniversaryType == 0 ||anniversaryType == 1 ||anniversaryType == 2) {
                            let diffYear = currentYear - anniversaryYear;
                            let todayDate = '<'+anniversaryDate.split('-').join('.')+'>';
                            let todayContent = ' ' + diffYear+'周年';
                            var obj = {todayName:anniversaryName,todayDate:todayDate, todayContent:todayContent};
                            todayArr.push(obj);
                        }
                        if (anniversaryType == 3) {
                            //获取生日星座
                            let anniversaryAstro = lunarDate.astro;
                            let todayDate = '<'+anniversaryDate.split('-').join('.')+'>';
                            let todayAge = currentYear - anniversaryYear;
                            let todayContent = todayAge + '岁' + anniversaryAstro + todayDate;
                            var obj = {todayName:anniversaryName, todayContent:todayContent};
                            todayArr.push(obj);
                        }
                    }

                    let diffTime = calendar.diffTimeToDaily(nowDate, nextAnniversaryDate);
                    if (tempTime == 0){
                        tempName = anniversaryName;
                        tempTime = diffTime;
                    }
                    if (anniversaryType == 0) {
                        //计算累计值
                        let sumTime = calendar.sumTimeToNow(anniversaryDate, nowDate);
                        loveContent = `\n❤我们在一起恋爱: 已经${sumTime}天`;
                    }

                    if (anniversaryType == 1) {
                        if (diffTime < tempTime) {
                            tempName = anniversaryName;
                            tempTime = diffTime;
                        }
                    }

                    if (anniversaryType == 2||anniversaryType == 3) {
                        let diffTime = calendar.diffTimeToDaily(nowDate, nextAnniversaryDate);
                        if (diffTime < tempTime) {
                            tempName = anniversaryName;
                            tempTime = diffTime;
                        }
                    }
                }

                var obj = {tempName:tempName,tempTime:tempTime};
                latelyArr.push(obj);
            }

            //法定节假日
            let legalArr = daily.legal;
            if(legalArr.length > 0){
                let tempName = '';
                let tempTime = 0;
                for (let i = 0; i < legalArr.length; i++) {
                    const element = legalArr[i];
                    let legalName = element.name;
                    let legalDate = element.date;
                    let legalHoliday = element.holiday;
                    let legalRepair = element.repair;
                    //计算差值
                    let targetArr = legalDate.split('-');
                    let currentYearBar = currentYear + '-';
                    let nextLegalDate = currentYearBar + targetArr[0] + '-' + targetArr[1];
                    if (new Date(nowDate) > new Date(nextLegalDate)) {
                        nextLegalDate = currentYear + 1 + '-' + targetArr[0] + '-' + targetArr[1];
                    }
                    let diffTime = calendar.diffTimeToDaily(nowDate, nextLegalDate);

                    if (diffTime == 0) {
                        let todayDate = '<'+nowDate.split('-').join('.')+'>';
                        var obj = {todayName:legalName,todayDate:todayDate, todayContent:''};
                        todayArr.push(obj);
                    } else {
                        if (tempTime == 0) {
                            tempName = legalName;
                            tempTime = diffTime;
                        } else if (diffTime < tempTime&&diffTime > 14) {
                            tempName = legalName;
                            tempTime = diffTime;
                        }
                    }

                    let startYearLegalDate = nowDate;
                    let endYearLegalDate = nowDate;
                    let startLegalHoliday = legalHoliday[0];
                    let endLegalHoliday = legalHoliday[legalHoliday.length - 1];

                    let legalHolidayNum = legalHoliday.length;
                    if (diffTime > legalHolidayNum && diffTime < 15) {
                        let legalHolidayNum = legalHoliday.length;
                        if (legalHolidayNum == 1) {
                            startYearLegalDate = currentYearBar + startLegalHoliday;
                            if (new Date(nowDate) > new Date(startYearLegalDate)) {
                                startYearLegalDate = currentYear + 1 + '-' + startLegalHoliday;
                            }
                            if (legalRepair != 0) {
                                let legalRepairNum = legalRepair.length;
                                tipsArr.push(`📟补班${legalRepairNum}天: ${legalRepair.join('、')}`)
                            }

                            if (legalHolidayNum > 2){
                                tipsArr.push(`⛱假期${legalHolidayNum}天: ${startLegalHoliday} ~ ${endLegalHoliday}\n`)
                            }else{
                                tipsArr.push(`⛱假期${legalHolidayNum}天: ${legalHoliday.join('、')}\n`)
                            }
                        } else {
                            startYearLegalDate = currentYearBar + startLegalHoliday;
                            endYearLegalDate = currentYearBar + endLegalHoliday;
                            let startDiffTime = calendar.diffTimeToDaily(nowDate, startYearLegalDate);
                            if (startDiffTime > 0){
                                tipsArr.push(`⏳距离${legalName}开始放假还有${startDiffTime}天`)
                                if (legalRepair != 0) {
                                    let legalRepairNum = legalRepair.length;
                                    tipsArr.push(`📟补班${legalRepairNum}天: ${legalRepair.join('、')}`)
                                }

                                if (legalHolidayNum > 2){
                                    tipsArr.push(`⛱假期${legalHolidayNum}天: ${startLegalHoliday} ~ ${endLegalHoliday}\n`)
                                }else{
                                    tipsArr.push(`⛱假期${legalHolidayNum}天: ${legalHoliday.join('、')}\n`)
                                }
                            }
                        }
                    }

                }

                var obj = {tempName:tempName,tempTime:tempTime};
                latelyArr.push(obj);
            }

            //阳历节日
            let sFtvArr = daily.sFtv;
            if(sFtvArr.length > 0){
                let tempName = '';
                let tempTime = 0;
                for (let i = 0; i < sFtvArr.length; i++) {
                    const element = sFtvArr[i];
                    let sFtvName = element.name;
                    let sFtvDate = element.date;
                    let targetArr = sFtvDate.split('-');
                    let nextSFtvDate = currentYear+'-'+ targetArr[0]+'-'+targetArr[1];
                    if (new Date(nowDate) > new Date(nextSFtvDate)){
                        nextSFtvDate = currentYear+1+'-'+ targetArr[0]+'-'+targetArr[1];
                    }
                    //计算差值
                    let diffTime = calendar.diffTimeToDaily(nowDate, nextSFtvDate);
                    if (nowDate == nextSFtvDate) {
                        let todayDate = '<'+nowDate.split('-').join('.')+'>';
                        var obj = {todayName:sFtvName,todayDate:todayDate, todayContent:''};
                        todayArr.push(obj);
                    }else{
                        if (tempTime == 0){
                            tempName = sFtvName;
                            tempTime = diffTime;
                        }else if (diffTime < tempTime){
                            tempName = sFtvName;
                            tempTime = diffTime;
                        }
                    }
                }

                var obj = {tempName:tempName,tempTime:tempTime};
                latelyArr.push(obj);
            }

            //阴历节日
            let lFtvArr = daily.lFtv;
            if(lFtvArr.length > 0){
                let tempName = '';
                let tempTime = 0;
                for (let i = 0; i < lFtvArr.length; i++) {
                    const element = lFtvArr[i];
                    let lFtvName = element.name;
                    let lFtvDate = element.date;
                    let lFtvYearDate = currentYear-1 + '-' + lFtvDate;
                    let lFtvSolarDate = calendar.conversion(lFtvYearDate);
                    let targetArr = lFtvSolarDate.split('-');
                    let nextlFtvSolarDate = lFtvSolarDate;
                    if (new Date(nowDate) > new Date(nextlFtvSolarDate)){
                        nextlFtvSolarDate = currentYear + 1+'-'+ targetArr[1]+'-'+targetArr[2];
                    }
                    //计算差值
                    let diffTime = calendar.diffTimeToDaily(nowDate, nextlFtvSolarDate);
                    if (nowDate == nextlFtvSolarDate) {
                        let todayDate = '<'+nowDate.split('-').join('.')+'>';
                        var obj = {todayName:lFtvName,todayDate:todayDate, todayContent:''};
                        todayArr.push(obj);
                    }else{
                        if (tempTime == 0){
                            tempName = lFtvName;
                            tempTime = diffTime;
                        }else if (diffTime < tempTime){
                            tempName = lFtvName;
                            tempTime = diffTime;
                        }
                    }
                }
                var obj = {tempName:tempName,tempTime:tempTime};
                latelyArr.push(obj);
            }

            //二十四节气
            let termArr = daily.term;
            if(termArr.length > 0){
                let tempName = '';
                let tempTime = 0;
                let tempSort = 0;
                let preCurrentYear = currentYear-1;
                for (let i = 0; i < termArr.length; i++) {
                    const element = termArr[i];
                    let termSort = element.sort;
                    let termName = element.name;
                    let termMonth = element.month;

                    let termSolarDate = calendar.conversionTerm(preCurrentYear, termMonth, termSort+2);
                    if(termSort == 23 || termSort == 24){
                        if(currentMonth == 0||currentMonth == 11||currentMonth == 12){
                            termSolarDate = calendar.conversionTerm(preCurrentYear+1, termMonth, termSort);
                        }
                    }
                    let nextTermSolarDate = termSolarDate;

                    //计算差值
                    if (new Date(nowDate) < new Date(nextTermSolarDate)){
                        let diffTime = calendar.diffTimeToDaily(nowDate, nextTermSolarDate);
                        if (diffTime == 0) {
                            let todayDate = '<'+nowDate.split('-').join('.')+'>';
                            var obj = {todayName:termName,todayDate:todayDate, todayContent:''};
                            todayArr.push(obj);
                        }else{
                            if (tempTime == 0){
                                tempSort = termSort;
                                tempName = termName;
                                tempTime = diffTime;
                            }else if (diffTime < tempTime){
                                tempSort = termSort;
                                tempName = termName;
                                tempTime = diffTime;
                            }
                        }
                    }
                }

                for (let i = 0; i < termArr.length; i++) {
                    const element = termArr[i];
                    let termSort = element.sort;
                    let termName = element.name;
                    let termMonth = element.month;
                    let termSolarDate = calendar.conversionTerm(currentYear, termMonth, termSort+2);
                    if(termSort == 23 || termSort == 24){
                        if(currentMonth == 0||currentMonth == 11||currentMonth == 12){
                            termSolarDate = calendar.conversionTerm(currentYear+1, termMonth, termSort);
                        }
                    }
                    let nextTermSolarDate = termSolarDate;
                    if (new Date(nowDate) > new Date(nextTermSolarDate)){
                        nextTermSolarDate = calendar.conversionTerm(currentYear+1, termMonth, termSort);
                    }
                    //计算差值
                    let diffTime = calendar.diffTimeToDaily(nowDate, nextTermSolarDate);
                    if (diffTime == 0) {
                        let todayDate = '<'+nowDate.split('-').join('.')+'>';
                        var obj = {todayName:termName,todayDate:todayDate, todayContent:''};
                        todayArr.push(obj);
                    }else{
                        if (tempTime == 0){
                            tempSort = termSort;
                            tempName = termName;
                            tempTime = diffTime;
                        }else if (diffTime < tempTime){
                            tempSort = termSort;
                            tempName = termName;
                            tempTime = diffTime;
                        }
                    }
                }

                tempName = '第'+tempSort+'个节气'+tempName;
                var obj = {tempName:tempName,tempTime:tempTime};
                latelyArr.push(obj);
            }
            //特殊节日
            let specialArr = daily.special;
            if(specialArr.length > 0){
                let tempName = '';
                let tempTime = 0;
                for (let i = 0; i < specialArr.length; i++) {
                    const element = specialArr[i];
                    let specialName = element.name;
                    let specialDate = element.date;
                    let targetArr = specialDate.split('/');
                    let specialMonth = targetArr[0];
                    let specialWeek = targetArr[1];
                    let specialNums = targetArr[2];
                    let specialSolarDate = calendar.conversionParentDate(currentYear, specialMonth, specialWeek, specialNums);
                    let nextSpecialSolarDate = specialSolarDate;
                    if (new Date(nowDate) > new Date(nextSpecialSolarDate)){
                        nextSpecialSolarDate = calendar.conversionParentDate(currentYear+1, specialMonth, specialWeek, specialNums);
                    }
                    //计算差值
                    let diffTime = calendar.diffTimeToDaily(nowDate, nextSpecialSolarDate);
                    if (nowDate == nextSpecialSolarDate) {
                        let todayDate = '<'+nowDate.split('-').join('.')+'>';
                        var obj = {todayName:specialName,todayDate:todayDate, todayContent:''};
                        todayArr.push(obj);
                    }else{
                        if (tempTime == 0){
                            tempName = specialName;
                            tempTime = diffTime;
                        }else if (diffTime < tempTime){
                            tempName = specialName;
                            tempTime = diffTime;
                        }
                    }
                }
                var obj = {tempName:tempName,tempTime:tempTime};
                latelyArr.push(obj);
            }

            //证件有效期
            let licenseArr = daily.license;
            if(licenseArr.length > 0){
                for (let i = 0; i < licenseArr.length; i++) {
                    const element = licenseArr[i];
                    let licenseName = element.name;
                    let licenseDate = element.date;
                    if (new Date(nowDate) <= new Date(licenseDate)){
                        //计算差值
                        let diffTime = calendar.diffTimeToDaily(nowDate, licenseDate);
                        if (diffTime < 31){
                            let todayDate = '<'+licenseDate.split('-').join('.')+'>';
                            //var obj = {todayName:licenseName,todayDate:todayDate, todayContent:'即将到期了'};
                            todayLicenseArr.push(`* ${licenseName} ${todayDate} \n 即将到期了 🚨\n`);
                        }else{
                            endLicenseArr.push(`· ${licenseName}: 还有${diffTime}天`);
                        }
                    }
                }
            }

            content.push(`📆重要节日 \n`);

            //最近的节日或今日的节日
            if(todayArr.length > 0){
                let todayTempArr = [];
                for (var i = 0; i < todayArr.length; i++) {
                    let todayName = todayArr[i].todayName;
                    let todayContent = todayArr[i].todayContent;
                    todayTempArr.push(`🎉今天是${todayName} \n ${todayContent}`);
                }
                todayTempArr.sort((a, b) => a.length - b.length);
                content = content.concat(todayTempArr);
                //随机笑话
                if (Math.floor(Math.random() * 10) % 2 == 0) {
                    const res = await axios.get('https://api.vvhan.com/api/joke?type=json')
                    content.push(`\n ${res.data.joke}  \n-- 「${res.data.title}」\n`)
                }else{
                    const res = await axios.get('https://api.uomg.com/api/comments.163?format=json')
                    content.push(`\n${res.data.data.content} \n-- 来自@${res.data.data.nickname}「${res.data.data.name}」${res.data.data.artistsname}\n`)
                }
            }else{
                let minTempTime = Math.min.apply(Math, latelyArr.map(item => { return item['tempTime'] }));
                let minTempArr = [];
                for (var j = 0; j < latelyArr.length; j++) {
                    let tempName = latelyArr[j].tempName;
                    let tempTime = latelyArr[j].tempTime;
                    if (minTempTime == latelyArr[j].tempTime){
                        minTempArr.push(`* ${tempName}: 还有${tempTime}天`);
                    }else{
                        contentArr.push(`· ${tempName}: 还有${tempTime}天`);
                    }
                }

                if (minTempArr.length > 0){
                    content.push(`📌距离下一个节日`);
                    minTempArr.sort((a, b) => a.length - b.length);
                    minTempArr[minTempArr.length-1] = minTempArr[minTempArr.length-1] + '\n';
                    content = content.concat(minTempArr);
                }
            }
            //输出补班/放假温馨提示
            if(tipsArr.length > 0){
                for (var i = 0; i < tipsArr.length; i++) {
                    content.push(tipsArr[i]);
                }
            }

            //输出内容按长度排序
            if(contentArr.length > 0) {
                let tempContentArr = [];
                for (var i = 0; i < contentArr.length; i++) {
                    tempContentArr.push(contentArr[i]);
                }
                tempContentArr.sort((a, b) => calendar.getTextLength(a) - calendar.getTextLength(b));
                content = content.concat(tempContentArr);
            }

            //证件有效期
            if(todayArr.length == 0){
                content.push(`\n 💳证件有效期 \n`);
                if (todayLicenseArr.length > 0) {
                    todayLicenseArr.sort((a, b) => calendar.getTextLength(a) - calendar.getTextLength(b));
                    content = content.concat(todayLicenseArr);
                }
                if(endLicenseArr.length > 0) {
                    endLicenseArr.sort((a, b) => calendar.getTextLength(a) - calendar.getTextLength(b));
                    content = content.concat(endLicenseArr);
                }
            }

            //累计恋爱天数
            if(todayArr.length == 0) {
                content.push(loveContent);
                if (Math.floor(Math.random() * 10) % 2 == 0) {
                    const res = await axios.get('https://api.shadiao.pro/chp')
                    content.push(`💘${res.data.data.text}`)
                }else{
                    const res = await axios.get('https://api.vvhan.com/api/sao?type=json')
                    content.push(`💘${res.data.ishan}`)
                }
            }

            console.log('获取重要节日成功\n', content.join('\n'));
            resolve(content.join('\n'))
        } catch (error) {
            reject(error.message || error)
        }
    })

}
