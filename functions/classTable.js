const { classTable } = require('./input')

//计算今天到下次节日时间的时间差，参数格式为 YYYY-MM-DD
const diffTimeToDaily = (nowTime, targetTime) => {
    let diff = (new Date(nowTime.replace(/-/g, '/'))).getTime() - (new Date(targetTime.replace(/-/g, '/'))).getTime()//日期的差值，有正负
    const absTime = Math.abs(diff) //日期差的绝对值
    let formatTimeDiff = parseInt(absTime / (3600 * 1000 * 24))
    return formatTimeDiff
}

//处理函数
const classFunction = {
    //把课程转为字符串
    classToString: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let date = new Date()
                let nowDate = `${date.getFullYear()}-${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}-${(date.getDate()) < 10 ? '0' + (date.getDate()) : (date.getDate())}`
                let computerClassContent = []
                let computerExamContent = []
                let computerHomeworkContent = []
                let computerClassArr = []
                let computerExamArr = []

                //22春计算机本-课程列表
                const computerList = classTable.computer
                if(computerList.length > 0){
                    for (let i = 0; i < computerList.length; i++) {
                        const element = computerList[i]
                        let eleName = element.name;
                        let eleTeacher = element.teacher;
                        const classList = element.classList;
                        let tempClassName = '';
                        let tempClassTime = 0;
                        //课程处理
                        for (let j = 0; j < classList.length; j++) {
                            const item = classList[j]
                            let classType = (item.type) == 1 ? '钉钉直播': '线下教室';
                            let classDate = item.date;
                            let classTime = item.time;
                            if (nowDate == classDate){
                                computerClassContent.push(`· 课程名称: ${eleName}`)
                                computerClassContent.push(`· 课程时间: ${classTime}`)
                                computerClassContent.push(`· 教学课时: 第${j+1}节课`)
                                computerClassContent.push(`· 教学方式: ${classType}`)
                                computerClassContent.push(`· 辅导老师: ${eleTeacher}\n`)
                            }else if (new Date(classDate) >  new Date(nowDate)) {
                                let diffTime = diffTimeToDaily(nowDate, classDate);
                                if (tempClassTime == 0) {
                                    tempClassName = eleName;
                                    tempClassTime = diffTime;
                                } else {
                                    if (diffTime < tempClassTime) {
                                        tempClassName = eleName;
                                        tempClassTime = diffTime;
                                    }
                                }
                            }
                        }

                        if (tempClassName != ''&& tempClassTime != 0){
                            computerClassArr.push(`· ${tempClassName}: 还有${tempClassTime}天`)
                        }

                        //作业交付截止时间
                        let eleHomework = element.homework;
                        if ( eleHomework != 0){
                            let diffTime = diffTimeToDaily(nowDate, eleHomework);
                            if (diffTime == 1){
                                computerHomeworkContent.push(`· ${eleName}: 明日作业交付截止`)
                            }else if (new Date(eleHomework) >  new Date(nowDate)) {
                                computerHomeworkContent.push(`· ${eleName}: 还有${diffTime}天`)
                            }
                        }


                        //考试处理
                        let eleExam = element.exam;
                        if (eleExam != 0){
                            let tempExamName = '';
                            let tempExamTime = 0;
                            let examType = (eleExam.type) == 1 ? '纸质闭卷': '上机闭卷';
                            let examDate = eleExam.date;
                            let examTime = eleExam.time;
                            let examPlace = eleExam.place;
                            if (nowDate == examDate){
                                computerExamContent.push(`· 考试课程: ${eleName}`)
                                computerExamContent.push(`· 考试方式: ${examType}`)
                                computerExamContent.push(`· 考试时间: ${examTime}`)
                                computerExamContent.push(`· 考试地点: ${examPlace}\n`)
                            }else if (new Date(examDate) >  new Date(nowDate)) {
                                let diffTime = diffTimeToDaily(nowDate, examDate);
                                if (tempExamTime == 0) {
                                    tempExamName = eleName;
                                    tempExamTime = diffTime;
                                } else {
                                    if (diffTime < tempExamTime) {
                                        tempExamName = eleName;
                                        tempExamTime = diffTime;
                                    }
                                }
                            }
                            computerExamArr.push(`· ${tempExamName}: 还有${tempExamTime}天`)
                        }

                    }

                }

                //22春行政专-课程列表
                let hrClassContent = []
                let hrClassArr = []
                let hrExamContent = []
                let hrExamArr = []
                let hrHomeworkContent = []

                const hrList = classTable.hr
                if(hrList.length > 0){
                    for (let i = 0; i < hrList.length; i++) {
                        const element = hrList[i]
                        let eleName = element.name;
                        let eleTeacher = element.teacher;
                        const classList = element.classList;
                        let tempClassName = '';
                        let tempClassTime = 0;
                        //课程处理
                        for (let j = 0; j < classList.length; j++) {
                            const item = classList[j]
                            let classType = (item.type) == 1 ? '钉钉直播': '线下教室';
                            let classDate = item.date;
                            let classTime = item.time;
                            if (nowDate == classDate){
                                hrClassContent.push(`· 课程名称: ${eleName}`)
                                hrClassContent.push(`· 课程时间: ${classTime}`)
                                hrClassContent.push(`· 教学课时: 第${j+1}节课`)
                                hrClassContent.push(`· 教学方式: ${classType}`)
                                hrClassContent.push(`· 辅导老师: ${eleTeacher}\n`)
                            }else if (new Date(classDate) >  new Date(nowDate)) {
                                let diffTime = diffTimeToDaily(nowDate, classDate);
                                if (tempClassTime == 0) {
                                    tempClassName = eleName;
                                    tempClassTime = diffTime;
                                } else {
                                    if (diffTime < tempClassTime) {
                                        tempClassName = eleName;
                                        tempClassTime = diffTime;
                                    }
                                }
                            }
                        }

                        if (tempClassName != ''&& tempClassTime != 0){
                            hrClassArr.push(`· ${tempClassName}: 还有${tempClassTime}天`)
                        }

                        //作业交付截止时间
                        let eleHomework = element.homework;
                        if ( eleHomework != 0){
                            let diffTime = diffTimeToDaily(nowDate, eleHomework);
                            if (diffTime == 1){
                                hrHomeworkContent.push(`· ${eleName}: 明日作业交付截止`)
                            }else if (new Date(eleHomework) >  new Date(nowDate)) {
                                hrHomeworkContent.push(`· ${eleName}: 还有${diffTime}天`)
                            }
                        }


                        //考试处理
                        let eleExam = element.exam;
                        if (eleExam != 0){
                            let tempExamName = '';
                            let tempExamTime = 0;
                            let examType = (eleExam.type) == 1 ? '纸质闭卷': '上机闭卷';
                            let examDate = eleExam.date;
                            let examTime = eleExam.time;
                            let examPlace = eleExam.place;
                            if (nowDate == examDate){
                                hrExamContent.push(`· 考试课程: ${eleName}`)
                                hrExamContent.push(`· 考试方式: ${examType}`)
                                hrExamContent.push(`· 考试时间: ${examTime}`)
                                hrExamContent.push(`· 考试地点: ${examPlace}\n`)
                            }else if (new Date(examDate) >  new Date(nowDate)) {
                                let diffTime = diffTimeToDaily(nowDate, examDate);
                                if (tempExamTime == 0) {
                                    tempExamName = eleName;
                                    tempExamTime = diffTime;
                                } else {
                                    if (diffTime < tempExamTime) {
                                        tempExamName = eleName;
                                        tempExamTime = diffTime;
                                    }
                                }
                            }
                            hrExamArr.push(`· ${tempExamName}: 还有${tempExamTime}天`)
                        }

                    }

                }

                let content = []

                //‍结果组装
                if (computerClassContent.length > 0||hrClassContent.length > 0) {
                    content.push(`🗣今日网课`)
                    if (computerClassContent.length > 0) {
                        content.push(`\n📕‍22春计算机本 \n${computerClassContent.join('\n')}`)
                    }
                    if (hrClassContent.length > 0) {
                        content.push(`\n📕22春行政专 \n${hrClassContent.join('\n')}`)
                    }
                }else if (computerClassArr.length > 0 || hrClassArr.length > 0) {
                    content.push(`📚网课提醒`)
                    if (computerClassArr.length > 0) {
                        content.push(`\n📗‍22春计算机本 \n${computerClassArr.join('\n')}`)
                    }
                    if (hrClassArr.length > 0) {
                        content.push(`\n📗22春行政专 \n${hrClassArr.join('\n')}`)
                    }
                }

                if (computerHomeworkContent.length > 0||hrHomeworkContent.length > 0) {
                    content.push(`\n📝作业提醒`)
                    if (computerHomeworkContent.length > 0) {
                        content.push(`\n📔‍22春计算机本 \n${computerHomeworkContent.join('\n')}`)
                    }
                    if (hrHomeworkContent.length > 0) {
                        content.push(`\n📔22春行政专 \n${hrHomeworkContent.join('\n')}`)
                    }
                }

                if (computerExamContent.length > 0||hrExamContent.length > 0) {
                    content.push(`💯今日考试`)
                    if (computerExamContent.length > 0) {
                        content.push(`\n📙‍22春计算机本 \n${computerExamContent.join('\n')}`)
                    }
                    if (hrExamContent.length > 0) {
                        content.push(`\n📙22春行政专 \n${hrExamContent.join('\n')}`)
                    }
                }else if (computerExamArr.length > 0 || hrExamArr.length > 0) {
                    content.push(`\n💯考试提醒`)
                    if (computerExamArr.length > 0) {
                        content.push(`\n📒‍22春计算机本 \n${computerExamArr.join('\n')}`)
                    }
                    if (hrExamArr.length > 0) {
                        content.push(`\n📒22春行政专 \n${hrExamArr.join('\n')}`)
                    }
                }

                console.log('获取课表成功', content.join('\n'));
                resolve(content.join('\n'))
            } catch (error) {
                reject(error.message || error)
            }
        })
    }
}

module.exports = handleClass = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await classFunction.classToString()
            resolve(res)
        } catch (error) {
            reject(error.message || error)
        }
    })
}
