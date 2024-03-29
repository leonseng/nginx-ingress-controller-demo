# NGINX App Protect WAF Demo

Demo to showcase NGINX App Protect WAF running on NGINX Ingress Controller to provide Layer 7 WAF protection.

## Setup

Deploy test environment in the `nic-demo-waf` namespace
```bash
$ kubectl apply -f 00-setup.yaml
```

## Demo

Begin by attempting a L7 attacks with an unprotected VirtualServer
```shell
# Cross-site Scripting (XSS)
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

# SQL Injection
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

### Base policy

Apply the base WAF policy to VS and reattempt attacks
```yaml
apiVersion: appprotect.f5.com/v1beta1
kind: APPolicy
metadata:
  name: base
  namespace: nic-demo-waf
spec:
  policy:
    applicationLanguage: utf-8
    enforcementMode: blocking
    name: nap-base
    template:
      name: POLICY_TEMPLATE_NGINX_BASE
```

```shell
$ kubectl apply -f 01-vs-waf-base.yaml

$ curl "httpbin.nic-demo-waf.com/get?test=<sript>alert()</script>"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 5779507722792719200<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>

$ curl "httpbin.nic-demo-waf.com/get?test=a%20OR%201=1"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 8668108282602813355<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```

### Bot mitigation

Apply WAF policy that blocks bots.
```yaml
apiVersion: appprotect.f5.com/v1beta1
kind: APPolicy
metadata:
  name: block-bot
  namespace: nic-demo-waf
spec:
  policy:
    ...
    bot-defense:
      settings:
        isEnabled: true
      mitigations:
        classes:
          - name: trusted-bot
            action: ignore
          - name: untrusted-bot
            action: block
          - name: malicious-bot
            action: block
```

Request attempt with curl with fail as it is recognised as untrusted-bot
```shell
$ kubectl apply -f 02-vs-waf-bot-block.yaml

$ curl -s httpbin.nic-demo-waf.com/ip
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 11452482234251053204<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```

Logs
```log
attack_type="Non-browser Client",blocking_exception_reason="N/A",date_time="2023-08-25 05:29:57",dest_port="80",ip_client="192.168.0.115",is_truncated="false",method="GET",policy_name="block-bot",protocol="HTTP",request_status="blocked",response_code="0",severity="N/A",sig_cves="N/A",sig_ids="N/A",sig_names="N/A",sig_set_names="N/A",src_port="53800",sub_violations="N/A",support_id="16467778842880850137",threat_campaign_names="N/A",unit_hostname="nginx-ingress-lab-controller-5c4d449f7d-r5tql",uri="/ip",violation_rating="2",vs_name="35-httpbin.nic-demo-waf.com:16-/",x_forwarded_for_header_value="N/A",outcome="REJECTED",outcome_reason="SECURITY_WAF_VIOLATION",violations="Bot Client Detected",json_log="{""id"":""16467778842880850137"",""violations"":[{""enforcementState"":{""isBlocked"":false},""violation"":{""name"":""VIOL_BOT_CLIENT""}}],""enforcementAction"":""block"",""method"":""GET"",""clientPort"":53800,""clientIp"":""192.168.0.115"",""host"":""nginx-ingress-lab-controller-5c4d449f7d-r5tql"",""responseCode"":0,""serverIp"":""0.0.0.0"",""serverPort"":80,""requestStatus"":""blocked"",""url"":""L2lw"",""virtualServerName"":""35-httpbin.nic-demo-waf.com:16-/"",""enforcementState"":{""isBlocked"":true,""isAlarmed"":true,""rating"":2,""attackType"":[{""name"":""Non-browser Client""}]},""requestDatetime"":""2023-08-25T05:29:57Z"",""rawRequest"":{""actualSize"":90,""httpRequest"":""R0VUIC9pcCBIVFRQLzEuMQ0KSG9zdDogaHR0cGJpbi5uaWMtZGVtby13YWYuY29tDQpVc2VyLUFnZW50OiBjdXJsLzcuNjguMA0KQWNjZXB0OiAqLyoNCg0K"",""isTruncated"":false},""requestPolicy"":{""fullPath"":""block-bot""}}",violation_details="<?xml version='1.0' encoding='UTF-8'?><BAD_MSG><violation_masks><block>410000000000c00-3a03030c30000072-8000000000000000-0</block><alarm>475f0ffcb9d0fea-befbf35cb000007e-8000000000000000-0</alarm><learn>0-0-0-0</learn><staging>0-0-0-0</staging></violation_masks><request-violations><violation><viol_index>122</viol_index><viol_name>VIOL_BOT_CLIENT</viol_name></violation></request-violations></BAD_MSG>",bot_signature_name="curl",bot_category="HTTP Library",bot_anomalies="N/A",enforced_bot_anomalies="N/A",client_class="Untrusted Bot",client_application="N/A",client_application_version="N/A",request="GET /ip HTTP/1.1\r\nHost: httpbin.nic-demo-waf.com\r\nUser-Agent: curl/7.68.0\r\nAccept: */*\r\n\r\n",transport_protocol="HTTP/1.1"
```

### Bot mitigation - custom action

Update WAF policy to only alarm on curl robots
```yaml
apiVersion: appprotect.f5.com/v1beta1
kind: APPolicy
metadata:
  name: block-bot-allow-curl
  namespace: nic-demo-waf
spec:
  policy:
    ...
    bot-defense:
      ...
      mitigations:
        signatures:
          - action: alarm
            name: curl
```

```shell
$ kubectl apply -f 03-vs-waf-bot-allow-curl.yaml

$ curl -s httpbin.nic-demo-waf.com/ip
{
  "origin": "192.168.0.115"
}

$ curl "httpbin.nic-demo-waf.com/get?test=<sript>alert()</script>"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 5779507722792719710<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```

### Access enforcement based on OpenAPI spec

Deploy WAF policy to enforce API access based on OpenAPI spec
```yaml
apiVersion: appprotect.f5.com/v1beta1
kind: APPolicy
metadata:
  name: httpbin-openapi
  namespace: nic-demo-waf
spec:
  policy:
    applicationLanguage: utf-8
    enforcementMode: blocking
    name: httpbin-openapi
    template:
      name: POLICY_TEMPLATE_NGINX_BASE
    open-api-files:
      - link: https://raw.githubusercontent.com/leonseng/nginx-ingress-controller-demo/master/nap-waf/httpbin-oas3.yaml
    blocking-settings:
      violations:
        - name: VIOL_URL # block access to undocumented paths
          block: true
```

```shell
$ kubectl apply -f 04-vs-waf-openapi.yaml

$ curl -s httpbin.nic-demo-waf.com/ip
{
  "origin": "192.168.0.115"
}

# Access path NOT defined in OpenAPI spec
$ curl httpbin.nic-demo-waf.com/anything
{"supportID": "421807791060903022"}
```

Sample log entry
```
192.168.0.115 - - [29/Aug/2023:06:21:57 +0000] httpbin.nic-demo-waf.com "GET /anything HTTP/1.1" 400 36 "-" "curl/7.68.0" "-"
attack_type="Non-browser Client,Forceful Browsing",blocking_exception_reason="N/A",date_time="2023-08-29 06:21:57",dest_port="80",ip_client="192.168.0.115",is_truncated="false",method="GET",policy_name="httpbin-openapi",protocol="HTTP",request_status="blocked",response_code="0",severity="N/A",sig_cves="N/A",sig_ids="N/A",sig_names="N/A",sig_set_names="N/A",src_port="63874",sub_violations="N/A",support_id="421807791060903532",threat_campaign_names="N/A",unit_hostname="nginx-ingress-lab-controller-5c4d449f7d-r5tql",uri="/anything",violation_rating="2",vs_name="35-httpbin.nic-demo-waf.com:19-/",x_forwarded_for_header_value="N/A",outcome="REJECTED",outcome_reason="SECURITY_WAF_VIOLATION",violations="Illegal URL,Bot Client Detected",json_log="{""id"":""421807791060903532"",""violations"":[{""enforcementState"":{""isBlocked"":true},""violation"":{""name"":""VIOL_URL""}},{""enforcementState"":{""isBlocked"":false},""violation"":{""name"":""VIOL_BOT_CLIENT""}}],""enforcementAction"":""block"",""method"":""GET"",""clientPort"":63874,""clientIp"":""192.168.0.115"",""host"":""nginx-ingress-lab-controller-5c4d449f7d-r5tql"",""responseCode"":0,""serverIp"":""0.0.0.0"",""serverPort"":80,""requestStatus"":""blocked"",""url"":""L2FueXRoaW5n"",""virtualServerName"":""35-httpbin.nic-demo-waf.com:19-/"",""enforcementState"":{""isBlocked"":true,""isAlarmed"":true,""rating"":2,""attackType"":[{""name"":""Non-browser Client""},{""name"":""Forceful Browsing""}]},""requestDatetime"":""2023-08-29T06:21:57Z"",""rawRequest"":{""actualSize"":96,""httpRequest"":""R0VUIC9hbnl0aGluZyBIVFRQLzEuMQ0KSG9zdDogaHR0cGJpbi5uaWMtZGVtby13YWYuY29tDQpVc2VyLUFnZW50OiBjdXJsLzcuNjguMA0KQWNjZXB0OiAqLyoNCg0K"",""isTruncated"":false},""requestPolicy"":{""fullPath"":""httpbin-openapi""}}",violation_details="<?xml version='1.0' encoding='UTF-8'?><BAD_MSG><violation_masks><block>410000002000c00-3a03030c30000072-8000000000000000-0</block><alarm>475f0ffcb9d0fea-befbf35cb000007e-8000000000000000-0</alarm><learn>0-0-0-0</learn><staging>0-0-0-0</staging></violation_masks><request-violations><violation><viol_index>38</viol_index><viol_name>VIOL_URL</viol_name></violation><violation><viol_index>122</viol_index><viol_name>VIOL_BOT_CLIENT</viol_name></violation></request-violations></BAD_MSG>",bot_signature_name="curl",bot_category="HTTP Library",bot_anomalies="N/A",enforced_bot_anomalies="N/A",client_class="Untrusted Bot",client_application="N/A",client_application_version="N/A",request="GET /anything HTTP/1.1\r\nHost: httpbin.nic-demo-waf.com\r\nUser-Agent: curl/7.68.0\r\nAccept: */*\r\n\r\n",transport_protocol="HTTP/1.1"
2023/08/29 06:21:57 [alert] 2764#2764: *1609735 header already sent, client: 192.168.0.115, server: httpbin.nic-demo-waf.com, request: "GET /anything HTTP/1.1", host: "httpbin.nic-demo-waf.com"
```
