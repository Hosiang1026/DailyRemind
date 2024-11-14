const { daily } = require('./input')
var calendar = require("./calendar");
//const axios = require('axios')
//var calendarplus = require("./calendarplus");

let loveContent;

//处理当天阴历和当前天数
const handleFestivalSolarDate = (nowDate, lunarDate, currentYear, content) => {
    let festivalDate = '01-01';

    //N-2年
    let pre2FestivalDate = (currentYear-2) + '-' + festivalDate;
    let pre2FestivalSolarDate = calendar.conversion(pre2FestivalDate);
    let newlFtvYearDate = pre2FestivalSolarDate;

    //N-1年
    let preFestivalDate = (currentYear-1) + '-' + festivalDate;
    let preFestivalSolarDate = calendar.conversion(preFestivalDate);
    if (new Date(nowDate) >= new Date(preFestivalSolarDate)){
        newlFtvYearDate = preFestivalSolarDate;
    }

    //N年
    let curFestivalDate = currentYear + '-' + festivalDate;
    let curFestivalSolarDate = calendar.conversion(curFestivalDate);
    if (new Date(nowDate) >= new Date(curFestivalSolarDate)){
        newlFtvYearDate = curFestivalSolarDate;
    }

    //N+1年
    let nextFestivalDate = (currentYear+1) + '-' + festivalDate;
    let nextFestivalSolarDate = calendar.conversion(nextFestivalDate);
    if (new Date(nowDate) >= new Date(nextFestivalSolarDate)){
        newlFtvYearDate = nextFestivalSolarDate;
    }

    //N+2年
    let next2FestivalDate = (currentYear+2) + '-' + festivalDate;
    let next2FestivalSolarDate = calendar.conversion(next2FestivalDate);
    if (new Date(nowDate) >= new Date(next2FestivalSolarDate)){
        newlFtvYearDate = next2FestivalSolarDate;
    }

    //当前天数
    let yearDiffTime = calendar.diffTimeToDaily(nowDate, newlFtvYearDate)+1;
    let lunarDateStr = lunarDate.gzYear + lunarDate.Animal +'年' + lunarDate.IMonthCn + lunarDate.IDayCn + ' 第' + yearDiffTime + '天' ;
    content.push(`${nowDate} ${lunarDate.ncWeek} ${lunarDate.astro}\n${lunarDateStr}\n`);
};

//处理纪念日
//type: 0 为累计周年(阳历)
//type: 1 为倒计周年(阳历)
//type: 2 为倒计周年(阴历)
const handleAnniversaryDate = (nowDate, currentYear, todayArr, latelyArr) => {
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

            //N+1年
            let nextAnniversaryDate = (currentYear+1) + '-' + anniversaryMonth+'-'+anniversaryDay;
            //阴历转阳历
            if (anniversaryType == 2) {
                nextAnniversaryDate = calendar.conversion(nextAnniversaryDate);
            }
            let resAnniversaryDate = nextAnniversaryDate;

            //N年
            let curAnniversaryDate = currentYear + '-' + anniversaryMonth+'-'+anniversaryDay;
            //阴历转阳历
            if (anniversaryType == 2) {
                curAnniversaryDate = calendar.conversion(curAnniversaryDate);
            }
            if (new Date(nowDate) <= new Date(curAnniversaryDate)){
                resAnniversaryDate = curAnniversaryDate;
            }

            //N-1年
            let preAnniversaryDate = (currentYear-1) + '-' + anniversaryMonth+'-'+anniversaryDay;
            //阴历转阳历
            if (anniversaryType == 2) {
                preAnniversaryDate = calendar.conversion(preAnniversaryDate);
            }
            if (new Date(nowDate) <= new Date(preAnniversaryDate)){
                resAnniversaryDate = preAnniversaryDate;
            }

            let diffTime = calendar.diffTimeToDaily(nowDate, resAnniversaryDate);
            if (diffTime == 0) {
                if (anniversaryType == 2) {
                    let anniversarySolarDate = calendar.conversion(anniversaryDate);
                    let targetSolarArr = anniversarySolarDate.split('-');
                    anniversaryYear = targetSolarArr[0];
                }

                let diffYear = currentYear - anniversaryYear;
                let todayDate = '<'+anniversaryDate.split('-').join('.')+'>';
                let todayContent = ' ' + diffYear+'周年快乐';
                if (anniversaryName == '结婚纪念日'){
                    let marriageArr = daily.marriage;
                    for (let i = 0; i < marriageArr.length; i++) {
                        const element = marriageArr[i];
                        let marriageName = element.name;
                        let marriageAge = element.age;
                        if(marriageAge == diffYear){
                            todayContent = marriageName +'-'+ diffYear+'周年快乐';
                        }
                    }
                }
                var obj = {todayName:anniversaryName,todayDate:todayDate, todayContent:todayContent};
                todayArr.push(obj);
            }

            if (tempTime == 0){
                tempName = anniversaryName;
                tempTime = diffTime;
            }
            if (anniversaryType == 0) {
                //计算累计值
                let sumTime = calendar.sumTimeToNow(anniversaryDate, nowDate);
                loveContent = `\n💘我们在一起恋爱: ${sumTime}天`;
            }else{
                if (diffTime < tempTime) {
                    tempName = anniversaryName;
                    tempTime = diffTime;
                }
            }
        }

        var obj = {tempName:tempName,tempTime:tempTime};
        latelyArr.push(obj);
    }
};

//处理生日
const handleBirthdayDate = (nowDate, lunarDate, currentYear, todayArr, latelyArr) => {
    let birthdayArr = daily.birthday;
    if(birthdayArr.length > 0){
        let tempName = '';
        let tempTime = 0;
        for (let i = 0; i < birthdayArr.length; i++) {
            const element = birthdayArr[i];
            let birthdayName = element.name;
            let birthdayDate = element.date;
            //计算差值
            let targetArr = birthdayDate.split('-');
            let birthdayYear = targetArr[0];
            let birthdayMonth = targetArr[1];
            let birthdayDay = targetArr[2];

            //N+1年
            let nextBirthdayDate = (currentYear+1) + '-' + birthdayMonth+'-'+birthdayDay;
            let nextBirthdaySolarDate = calendar.conversion(nextBirthdayDate);
            let resBirthdayDate = nextBirthdaySolarDate;

            //N年
            let curBirthdayDate = currentYear + '-' + birthdayMonth+'-'+birthdayDay;
            let curBirthdaySolarDate = calendar.conversion(curBirthdayDate);
            if (new Date(nowDate) <= new Date(curBirthdaySolarDate)){
                resBirthdayDate = curBirthdaySolarDate;
            }

            //N-1年
            let preBirthdayDate = (currentYear-1) + '-' + birthdayMonth+'-'+birthdayDay;
            let preBirthdaySolarDate = calendar.conversion(preBirthdayDate);
            if (new Date(nowDate) <= new Date(preBirthdaySolarDate)){
                resBirthdayDate = preBirthdaySolarDate;
            }

            let diffTime = calendar.diffTimeToDaily(nowDate, resBirthdayDate);
            if (diffTime == 0) {
                //获取生日星座
                let anniversaryAstro = lunarDate.astro;
                let todayDate = '<'+birthdayDate.split('-').join('.')+'>';
                let todayAge = currentYear - birthdayYear;
                let todayContent = todayAge + '岁' + anniversaryAstro;
                var obj = {todayName:birthdayName, todayDate:todayDate, todayContent:todayContent};
                todayArr.push(obj);
            }

            if (tempTime == 0){
                tempName = birthdayName;
                tempTime = diffTime;
            }

            if (diffTime < tempTime) {
                tempName = birthdayName;
                tempTime = diffTime;
            }
        }

        var obj = {tempName:tempName,tempTime:tempTime};
        latelyArr.push(obj);
    }
};

//处理法定节假日
const handleLegalDate = (nowDate, currentMDDate, currentYear, todayArr, latelyArr, tipsArr) => {
    let legalArr = daily.legal;
    if(legalArr.length > 0){
        let tempName = '';
        let tempTime = 0;
        for (let i = 0; i < legalArr.length; i++) {
            const element = legalArr[i];
            let legalName = element.name;
            let legalDate = element.date;
            let legalFreeway = element.freeway;
            let legalHoliday = element.holiday;
            let legalRepair = element.repair;
            var existHoliday = false;
            //补班或放假提示
            if(legalHoliday != 0){
                existHoliday = legalHoliday.includes(currentMDDate);
                if(existHoliday){
                    let holidayFrist =currentYear + '-'+ legalHoliday[0];
                    let holidayDiff = calendar.sumTimeToNow(holidayFrist, nowDate);
                    tipsArr.push(`⛱祝大家假期愉快！`);
                    tipsArr.push(`* ${legalName}放假: 第${holidayDiff+1}天 `)
                    if(legalFreeway == 1){
                        tipsArr.push(`* 全国高速通行: 免费 \n`)
                    }else{
                        tipsArr.push(`* 全国高速通行: 收费 \n`)
                    }
                }
            }
            if(legalRepair != 0){
                let existRepair = legalRepair.includes(currentMDDate);
                if(existRepair){
                    tipsArr.push(`📟今天${legalName}补班，努力工作！\n `);
                }
            }

            //计算差值
            let targetArr = legalDate.split('-');
            let currentYearBar = currentYear + '-';
            let nextLegalDate = currentYearBar + targetArr[0] + '-' + targetArr[1];
            if (new Date(nowDate) > new Date(nextLegalDate)) {
                nextLegalDate = currentYear + 1 + '-' + targetArr[0] + '-' + targetArr[1];
            }
            let diffTime = calendar.diffTimeToDaily(nowDate, nextLegalDate);
            if (diffTime == 0) {
                var obj = {todayName:legalName,todayDate:'', todayContent:''};
                todayArr.push(obj);
            } else {
                if (tempTime == 0) {
                    tempName = legalName;
                    tempTime = diffTime;
                } else if (diffTime < tempTime&&diffTime > 0) {
                    tempName = legalName;
                    tempTime = diffTime;
                }
            }

            let startYearLegalDate = nowDate;
            let endYearLegalDate = nowDate;
            let startLegalHoliday = legalHoliday[0];
            let endLegalHoliday = legalHoliday[legalHoliday.length - 1];

            let legalHolidayNum = legalHoliday.length;
            if (diffTime+legalHolidayNum < 15) {
                let legalHolidayNum = legalHoliday.length;
                if (legalHolidayNum == 1) {
                    tipContentStr = tipContentStr +`⏳距离${legalName}放假还有${diffTime}天 `;
                    startYearLegalDate = currentYearBar + startLegalHoliday;
                    if (new Date(nowDate) > new Date(startYearLegalDate)) {
                        startYearLegalDate = currentYear + 1 + '-' + startLegalHoliday;
                    }
                    if(legalFreeway == 1){
                        tipsArr.push(`* 高速通行: 免费`)
                    }else{
                        tipsArr.push(`* 高速通行: 收费`)
                    }

                    if (legalRepair != 0) {
                        let legalRepairNum = legalRepair.length;
                        tipsArr.push(`* 补班${legalRepairNum}天: ${legalRepair.join('、')}`)
                    }

                    if (legalHolidayNum > 2){
                        tipsArr.push(`* 假期${legalHolidayNum}天: ${startLegalHoliday} ~ ${endLegalHoliday}\n`)
                    }else{
                        tipsArr.push(`* 假期${legalHolidayNum}天: ${legalHoliday.join('、')}\n`)
                    }

                } else if (!existHoliday){
                    startYearLegalDate = currentYearBar + startLegalHoliday;
                    endYearLegalDate = currentYearBar + endLegalHoliday;
                    let startDiffTime = calendar.diffTimeToDaily(nowDate, startYearLegalDate);
                    if (startDiffTime > 0){
                        tipsArr.push(`⏳距离${legalName}放假还有${startDiffTime}天`)
                        if(legalFreeway == 1){
                            tipsArr.push(`* 高速通行: 免费`)
                        }else{
                            tipsArr.push(`* 高速通行: 收费`)
                        }

                        if (legalRepair != 0) {
                            let legalRepairNum = legalRepair.length;
                            tipsArr.push(`* 补班${legalRepairNum}天: ${legalRepair.join('、')}`)
                        }

                        if (legalHolidayNum > 2){
                            tipsArr.push(`* 假期${legalHolidayNum}天: ${startLegalHoliday} ~ ${endLegalHoliday}\n`)
                        }else{
                            tipsArr.push(`* 假期${legalHolidayNum}天: ${legalHoliday.join('、')}\n`)
                        }
                    }
                }
            }

        }

        var obj = {tempName:tempName,tempTime:tempTime};
        latelyArr.push(obj);
    }
};

//处理阴历节日
const handleLFtvDate = (nowDate, currentYear, todayArr, latelyArr) => {
    let lFtvArr = daily.lFtv;
    if(lFtvArr.length > 0){
        let tempName = '';
        let tempTime = 0;
        for (let i = 0; i < lFtvArr.length; i++) {
            const element = lFtvArr[i];
            let lFtvName = element.name;
            let lFtvDate = element.date;

            //N+1年
            let nextlFtvYearDate = (currentYear+1) + '-' + lFtvDate;
            let nextlFtvSolarDate = calendar.conversion(nextlFtvYearDate);
            let reslFtvSolarDate = nextlFtvSolarDate;

            //N年
            let curlFtvYearDate = currentYear + '-' + lFtvDate;
            let curlFtvSolarDate = calendar.conversion(curlFtvYearDate);
            if (new Date(nowDate) <= new Date(curlFtvSolarDate)){
                reslFtvSolarDate = curlFtvSolarDate;
            }

            //N-1年
            let prelFtvYearDate = (currentYear-1) + '-' + lFtvDate;
            let prelFtvSolarDate = calendar.conversion(prelFtvYearDate);
            if (new Date(nowDate) <= new Date(prelFtvSolarDate)){
                reslFtvSolarDate = prelFtvSolarDate;
            }

            //计算差值
            let diffTime = calendar.diffTimeToDaily(nowDate, reslFtvSolarDate);
            if (diffTime == 0) {
                var obj = {todayName:lFtvName,todayDate:'', todayContent:''};
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
};

//处理二十四节气
const handleTermDate = (nowDate, currentYear, todayArr, latelyArr) => {
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

            //特殊处理
            let termSortStr;
            if(termSort <= 22){
                termSortStr = termSort + 2;
            }else{
                termSortStr = termSort - 22;
            }

            //N+1年
            let nextTermSolarDate = calendar.conversionTerm(currentYear+1, termMonth, termSortStr);
            let resTermSolarDate = nextTermSolarDate;

            //N年
            let curTermSolarDate = calendar.conversionTerm(currentYear, termMonth, termSortStr);
            if (new Date(nowDate) <= new Date(curTermSolarDate)){
                resTermSolarDate = curTermSolarDate;
            }

            //N-1年
            let preTermSolarDate = calendar.conversionTerm(currentYear-1, termMonth, termSortStr);
            if (new Date(nowDate) <= new Date(preTermSolarDate)){
                resTermSolarDate = preTermSolarDate;
            }

            //计算差值
            let diffTime = calendar.diffTimeToDaily(nowDate, resTermSolarDate);
            if (diffTime == 0) {
                var obj = {todayName:termName,todayDate:'', todayContent:''};
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
};

//处理国际节日
const handleInternationDate = (nowDate, currentYear, todayArr, latelyArr) => {
    let internationArr = daily.internation;
    if(internationArr.length > 0) {
        let tempName = '';
        let tempTime = 0;
        for (let i = 0; i < internationArr.length; i++) {
            const element = internationArr[i];
            let internationArrName = element.name;
            let internationArrDate = element.date;
            let targetArr = internationArrDate.split('-');
            let nextInternationArrDate = currentYear + '-' + targetArr[0] + '-' + targetArr[1];
            if (new Date(nowDate) > new Date(nextInternationArrDate)) {
                nextInternationArrDate = currentYear + 1 + '-' + targetArr[0] + '-' + targetArr[1];
            }
            //计算差值
            let diffTime = calendar.diffTimeToDaily(nowDate, nextInternationArrDate);
            if (diffTime == 0) {
                var obj = {todayName: internationArrName, todayDate: '', todayContent: ''};
                todayArr.push(obj);
            } else {
                if (tempTime == 0) {
                    tempName = internationArrName;
                    tempTime = diffTime;
                } else if (diffTime < tempTime) {
                    tempName = internationArrName;
                    tempTime = diffTime;
                }
            }
        }

        var obj = {tempName:tempName,tempTime:tempTime};
        latelyArr.push(obj);
    }
};

//处理阳历节日
const handleSFtvDate = (nowDate, currentYear, todayArr, intAllArr) => {
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
            if (diffTime == 0) {
                var obj = {todayName:sFtvName,todayDate:'', todayContent:''};
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

        var obj = {tempName: tempName, tempTime: tempTime};
        intAllArr.push(obj);
    }
};

//处理特殊节日
const handleSpecialDate = (nowDate, currentYear, todayArr, intAllArr) => {
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
            if (diffTime == 0) {
                var obj = {todayName:specialName,todayDate:'', todayContent:''};
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
        intAllArr.push(obj);
    }
};

//获取复活节
const getEasterDate = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    let easterDates = new Date(year, month - 1, day); // 注意：月份是 0 索引，3 表示 4 月
    let easterYear = easterDates.getFullYear();
    let easterMonth = easterDates.getMonth();
    let easterDate = easterDates.getDate();
    let easterDateStr = `${easterYear}-` + `${(easterMonth + 1) < 10 ? '0' + (easterMonth + 1) : (easterMonth + 1)}-${(easterDate) < 10 ? '0' + (easterDate) : (easterDate)}`;
    return easterDateStr;
};

//处理复活节
const handleEasterDate = (nowDate, currentYear, todayArr, intAllArr) => {
    //复活节
    //N+1年
    let nextEasterDate = getEasterDate(currentYear+1);
    let resEasterDate = nextEasterDate;

    //N年
    let curEasterDate = getEasterDate(currentYear);
    if (new Date(nowDate) <= new Date(curEasterDate)){
        resEasterDate = curEasterDate;
    }

    //N-1年
    let preEasterDate = getEasterDate(currentYear-1);
    if (new Date(nowDate) <= new Date(preEasterDate)){
        resEasterDate = preEasterDate;
    }

    //计算差值
    let diffTime = calendar.diffTimeToDaily(nowDate, resEasterDate);
    if (diffTime == 0) {
        var obj = {todayName:`复活节`,todayDate:'', todayContent:''};
        todayArr.push(obj);
    }else{
        var obj = {tempName:`复活节`,tempTime:diffTime};
        intAllArr.push(obj);
    }
};

//处理证件有效期
const handleLicenseDate = (nowDate, currentYear, todayLicenseArr, endLicenseArr) => {
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
                    if(diffTime == 0){
                        todayLicenseArr.push(`* ${licenseName}🚨 \n 今天到期，请尽快处理\n`);
                    }else{
                        let todayDate = '<'+licenseDate.split('-').join('.')+'>';
                        todayLicenseArr.push(`* ${licenseName}🚨 \n ${todayDate} \n ${diffTime}天后到期，请及时处理\n`);
                    }
                }else{
                    endLicenseArr.push(`· ${licenseName}: 还有${diffTime}天`);
                }
            }
        }
    }
};

//把列表处理为字符串
module.exports = handleTimeList = () => {
    return new Promise(async (resolve, reject) => {
        try {
            //内容数组
            let content = []
            let contentArr = []
            let todayArr = []
            let latelyArr = []
            let intAllArr = []
            let tipsArr = []
            let todayLicenseArr = []
            let endLicenseArr = []

            //把今日日期转为YYYY-MM-DD的格式 第一天
            let date = new Date();
            let currentYear = date.getFullYear();
            let currentMonth = date.getMonth();
            let currentDate = date.getDate();
            let currentMDDate = `${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${(currentDate) < 10 ? '0' + (currentDate) : (currentDate)}`;
            let nowDate = `${currentYear}-${currentMDDate}`;

            let lunarDate = calendar.solar2lunar();

            //当天阴历和当前天数
            handleFestivalSolarDate(nowDate, lunarDate, currentYear, content);

            //纪念日
            handleAnniversaryDate(nowDate, currentYear, todayArr, latelyArr);

            //生日
            handleBirthdayDate(nowDate, lunarDate, currentYear, todayArr, latelyArr);

            //法定节假日
            handleLegalDate(nowDate, currentMDDate, currentYear, todayArr, latelyArr, tipsArr);

            //阴历节日
            handleLFtvDate(nowDate, currentYear, todayArr, latelyArr);

            //二十四节气
            handleTermDate(nowDate, currentYear, todayArr, latelyArr);

            //国际节日
            handleInternationDate(nowDate, currentYear, todayArr, latelyArr);

            //阳历节日
            handleSFtvDate(nowDate, currentYear, todayArr, intAllArr);

            //特殊节日
            handleSpecialDate(nowDate, currentYear, todayArr, intAllArr);

            //处理复活节
            handleEasterDate(nowDate, currentYear, todayArr, intAllArr);

            //复活节、特殊节日和阳历节日合并
            if(intAllArr.length > 0) {
                // 找到tempTime最小的对象并放入新数组
                const minObj = intAllArr.reduce((prev, curr) => {
                    return curr.tempTime < prev.tempTime ? curr : prev;
                });

                latelyArr.push(minObj);
            }

            //证件有效期
            handleLicenseDate(nowDate, currentYear, todayLicenseArr, endLicenseArr);

            content.push(`📆重要节日 \n`);

            //最近的节日或今日的节日
            if(todayArr.length > 0){
                let todayTempArr = [];
                for (var i = 0; i < todayArr.length; i++) {
                    let todayName = todayArr[i].todayName;
                    let todayDate = todayArr[i].todayDate;
                    let todayContent = todayArr[i].todayContent;
                    if (todayName != ''&&todayDate != ''&&todayContent != ''){
                        todayTempArr.push(`今天是${todayName}🎉 \n${todayContent} ${todayDate} \n`);
                    }else if (todayName != ''&&todayDate != ''){
                        todayTempArr.push(`今天是${todayName}🎉 \n${todayContent} \n`);
                    }else if (todayName != ''){
                        todayTempArr.push(`今天是${todayName}🎉 \n`);
                    }
                }
                todayTempArr.sort((a, b) => a.length - b.length);
                content = content.concat(todayTempArr);
                //随机笑话
                //const res = await axios.get('https://api.uomg.com/api/comments.163?format=json')
                //content.push(`${res.data.data.content} \n-- 来自@${res.data.data.nickname}「${res.data.data.name}」${res.data.data.artistsname}\n`)
            }

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

            //累计恋爱天数
            if(loveContent != undefined) {
                content.push(loveContent);
            }

            //证件有效期
            content.push(`\n💳证件有效期 \n`);
            if (todayLicenseArr.length > 0) {
                todayLicenseArr.sort((a, b) => calendar.getTextLength(a) - calendar.getTextLength(b));
                content = content.concat(todayLicenseArr);
            }
            if(endLicenseArr.length > 0) {
                endLicenseArr.sort((a, b) => calendar.getTextLength(a) - calendar.getTextLength(b));
                content = content.concat(endLicenseArr);
            }

            console.log('获取重要节日成功\n', content.join('\n'));
            resolve(content.join('\n'))
        } catch (error) {
            reject(error.message || error)
        }
    })

}
