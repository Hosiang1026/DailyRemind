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
                //网课提醒
                let computerClassArr = []
                let homeworkArr = []
                let hrExamContent = []
                let computerExamContent = []
                let tempExamContent = []
                let hrTempExamContent = []

                const homeworkDate = classTable.homework;

                //22春计算机本-课程列表
                const computerList = classTable.computer;
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
                            let classDate = item.date;
                            let classTime = item.time;
                            let place = item.place;
                            if (nowDate == classDate){
                                computerClassContent.push(`· 课程名称: ${eleName}`)
                                computerClassContent.push(`· 辅导老师: ${eleTeacher}`)
                                computerClassContent.push(`· 教学课时: 第${j+1}节课`)
                                if (item.type == 1){
                                    computerClassContent.push(`· 教学方式: 钉钉直播`)
                                    computerClassContent.push(`· 课程时间: ${classTime}\n`)
                                }
                                if (item.type == 2){
                                    computerClassContent.push(`· 教学方式: 线下教室`)
                                    computerClassContent.push(`· 课程时间: ${classTime}`)
                                    computerClassContent.push(`· 上课地点: ${place}\n`)
                                }
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

                        //考试处理
                        let eleExam = element.exam;
                        if (eleExam != 0) {
                            let examType = (eleExam.type) == 1 ? '纸质闭卷' : '上机闭卷';
                            let examDate = eleExam.date;
                            let examTime = eleExam.time;
                            let examPlace = eleExam.place;
                            if (nowDate == examDate) {
                                computerExamContent.push(`· 考试课程: ${eleName}`)
                                computerExamContent.push(`· 考试方式: ${examType}`)
                                computerExamContent.push(`· 考试时间: ${examTime}`)
                                computerExamContent.push(`· 考试地点: ${examPlace}\n`)
                            } else if (new Date(examDate) > new Date(nowDate)) {
                                let diffTime = diffTimeToDaily(nowDate, examDate);
                                if (diffTime == 1) {
                                    tempExamContent.push(`· ${eleName}: 明日考试`)
                                } else if (diffTime > 1) {
                                    tempExamContent.push(`· ${eleName}: 还有${diffTime}天`)
                                }
                            }
                          }
                        }
                }

                //22春行政专-课程列表
                let hrClassContent = []
                let hrClassArr = []
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
                            let classDate = item.date;
                            let classTime = item.time;
                            let place = item.place;
                            if (nowDate == classDate){
                                hrClassContent.push(`· 课程名称: ${eleName}`)
                                hrClassContent.push(`· 辅导老师: ${eleTeacher}`)
                                hrClassContent.push(`· 教学课时: 第${j+1}节课`)
                                if (item.type == 1){
                                    hrClassContent.push(`· 教学方式: 钉钉直播`)
                                    hrClassContent.push(`· 课程时间: ${classTime}\n`)
                                }

                                if (item.type == 2){
                                    hrClassContent.push(`· 教学方式: 线下教室`)
                                    hrClassContent.push(`· 课程时间: ${classTime}`)
                                    hrClassContent.push(`· 上课地点: ${place}\n`)
                                }
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

                        //考试处理
                        let eleExam = element.exam;
                        if (eleExam != 0){
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
                                if (diffTime == 1) {
                                    hrTempExamContent.push(`· ${eleName}: 明日考试`)
                                } else if (diffTime > 1) {
                                    hrTempExamContent.push(`· ${eleName}: 还有${diffTime}天`)
                                }
                            }
                        }

                    }
                }

                //作业交付截止时间
                if (homeworkDate != 0) {
                    if (new Date(homeworkDate) > new Date(nowDate)) {
                        let diffTime = diffTimeToDaily(nowDate, homeworkDate);
                        if (diffTime == 1) {
                            homeworkArr.push(`明日作业交付截止`)
                        } else if (diffTime > 1) {
                            homeworkArr.push(`还有${diffTime}天`)
                        }
                    }
                }

                let content = []

                //‍结果组装
                if (computerClassContent.length > 0||hrClassContent.length > 0) {
                    content.push(`🗣今日网课`)
                    if (computerClassContent.length > 0) {
                        content.push(`\n📘‍22春计算机本 \n${computerClassContent.join('\n')}`)
                    }
                    if (hrClassContent.length > 0) {
                        content.push(`\n📘22春行政专 \n${hrClassContent.join('\n')}`)
                    }
                }else if (computerClassArr.length > 0 || hrClassArr.length > 0) {
                    content.push(`📚网课提醒`)
                    if (computerClassArr.length > 0) {
                        content.push(`\n📒‍22春计算机本`)
                        if (computerClassArr.length > 0) {
                            content.push(`${computerClassArr.join('\n')}`)
                        }
                    }

                    if (hrClassArr.length > 0) {
                        content.push(`\n📒22春行政专`)
                        if (hrClassArr.length > 0) {
                            content.push(`${hrClassArr.join('\n')}`)
                        }
                    }
                }

                if (computerExamContent.length > 0||hrExamContent.length > 0) {
                    content.push(`\n💯今日考试`)
                    if (computerExamContent.length > 0) {
                        content.push(`\n📕‍22春计算机本 \n${computerExamContent.join('\n')}`)
                    }
                    if (hrExamContent.length > 0) {
                        content.push(`\n📕22春行政专 \n${hrExamContent.join('\n')}`)
                    }
                }

                if (tempExamContent.length > 0||hrTempExamContent.length > 0) {
                    content.push(`\n⏰考试倒计时`)
                    if (tempExamContent.length > 0) {
                        content.push(`\n📙‍22春计算机本 \n${tempExamContent.join('\n')}`)
                    }
                    if (hrTempExamContent.length > 0) {
                        content.push(`\n📙22春行政专 \n${hrTempExamContent.join('\n')}`)
                    }
                }
                if (homeworkArr.length > 0) {
                    content.push(`\n📝形考倒计时: ${homeworkArr.join('\n')}`)
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
