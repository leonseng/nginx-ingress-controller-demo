# NGINX Ingress Controller Demo

This repository contains demo flows for [F5 NGINX Ingress Controller](https://github.com/nginxinc/kubernetes-ingress).

## Setup

Prerequisite:
1. NGINX Ingress Controller should be installed in cluster
1. NGINX Ingress Controller should be exposed via Kubernetes service with an IP accessible by a test client
1. This repository creates and deploys resources in the namespaces `blue`, `green` and `security`. Ensure NGINX Ingress Controller is configured to monitor for CRDs in these namespaces.

```
git clone https://github.com/leonseng/nginx-ingress-controller-demo.git
cd nginx-ingress-controller-demo
kubectl apply -f 00-setup/
```

---

## Demo flow

```
export NIC_IP=<exposed NIC ip>
export NIC_PORT=<exposed NIC port>
```

### 01 Virtual Server and Virtual Server Routes

Show cluster admin define domain and path for `blue`

```
kubectl apply -f 01-vs-and-vsr/vs-colour.yaml
kubectl apply -f 01-vs-and-vsr/vsr-blue.yaml
kubectl apply -f 01-vs-and-vsr/vsr-green.yaml
```

Show that `/blue` and `/green` working
```
$curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/blue"
blue

$curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/green"
green
```

### 02 Common Policy

Show security policies can be defined in `security` namespace

Apply common WAF policy
```
kubectl apply -f 02-common-policy/policy-common-waf.yaml
kubectl apply -f 02-common-policy/vs-colour-with-policy.yaml
```

Test WAF
```
$ curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/blue?<script>"
<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 10888946109843365222<br><br><a href='javascript:history.back();'>[Go Back]</a></body></html>
```

### 03 Per Route Policy

Show policy per Virtual Server route.

Basic auth applied to blue VSR:
```
kubectl apply -f 03-per-route-policy/policy-blue-basic-auth.yaml
kubectl apply -f 03-per-route-policy/vsr-blue-with-policy.yaml
```

Without credentials
```
$ curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/blue"
<html>
<head><title>401 Authorization Required</title></head>
<body>
<center><h1>401 Authorization Required</h1></center>
<hr><center>nginx/1.23.2</center>
</body>
</html>
```

With credentials
```
$ CRED=$(echo -n "user:password" | base64)
$ curl --resolve colour.example.com:$NIC_PORT:$NIC_IP -H "Authorization: Basic $CRED" "colour.example.com:$NIC_PORT/blue"
blue
```

---

## Reset

```
kubectl delete -f ./ --recursive
```