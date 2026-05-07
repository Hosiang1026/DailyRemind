# -*- coding: utf-8 -*-
# 源自 https://github.com/Cp0204/ChinaTelecomMonitor ，已适配 DailyRemind 多账号

import os
import re
import sys
import json
from collections import defaultdict
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


def _publish_mqtt(body, by_phone=None):
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
    by_phone = by_phone if isinstance(by_phone, dict) else {}
    full = (body or "").strip()
    if len(by_phone) > 1:
        msg = {"timestamp": ts}
        for p, t in by_phone.items():
            if isinstance(p, str) and len(p) == 11 and p.isdigit() and (t or "").strip():
                msg[p] = str(t).strip()
    else:
        msg = {"timestamp": ts, "content": full}
    payload = json.dumps(msg, ensure_ascii=False)
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


def _telecom_strip_non_wechat(pc):
    pc.update(
        {
            "BARK_PUSH": "",
            "FSKEY": "",
            "GOBOT_URL": "",
            "GOBOT_QQ": "",
            "GOBOT_TOKEN": "",
            "GOTIFY_URL": "",
            "GOTIFY_TOKEN": "",
            "IGOT_PUSH_KEY": "",
            "DEER_KEY": "",
            "DEER_URL": "",
            "CHAT_URL": "",
            "CHAT_TOKEN": "",
            "QMSG_KEY": "",
            "QMSG_TYPE": "",
            "TG_BOT_TOKEN": "",
            "TG_USER_ID": "",
            "TG_API_HOST": "",
            "TG_PROXY_AUTH": "",
            "TG_PROXY_HOST": "",
            "TG_PROXY_PORT": "",
            "AIBOTK_KEY": "",
            "AIBOTK_TYPE": "",
            "AIBOTK_NAME": "",
            "SMTP_SERVER": "",
            "SMTP_SSL": "false",
            "SMTP_EMAIL": "",
            "SMTP_PASSWORD": "",
            "SMTP_NAME": "",
            "SMTP_EMAIL_TO": "",
            "SMTP_NAME_TO": "",
            "PUSHME_KEY": "",
            "PUSHME_URL": "",
            "CHRONOCAT_QQ": "",
            "CHRONOCAT_TOKEN": "",
            "CHRONOCAT_URL": "",
            "DODO_BOTTOKEN": "",
            "DODO_BOTID": "",
            "DODO_LANDSOURCEID": "",
            "DODO_SOURCEID": "",
            "WEBHOOK_URL": "",
            "WEBHOOK_BODY": "",
            "WEBHOOK_HEADERS": "",
            "WEBHOOK_METHOD": "",
            "WEBHOOK_CONTENT_TYPE": "",
            "NTFY_URL": "",
            "NTFY_TOPIC": "",
            "NTFY_PRIORITY": "3",
        }
    )


def send_notify(title, body, push_config_extra=None, only_wechat=False, skip_footer=False):
    try:
        import notify

        saved = dict(notify.push_config)
        try:
            if push_config_extra:
                notify.push_config.update(push_config_extra)
                notify.push_config["CONSOLE"] = notify.push_config.get("CONSOLE", True)
            notify.push_config["DD_BOT_TOKEN"] = ""
            notify.push_config["DD_BOT_SECRET"] = ""
            if only_wechat:
                _telecom_strip_non_wechat(notify.push_config)
            out = body if skip_footer else _append_task_notify_footer(body)
            notify.send(title, out)
        finally:
            notify.push_config.clear()
            notify.push_config.update(saved)
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


def _short_flux_title(title):
    if not title or "-" not in title:
        return title or ""
    a, b = title.split("-", 1)
    if b.startswith(a):
        rest = b[len(a) :].lstrip("-")
        return f"{a}·{rest}" if rest else a
    return title


def _flux_usage_suffix(telecom, product):
    if product.get("infiniteTitle"):
        return ""
    raw = f"{product.get('leftTitle') or ''}{product.get('leftHighlight') or ''}{product.get('rightCommon') or ''}"
    mu = re.search(r"已用\s*(\d+(?:\.\d+)?)\s*([KMGT]B)", raw, re.I)
    mt = re.search(r"共\s*(\d+(?:\.\d+)?)\s*([KMGT]B)", raw, re.I)
    if not mu or not mt:
        return ""
    u_s = f"{float(mu.group(1)):.10g}{mu.group(2).upper()}"
    t_s = f"{float(mt.group(1)):.10g}{mt.group(2).upper()}"
    try:
        used_kb = int(telecom.convert_flow(u_s, "KB", 0))
        tot_kb = int(telecom.convert_flow(t_s, "KB", 0))
    except (TypeError, ValueError, ZeroDivisionError):
        return ""
    if tot_kb <= 0:
        return ""
    rem_kb = max(0, tot_kb - used_kb)
    rem_gb = telecom.convert_flow(rem_kb, "GB", 2)
    pct = (used_kb / tot_kb) * 100.0
    return f"  └ 剩余 {rem_gb} GB · 用量占比 {pct:.1f}%"


def _fee_lines_from_important_balance(data):
    if not isinstance(data, dict):
        return []
    bi = data.get("balanceInfo") or {}
    out = []
    pbr = bi.get("phoneBillRegion")
    if isinstance(pbr, dict):
        title = (pbr.get("title") or "").strip()
        sub = (pbr.get("subTitle") or "").strip()
        hh = (pbr.get("subTitleHh") or "").strip()
        row = " ".join(x for x in (sub, hh) if x) or " ".join(x for x in (title, sub, hh) if x)
        if row.strip():
            out.append(f"  统计：{row.strip()}")
    bar_rows = []
    for bar in bi.get("phoneBillBars") or []:
        if not isinstance(bar, dict):
            continue
        t = (bar.get("title") or "").strip()
        st = (bar.get("subTilte") or bar.get("subTitle") or "").strip()
        br = (bar.get("barRightSubTitle") or "").strip()
        row = " ".join(x for x in (t, st, br) if x)
        if row:
            bar_rows.append(f"    · {row}")
    if bar_rows:
        out.append("  明细：")
        out.extend(bar_rows)
    return out


def _bill_month_label(ym):
    s = str(ym).strip()
    if len(s) == 6 and s.isdigit():
        return f"{int(s[:4])}年{int(s[4:6]):02d}月"
    m = re.match(r"^(\d{4})-(\d{1,2})$", s)
    if m:
        return f"{int(m.group(1))}年{int(m.group(2)):02d}月"
    return s


def _bill_amount_with_unit(amt):
    a = str(amt).strip()
    if not a:
        return a
    if a.endswith("元"):
        return a
    return a + "元"


def _append_fee_records(notify_str, important_data, phonenum, bills_by_phone):
    api_lines = _fee_lines_from_important_balance(important_data)
    months = (bills_by_phone or {}).get(phonenum) or {}
    json_pairs = sorted(months.items(), key=lambda x: x[0], reverse=True)
    json_lines = []
    if json_pairs:
        json_lines.append("  各月记录：")
        for ym, amt in json_pairs:
            json_lines.append(
                f"    · {_bill_month_label(ym)}  {_bill_amount_with_unit(amt)}"
            )
    lines = api_lines + json_lines
    if not lines:
        return notify_str
    return notify_str + "\n\n【话费记录】\n" + "\n".join(lines)


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
                for product in package["productInfos"]:
                    ptitle = _short_flux_title(product.get("title") or "")
                    if product.get("infiniteTitle"):
                        flux_package_str += f"""🔹[{ptitle}]{product['infiniteTitle']}{product['infiniteValue']}{product['infiniteUnit']}/无限\n"""
                    else:
                        flux_package_str += f"""🔹[{ptitle}]{product['leftTitle']}{product['leftHighlight']}{product['rightCommon']}\n"""
                        suf = _flux_usage_suffix(telecom, product)
                        if suf:
                            flux_package_str += suf + "\n"

    status_icon = usage_status_icon(summary["commonUse"], summary["commonTotal"])
    if summary["flowOver"] == 0 and summary["commonTotal"] > 0:
        use_g = telecom.convert_flow(summary["commonUse"], "GB", 2)
        tot_g = telecom.convert_flow(summary["commonTotal"], "GB", 2)
        rem_g = telecom.convert_flow(summary["commonTotal"] - summary["commonUse"], "GB", 2)
        pct_common = 100.0 * summary["commonUse"] / summary["commonTotal"]
        common_block = (
            f"  - 通用：\n"
            f"    已用 {use_g} / 总量 {tot_g} GB\n"
            f"    剩余 {rem_g} GB · 已用占总量 {pct_common:.1f}% {status_icon}"
        )
    else:
        common_line = (
            f"{telecom.convert_flow(summary['commonUse'],'GB',2)} / {telecom.convert_flow(summary['commonTotal'],'GB',2)} GB"
            if summary["flowOver"] == 0
            else f"-{telecom.convert_flow(summary['flowOver'],'GB',2)} / {telecom.convert_flow(summary['commonTotal'],'GB',2)} GB"
        )
        common_block = f"  - 通用：{common_line} {status_icon}"

    special_block = ""
    if summary["specialTotal"] > 0:
        su, st = summary["specialUse"], summary["specialTotal"]
        su_g = telecom.convert_flow(su, "GB", 2)
        st_g = telecom.convert_flow(st, "GB", 2)
        sr_g = telecom.convert_flow(st - su, "GB", 2)
        pct_sp = 100.0 * su / st if st > 0 else 0.0
        special_block = (
            f"\n  - 专用：\n"
            f"    已用 {su_g} / 总量 {st_g} GB\n"
            f"    剩余 {sr_g} GB · 已用占总量 {pct_sp:.1f}%"
        )

    vt, vb, vu = summary["voiceTotal"], int(summary.get("voiceBalance") or 0), summary["voiceUsage"]
    if vt > 0:
        voice_line = f"📞 通话：已用 {vu} 分钟，剩余 {vb} 分钟，套餐含 {vt} 分钟"
    else:
        voice_line = f"📞 通话：已用 {vu} 分钟"

    notify_str = f"""
📱 手机：{summary['phonenum']}
💰 余额：{round(summary['balance']/100,2)} 元
{voice_line}
🌐 总流量
{common_block}{special_block}"""

    if TELECOM_FLUX_PACKAGE and flux_package_str.strip():
        notify_str += f"\n\n【流量明细】\n{flux_package_str.strip()}"

    notify_str = _append_fee_records(notify_str, rd.get("data"), phonenum, bills_by_phone)
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
    mqtt_by_phone = defaultdict(list)
    worst_icon = "🟢"
    for phonenum, password in accounts:
        telecom = Telecom()
        slice_data = state.setdefault(phonenum, {})
        try:
            part, icon = run_one_account(telecom, phonenum, password, slice_data, push_extra, bills_by_phone)
            all_blocks.extend(part)
            for blk in part:
                if (blk or "").strip():
                    mqtt_by_phone[phonenum].append(blk.strip())
            if icon in ("🔴", "🟠"):
                worst_icon = icon
            elif icon == "🟡" and worst_icon == "🟢":
                worst_icon = icon
        except Exception as ex:
            print(phonenum, ex)
            err = f"📱 {phonenum} 查询异常: {ex}"
            all_blocks.append(err)
            mqtt_by_phone[phonenum].append(err)
        _save_state(state)

    if all_blocks:
        print(f"===============推送通知===============")
        body = "\n\n────────────\n\n".join(all_blocks)
        by_phone = {p: "\n\n".join(v) for p, v in mqtt_by_phone.items() if v}
        by_phone_fmt = {p: _append_task_notify_footer(s) for p, s in by_phone.items()}
        body_fmt = _append_task_notify_footer(body) if len(by_phone) <= 1 else ""
        if TELECOM_ONLY_WARN and worst_icon == "🟢":
            print("流量使用在均匀范围内，跳过通知")
        elif len(by_phone) > 1:
            seen = set()
            for phonenum, _pwd in accounts:
                if phonenum in seen:
                    continue
                seen.add(phonenum)
                t_fmt = (by_phone_fmt.get(phonenum) or "").strip()
                if not t_fmt:
                    continue
                send_notify(
                    "【电信套餐】",
                    t_fmt,
                    push_extra,
                    only_wechat=bool(TELECOM_ONLY_WARN),
                    skip_footer=True,
                )
        else:
            send_notify(
                "【电信套餐】",
                body_fmt,
                push_extra,
                only_wechat=bool(TELECOM_ONLY_WARN),
                skip_footer=True,
            )
        _publish_mqtt(body, by_phone)
    print(f"===============程序结束===============")


if __name__ == "__main__":
    main()
