# NGINX App Protect WAF Demo


## Base policy

Begin by attempting a L7 attacks with an unprotected VirtualServer
```shell
$ k apply -f 01-vs.yaml

$ curl "httpbin.nic-demo-waf.com/get?test=<sript>alert()</script>"
{
  "args": {
    "test": "<sript>alert()</script>"
  },
  "headers": {
    "Accept": "*/*",
    "Connection": "close",
    "Host": "httpbin.nic-demo-waf.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-waf.com"
  },
  "origin": "192.168.0.115",
  "url": "http://httpbin.nic-demo-waf.com/get?test=<sript>alert()<%2Fscript>"
}

$ curl "httpbin.nic-demo-waf.com/get?test=a%20OR%201=1"
{
  "args": {
    "test": "a OR 1=1"
  },
  "headers": {
    "Accept": "*/*",
    "Connection": "close",
    "Host": "httpbin.nic-demo-waf.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-waf.com"
  },
  "origin": "192.168.0.115",
  "url": "http://httpbin.nic-demo-waf.com/get?test=a OR 1=1"
}
```

Apply WAF policy to VS and reattempt attacks
```shell
$ k apply -f 02-vs-waf.yaml

$ curl "httpbin.nic-demo-waf.com/get?test=<sript>alert()</script>"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 5779507722792719200<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>

$ curl "httpbin.nic-demo-waf.com/get?test=a%20OR%201=1"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 8668108282602813355<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```

## Bot mitigation

Apply WAF policy that blocks bots. Request attempt with curl with fail as it is recognised as untrusted-bot
```shell
$ k apply -f 03-vs-waf-bot-block.yaml

$ curl -s httpbin.nic-demo-waf.com/ip
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 11452482234251053204<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```

Logs
```
attack_type="Non-browser Client",blocking_exception_reason="N/A",date_time="2023-08-25 05:29:57",dest_port="80",ip_client="192.168.0.115",is_truncated="false",method="GET",policy_name="block-bot",protocol="HTTP",request_status="blocked",response_code="0",severity="N/A",sig_cves="N/A",sig_ids="N/A",sig_names="N/A",sig_set_names="N/A",src_port="53800",sub_violations="N/A",support_id="16467778842880850137",threat_campaign_names="N/A",unit_hostname="nginx-ingress-lab-controller-5c4d449f7d-r5tql",uri="/ip",violation_rating="2",vs_name="35-httpbin.nic-demo-waf.com:16-/",x_forwarded_for_header_value="N/A",outcome="REJECTED",outcome_reason="SECURITY_WAF_VIOLATION",violations="Bot Client Detected",json_log="{""id"":""16467778842880850137"",""violations"":[{""enforcementState"":{""isBlocked"":false},""violation"":{""name"":""VIOL_BOT_CLIENT""}}],""enforcementAction"":""block"",""method"":""GET"",""clientPort"":53800,""clientIp"":""192.168.0.115"",""host"":""nginx-ingress-lab-controller-5c4d449f7d-r5tql"",""responseCode"":0,""serverIp"":""0.0.0.0"",""serverPort"":80,""requestStatus"":""blocked"",""url"":""L2lw"",""virtualServerName"":""35-httpbin.nic-demo-waf.com:16-/"",""enforcementState"":{""isBlocked"":true,""isAlarmed"":true,""rating"":2,""attackType"":[{""name"":""Non-browser Client""}]},""requestDatetime"":""2023-08-25T05:29:57Z"",""rawRequest"":{""actualSize"":90,""httpRequest"":""R0VUIC9pcCBIVFRQLzEuMQ0KSG9zdDogaHR0cGJpbi5uaWMtZGVtby13YWYuY29tDQpVc2VyLUFnZW50OiBjdXJsLzcuNjguMA0KQWNjZXB0OiAqLyoNCg0K"",""isTruncated"":false},""requestPolicy"":{""fullPath"":""block-bot""}}",violation_details="<?xml version='1.0' encoding='UTF-8'?><BAD_MSG><violation_masks><block>410000000000c00-3a03030c30000072-8000000000000000-0</block><alarm>475f0ffcb9d0fea-befbf35cb000007e-8000000000000000-0</alarm><learn>0-0-0-0</learn><staging>0-0-0-0</staging></violation_masks><request-violations><violation><viol_index>122</viol_index><viol_name>VIOL_BOT_CLIENT</viol_name></violation></request-violations></BAD_MSG>",bot_signature_name="curl",bot_category="HTTP Library",bot_anomalies="N/A",enforced_bot_anomalies="N/A",client_class="Untrusted Bot",client_application="N/A",client_application_version="N/A",request="GET /ip HTTP/1.1\r\nHost: httpbin.nic-demo-waf.com\r\nUser-Agent: curl/7.68.0\r\nAccept: */*\r\n\r\n",transport_protocol="HTTP/1.1"
192.168.0.115 - - [25/Aug/2023:05:29:58 +0000] httpbin.nic-demo-waf.com "GET /ip HTTP/1.1" 400 247 "-" "curl/7.68.0" "-"
2023/08/25 05:29:58 [alert] 560#560: *46445 header already sent, client: 192.168.0.115, server: httpbin.nic-demo-waf.com, request: "GET /ip HTTP/1.1", host: "httpbin.nic-demo-waf.com"
```

Update WAF policy to only alarm on curl robots
```shell
$ k apply -f 04-vs-waf-bot-allow-curl.yaml

$ curl -s httpbin.nic-demo-waf.com/ip
{
  "origin": "192.168.0.115"
}

$ curl "httpbin.nic-demo-waf.com/get?test=<sript>alert()</script>"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 5779507722792719710<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```