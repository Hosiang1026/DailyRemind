# -*- coding: UTF-8 -*-
# Version: v1.1
# Created by lstcml on 2022/05/08
# Crontab：8 8 * * *

import os
import re
import sys
import requests
import datetime
from bs4 import BeautifulSoup

'''
v1.1更新记录：
1、新增脚本自动更新
'''

# 更新检测
def checkUpdate():
    print("当前运行的脚本版本：" + str(version))
    try:
        r1 = requests.get("https://gitee.com/hosiang1026/DailyRemind/raw/master/ql_cctv_news_task.py").text
        r2 = re.findall(re.compile("version = \d.\d"), r1)[0].split("=")[1].strip()
        if float(r2) > version:
            print("发现新版本：" + r2)
            print("正在自动更新脚本...")
            os.system("ql raw https://gitee.com/hosiang1026/DailyRemind/raw/master/ql_cctv_news_task.py &")
    except:
        pass

# 获取新闻联播
def getNew():
    try:
        url = []
        title = ""
        desc = []
        _content = ""
        bdurl = "http://mrxwlb.com"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62'}

        r = requests.get(bdurl)
        r.encoding = r.apparent_encoding
        soup = BeautifulSoup(r.text, 'html.parser')
        _content = soup.find_all(class_="entry-content")[1].p.get_text().strip();
        for i in soup.find_all(class_="entry-content")[1].ul:
            desc.append(i.get_text().strip())
        num = 1
        for i in range(1, len(desc), 2):
            _content = _content + "\n" +str(num)+'.'+ desc[i]
            num = num+1
        return _content
    except Exception as e:
        return e

# 推送
def load_send():
    global send
    cur_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(cur_path)
    sendNotifPath = cur_path + "/sendNotify.py"
    if not os.path.exists(sendNotifPath):
        res = requests.get("https://gitee.com/lstcml/qinglongscripts/raw/master/sendNotify.py")
        with open(sendNotifPath, "wb") as f:
            f.write(res.content)

    try:
        from sendNotify import send
        return True
    except:
        print("加载通知服务失败！")
        return False


if __name__ == '__main__':
    version = 1.1
    title = '新闻联播'
    checkUpdate()
    if load_send():
        content = getNew()
        if content != '':
            print('获取新闻联播成功！')
            send("新闻联播", content)
        else:
            print('获取新闻联播失败！')