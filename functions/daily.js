const { daily } = require('./input')
var calendar = require("./calendar");
var calendarplus = require("./calendarplus");
//计算节日时间到今天的时间差，参数格式为 YYYY-MM-DD
const sumTimeToNow = (targetTime, nowTime) => {
    let diff = (new Date(targetTime.replace(/-/g, '/'))).getTime() - (new Date(nowTime.replace(/-/g, '/'))).getTime()//日期的差值，有正负
    const absTime = Math.abs(diff) //日期差的绝对值
    let formatTimeDiff = parseInt(absTime / (3600 * 1000 * 24))
    return formatTimeDiff
}

//计算今天到下次节日时间的时间差，参数格式为 YYYY-MM-DD
const diffTimeToDaily = (nowTime, targetTime) => {
    let diff = (new Date(nowTime.replace(/-/g, '/'))).getTime() - (new Date(targetTime.replace(/-/g, '/'))).getTime()//日期的差值，有正负
    const absTime = Math.abs(diff) //日期差的绝对值
    let formatTimeDiff = parseInt(absTime / (3600 * 1000 * 24))
    return formatTimeDiff
}

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

            //把今日日期转为YYYY-MM-DD的格式
            let date = new Date();
            let currentYear = date.getFullYear();
            let currentMonth = date.getMonth();
            let currentDate = date.getDate();
            let nowDate = `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${(currentDate) < 10 ? '0' + (currentDate) : (currentDate)}`

            let lunarDate = calendar.solar2lunar();
            let lunarDateStr = lunarDate.Animal +'年' +'•'+ lunarDate.gzYear +'年'+ lunarDate.IMonthCn + lunarDate.IDayCn;
            content.push(`${nowDate} ${lunarDate.ncWeek} \n${lunarDateStr}\n`);
            content.push(`📆重要节日: \n`);

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
                    let nextAnniversaryDate = currentYear+'-'+ anniversaryMonth+'-'+anniversaryDay;
                    if (new Date(nowDate) > new Date(nextAnniversaryDate)){
                        nextAnniversaryDate = currentYear+1+'-'+ anniversaryMonth+'-'+anniversaryDay;
                    }
                    let diffYear = currentYear - anniversaryYear;
                    let solarAnniversaryDate = calendar.conversion(anniversaryDate);
                    if (nowDate == nextAnniversaryDate) {
                        if (anniversaryType == 0 ||anniversaryType == 1 ||anniversaryType == 2) {
                            let todayDate = '<'+anniversaryDate.split('-').join('.')+'>';
                            let todayContent = ' ' + diffYear+'周年';
                            var obj = {todayName:anniversaryName,todayDate:todayDate, todayContent:todayContent};
                            todayArr.push(obj);
                        }
                        if (anniversaryType == 3) {
                            //获取生日星座
                            let anniversaryAstro = calendar.conversionAstro(solarAnniversaryDate);
                            let todayDate = '<'+anniversaryDate.split('-').join('.')+'>';
                            var obj = {todayName:anniversaryName,todayDate:todayDate, todayContent:anniversaryAstro};
                            todayArr.push(obj);
                        }
                    }
                    let diffTime = diffTimeToDaily(nowDate, nextAnniversaryDate);
                    if (tempTime == 0){
                        tempName = anniversaryName;
                        tempTime = diffTime;
                    }
                    if (anniversaryType == 0) {
                        //计算累计值
                        let sumTime = sumTimeToNow(anniversaryDate, nowDate);
                        loveContent = `\n❤我们在一起恋爱: 已经${sumTime}天`;
                    }

                    if (anniversaryType == 1) {
                        if (diffTime < tempTime) {
                            tempName = anniversaryName;
                            tempTime = diffTime;
                        }
                    }

                    if (anniversaryType == 2||anniversaryType == 3) {
                        let solarAnniversaryDate = calendar.conversion(nextAnniversaryDate);
                        let diffTime = diffTimeToDaily(nowDate, solarAnniversaryDate);
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
                    let diffTime = diffTimeToDaily(nowDate, nextLegalDate);

                    if (nowDate == nextLegalDate) {
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
                    if (diffTime < 15) {
                        let legalHolidayNum = legalHoliday.length;
                        if (legalHolidayNum == 1) {
                            startYearLegalDate = currentYearBar + startLegalHoliday;
                            if (new Date(nowDate) > new Date(startYearLegalDate)) {
                                startYearLegalDate = currentYear + 1 + '-' + startLegalHoliday;
                            }
                            if (legalRepair != 0) {
                                let legalRepairNum = legalRepair.length;
                                tipsArr.push(`👩‍💻补班${legalRepairNum}天: ${legalRepair.join('、')}`)
                            }

                            if (legalHolidayNum > 2){
                                tipsArr.push(`⛱放假${legalHolidayNum}天: ${startLegalHoliday} ~ ${endLegalHoliday}\n`)
                            }else{
                                tipsArr.push(`⛱放假${legalHolidayNum}天: ${legalHoliday.join('、')}\n`)
                            }
                        } else {
                            startYearLegalDate = currentYearBar + startLegalHoliday;
                            if (new Date(nowDate) > new Date(startYearLegalDate)) {
                                startYearLegalDate = currentYear + 1 + '-' + startLegalHoliday;
                            }
                            endYearLegalDate = currentYearBar + endLegalHoliday;
                            if (new Date(nowDate) > new Date(endYearLegalDate)) {
                                endYearLegalDate = currentYear + 1 + '-' + endLegalHoliday;
                            }
                            let startDiffTime = diffTimeToDaily(nowDate, startYearLegalDate);
                            tipsArr.push(`⏳距离${legalName}开始放假还有${startDiffTime}天\n`)
                            if (legalRepair != 0) {
                                let legalRepairNum = legalRepair.length;
                                tipsArr.push(`👩‍💻补班${legalRepairNum}天: ${legalRepair.join('、')}`)
                            }
                            let legalHolidayNum = legalHoliday.length;
                            if (legalHolidayNum > 2){
                                tipsArr.push(`⛱放假${legalHolidayNum}天: ${startLegalHoliday} ~ ${endLegalHoliday}\n`)
                            }else{
                                tipsArr.push(`⛱放假${legalHolidayNum}天: ${legalHoliday.join('、')}\n`)
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
                    let diffTime = diffTimeToDaily(nowDate, nextSFtvDate);
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
                    let lFtvYearDate = currentYear + '-' + lFtvDate;
                    let lFtvSolarDate = calendar.conversion(lFtvYearDate);
                    let targetArr = lFtvSolarDate.split('-');
                    let nextlFtvSolarDate = lFtvSolarDate;
                    if (new Date(nowDate) > new Date(nextlFtvSolarDate)){
                        nextlFtvSolarDate = currentYear + 1+'-'+ targetArr[1]+'-'+targetArr[2];
                    }
                    //计算差值
                    let diffTime = diffTimeToDaily(nowDate, nextlFtvSolarDate);
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
                for (let i = 0; i < termArr.length; i++) {
                    const element = termArr[i];
                    let termSort = element.sort;
                    let termName = element.name;
                    let termMonth = element.month;
                    let termSolarDate = calendar.conversionTerm(currentYear, termMonth, termSort);
                    let nextTermSolarDate = termSolarDate;
                    if (new Date(nowDate) > new Date(nextTermSolarDate)){
                        nextTermSolarDate = calendar.conversionTerm(currentYear+1, termMonth, termSort);
                    }
                    //计算差值
                    let diffTime = diffTimeToDaily(nowDate, nextTermSolarDate)+1;
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
                    let diffTime = diffTimeToDaily(nowDate, nextSpecialSolarDate);
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

            //最近的节日或今日的节日
            if(todayArr.length > 0){
                for (var i = 0; i < todayArr.length; i++) {
                    let todayName = todayArr[i].todayName;
                    let todayDate = todayArr[i].todayDate;
                    let todayContent = todayArr[i].todayContent;
                    content.push(`· 今天是${todayName}🎉  \n${todayDate} ${todayContent}`);
                }
            }else{
                let minTempTime = Math.min.apply(Math, latelyArr.map(item => { return item['tempTime'] }))
                for (var j = 0; j < latelyArr.length; j++) {
                    let tempName = latelyArr[j].tempName;
                    let tempTime = latelyArr[j].tempTime;
                    if (minTempTime == latelyArr[j].tempTime){
                        content.push(`⏳距离下一个节日: \n📌${tempName}: 还有${tempTime}天\n`);
                    }else{
                        contentArr.push(`· ${tempName}: 还有${tempTime}天`);
                    }
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
                for (var i = 0; i < contentArr.length - 1; i++) {
                    // 内层循环,控制比较的次数，并且判断两个数的大小
                    for (var j = 0; j < contentArr.length - 1 - i; j++) {
                        // 如果前面的数大，放到后面(当然是从小到大的冒泡排序)
                        if (contentArr[j].length > contentArr[j + 1].length) {
                            var temp = contentArr[j];
                            contentArr[j] = contentArr[j + 1];
                            contentArr[j + 1] = temp;
                        }
                    }
                }

                for (var i = 0; i < contentArr.length; i++) {
                    content.push(contentArr[i]);
                }
            }
            //恋爱天数
            content.push(loveContent);

            console.log('获取重要节日成功', content.join('\n'));
            resolve(content.join('\n'))
        } catch (error) {
            reject(error.message || error)
        }
    })

}