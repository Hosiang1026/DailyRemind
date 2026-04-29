# -*- coding: utf-8 -*-
# 源自 https://github.com/Cp0204/ChinaTelecomMonitor ，已适配 DailyRemind 多账号

import os
import re
import sys
import json
import calendar
import datetime
import urllib.request

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPT_DIR not in sys.path:
    sys.path.insert(0, _SCRIPT_DIR)

try:
    from telecom_class import Telecom
except ImportError:
    print("正在尝试自动安装依赖...")
    os.system("pip3 install pycryptodome requests certifi urllib3 &> /dev/null")
    from telecom_class import Telecom

_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", ".."))
_STATE_PATH = os.path.join(_ROOT, "db", "telecom_state.json")
TELECOM_FLUX_PACKAGE = os.environ.get("TELECOM_FLUX_PACKAGE", "true").lower() != "false"
TELECOM_ONLY_WARN = os.environ.get("TELECOM_ONLY_WARN", "false").lower() == "true"


def _load_state():
    if not os.path.exists(_STATE_PATH):
        return {}
    try:
        with open(_STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_state(state):
    os.makedirs(os.path.dirname(_STATE_PATH), exist_ok=True)
    with open(_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def _parse_accounts():
    out = []
    raw = os.environ.get("TELECOM_USERS", "").strip()
    if raw:
        for part in re.split(r"[;&\n]+", raw):
            part = part.strip()
            if len(part) >= 11 and part[:11].isdigit():
                out.append((part[:11], part[11:]))
        return out
    single = os.environ.get("TELECOM_USER", "").strip()
    if single and len(single) >= 11 and single[:11].isdigit():
        return [(single[:11], single[11:])]
    return []


def _config_json_path():
    if len(sys.argv) > 1 and (sys.argv[1] or "").strip():
        return (sys.argv[1] or "").strip()
    p = (os.environ.get("TELECOM_CONFIG_JSON") or "").strip()
    if not p:
        return ""
    if os.path.isabs(p):
        return p
    return os.path.join(_ROOT, p)


def _load_bills_and_push(path):
    if not path or not os.path.isfile(path):
        return None, {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            j = json.load(f)
    except Exception:
        return None, {}
    push_extra = j["push_config"] if isinstance(j.get("push_config"), dict) and j.get("push_config") else None
    if isinstance(j.get("bills"), dict):
        bills_root = j["bills"]
    else:
        bills_root = {}
        for k, v in j.items():
            if k == "push_config":
                continue
            if isinstance(k, str) and len(k) == 11 and k.isdigit() and isinstance(v, dict):
                bills_root[k] = v
    out = {}
    for phone, months in bills_root.items():
        if not isinstance(phone, str) or len(phone) != 11 or not phone.isdigit():
            continue
        if isinstance(months, dict):
            out[phone] = {str(ym): str(amt) for ym, amt in months.items()}
    return push_extra, out


def _publish_mqtt(body):
    host = (os.environ.get("mqtt_host") or "").strip()
    port_s = (os.environ.get("mqtt_port") or "").strip()
    if not host or not port_s:
        return
    try:
        port = int(port_s)
    except ValueError:
        return
    user = (os.environ.get("mqtt_username") or "").strip()
    pwd = (os.environ.get("mqtt_password") or "").strip()
    topic = (os.environ.get("mqtt_topic_telecom") or "qinglong/telecom").strip() or "qinglong/telecom"
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = json.dumps(
        {"content": "📱电信套餐\n\n" + body, "timestamp": ts},
        ensure_ascii=False,
    )
    try:
        import paho.mqtt.publish as mqtt_publish

        auth = {"username": user, "password": pwd} if user else None
        mqtt_publish.single(
            topic,
            payload,
            hostname=host,
            port=port,
            auth=auth,
            qos=0,
            retain=True,
        )
        print("mqtt:Published", topic)
    except Exception as ex:
        print("mqtt:", ex)


def _env_bool_true(name):
    v = os.environ.get(name)
    if v is None:
        return False
    return str(v).strip().lower() in ("true", "1")


def _default_notify_author():
    try:
        pkg_path = os.path.join(_ROOT, "package.json")
        with open(pkg_path, "r", encoding="utf-8") as f:
            pkg = json.load(f)
        repo = pkg.get("repository") or {}
        u = str(repo.get("url") or "")
        u = re.sub(r"^git\+", "", u)
        u = re.sub(r"\.git\s*$", "", u, flags=re.I).strip()
        if u:
            return "\n\n本通知 By " + u
    except Exception:
        pass
    return "\n\n本通知 By DailyRemind"


def _append_task_notify_footer(body):
    text = (body or "").strip()
    if _env_bool_true("SENTENCE_OPEN"):
        try:
            req = urllib.request.Request(
                "https://api.shadiao.pro/chp",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                j = json.loads(resp.read().decode("utf-8"))
            chp = (j.get("data") or {}).get("text")
            if chp:
                text = text + "\n\n💘" + str(chp)
        except Exception:
            pass
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if _env_bool_true("END_OPEN"):
        c = (os.environ.get("END_CONTENT") or "").strip()
        tp = str(os.environ.get("END_TIME") or "通知时间: ")
        tail = ""
        if c:
            tail += "\n\n" + c
        tail += "\n" + tp + now
        return text + tail
    if os.environ.get("NOTIFY_AUTHOR_BLANK"):
        return text
    author = os.environ.get("NOTIFY_AUTHOR")
    if author is None or not str(author).strip():
        author = _default_notify_author()
    else:
        author = str(author).strip()
        if "本通知 By" not in author:
            author = "\n\n本通知 By " + author
    if not author:
        return text
    return text + author + "\n通知时间: " + now


def send_notify(title, body, push_config_extra=None):
    try:
        import notify

        if push_config_extra:
            notify.push_config.update(push_config_extra)
            notify.push_config["CONSOLE"] = notify.push_config.get("CONSOLE", True)
        notify.send(title, _append_task_notify_footer(body))
    except Exception:
        print("发送通知消息失败！")


def usage_status_icon(used, total):
    if total <= 0:
        return "⚫"
    if used >= total:
        return "🔴"
    today = datetime.date.today()
    _, days_in_month = calendar.monthrange(today.year, today.month)
    time_progress = today.day / days_in_month
    usage_progress = used / total
    if usage_progress > time_progress * 1.5:
        return "🟠"
    if usage_progress > time_progress:
        return "🟡"
    return "🟢"


def _append_bills_lines(notify_str, phonenum, bills_by_phone):
    months = bills_by_phone.get(phonenum) or {}
    if not months:
        return notify_str
    lines = sorted(months.items(), key=lambda x: x[0], reverse=True)
    notify_str += "\n\n【话费记录】" + "".join(f"\n  {ym}  {amt}" for ym, amt in lines)
    return notify_str


def run_one_account(telecom, phonenum, password, slice_data, push_config_extra, bills_by_phone):
    notifys = []
    CONFIG_DATA = {
        "user": {"phonenum": phonenum, "password": password},
        "login_info": slice_data.get("login_info") or {},
        "loginFailTime": int(slice_data.get("loginFailTime") or 0),
    }
    if push_config_extra:
        CONFIG_DATA["push_config"] = push_config_extra

    def add_notify(text):
        notifys.append(text)
        print("📢", text)
        return text

    def auto_login():
        if not phonenum.isdigit():
            add_notify("自动登录：手机号设置错误，跳过")
            return False
        print(f"自动登录：{phonenum}")
        login_fail_time = CONFIG_DATA.get("loginFailTime", 0)
        if login_fail_time >= 5:
            print(
                f"自动登录：已连续失败{login_fail_time}次，为避免风控不再执行；修正后删除 db/telecom_state.json 中该号码的 loginFailTime"
            )
            return False
        data = telecom.do_login(phonenum, password)
        if data.get("responseData", {}).get("resultCode") == "0000":
            print("自动登录：成功")
            login_info = data["responseData"]["data"]["loginSuccessResult"]
            login_info["phonenum"] = phonenum
            login_info["createTime"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            CONFIG_DATA["login_info"] = login_info
            CONFIG_DATA["loginFailTime"] = 0
            telecom.set_login_info(login_info)
            slice_data["login_info"] = login_info
            slice_data["loginFailTime"] = 0
            return True
        login_fail_time = int(
            data.get("responseData", {})
            .get("data", {})
            .get("loginFailResult", {})
            .get("loginFailTime", login_fail_time + 1)
        )
        CONFIG_DATA["loginFailTime"] = login_fail_time
        slice_data["loginFailTime"] = login_fail_time
        add_notify(f"自动登录：已连续失败{login_fail_time}次")
        print(data)
        return False

    login_info = CONFIG_DATA.get("login_info") or {}
    if login_info.get("phonenum") == phonenum:
        print(f"尝试使用缓存登录：{phonenum}")
        telecom.set_login_info(login_info)
    else:
        if not auto_login():
            return notifys, "🟢"

    important_data = telecom.qry_important_data()
    if important_data.get("responseData"):
        print("获取主要信息：成功")
    elif important_data.get("headerInfos", {}).get("code") == "X201":
        print(f"获取主要信息：失败 {important_data.get('headerInfos', {}).get('reason', '')}")
        if auto_login():
            important_data = telecom.qry_important_data()

    rd = (important_data or {}).get("responseData") or {}
    if not rd.get("data"):
        add_notify(f"获取主要信息失败: {phonenum} {json.dumps(important_data, ensure_ascii=False)[:500]}")
        return notifys, "🟢"

    try:
        summary = telecom.to_summary(rd["data"])
    except Exception as e:
        add_notify(f"简化主要信息出错: {e}")
        return notifys, "🟢"

    if summary:
        print(f"简化主要信息：{summary}")
        CONFIG_DATA["summary"] = summary

    flux_package_str = ""
    if TELECOM_FLUX_PACKAGE:
        user_flux_package = telecom.user_flux_package()
        if user_flux_package and user_flux_package.get("responseData"):
            print("获取流量包明细：成功")
            packages = user_flux_package["responseData"]["data"]["productOFFRatable"]["ratableResourcePackages"]
            for package in packages:
                package_icon = (
                    "🇨🇳"
                    if "国内" in package["title"]
                    else "📺" if "专用" in package["title"] else "🌎"
                )
                flux_package_str += f"\n{package_icon}{package['title']}\n"
                for product in package["productInfos"]:
                    if product.get("infiniteTitle"):
                        flux_package_str += f"""🔹[{product['title']}]{product['infiniteTitle']}{product['infiniteValue']}{product['infiniteUnit']}/无限\n"""
                    else:
                        flux_package_str += f"""🔹[{product['title']}]{product['leftTitle']}{product['leftHighlight']}{product['rightCommon']}\n"""

    common_str = (
        f"{telecom.convert_flow(summary['commonUse'],'GB',2)} / {telecom.convert_flow(summary['commonTotal'],'GB',2)} GB"
        if summary["flowOver"] == 0
        else f"-{telecom.convert_flow(summary['flowOver'],'GB',2)} / {telecom.convert_flow(summary['commonTotal'],'GB',2)} GB"
    )
    status_icon = usage_status_icon(summary["commonUse"], summary["commonTotal"])
    common_str = f"{common_str} {status_icon}"
    special_str = (
        f"{telecom.convert_flow(summary['specialUse'], 'GB', 2)} / {telecom.convert_flow(summary['specialTotal'], 'GB', 2)} GB"
        if summary["specialTotal"] > 0
        else ""
    )

    notify_str = f"""
📱 手机：{summary['phonenum']}
💰 余额：{round(summary['balance']/100,2)}
📞 通话：{summary['voiceUsage']}{f" / {summary['voiceTotal']}" if summary['voiceTotal']>0 else ''} min
🌐 总流量
  - 通用：{common_str}{f'{chr(10)}  - 专用：{special_str}' if special_str else ''}"""

    if TELECOM_FLUX_PACKAGE and flux_package_str.strip():
        notify_str += f"\n\n【流量包明细】\n\n{flux_package_str.strip()}"

    notify_str += f"\n\n查询时间：{summary['createTime']}"
    notify_str = _append_bills_lines(notify_str, phonenum, bills_by_phone)
    add_notify(notify_str.strip())
    slice_data["login_info"] = CONFIG_DATA.get("login_info", slice_data.get("login_info", {}))
    slice_data["loginFailTime"] = CONFIG_DATA.get("loginFailTime", 0)
    return notifys, status_icon


def main():
    print(f"===============程序开始===============")
    print(f"⏰ 执行时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    accounts = _parse_accounts()
    json_path = _config_json_path()
    if not accounts:
        exit("未配置账号：请设置 TELECOM_USER 或 TELECOM_USERS（11位手机号+密码）。TELECOM_CONFIG_JSON 仅用于话费记录与 push_config，不含账号密码")

    state = _load_state()
    push_extra, bills_by_phone = _load_bills_and_push(json_path)

    all_blocks = []
    worst_icon = "🟢"
    for phonenum, password in accounts:
        telecom = Telecom()
        slice_data = state.setdefault(phonenum, {})
        try:
            part, icon = run_one_account(telecom, phonenum, password, slice_data, push_extra, bills_by_phone)
            all_blocks.extend(part)
            if icon in ("🔴", "🟠"):
                worst_icon = icon
            elif icon == "🟡" and worst_icon == "🟢":
                worst_icon = icon
        except Exception as ex:
            print(phonenum, ex)
            all_blocks.append(f"📱 {phonenum} 查询异常: {ex}")
        _save_state(state)

    if all_blocks:
        print(f"===============推送通知===============")
        body = "\n\n────────────\n\n".join(all_blocks)
        if TELECOM_ONLY_WARN and worst_icon == "🟢":
            print("流量使用在均匀范围内，跳过通知")
        else:
            send_notify("【电信套餐用量监控】", body, push_extra)
        _publish_mqtt(body)
    print(f"===============程序结束===============")


if __name__ == "__main__":
    main()
