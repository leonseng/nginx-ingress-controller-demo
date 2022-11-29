# NGINX Ingress Controller Demo

This repository contains demo flows for [NGINX Ingress Controller](https://github.com/nginxinc/kubernetes-ingress) by F5.

## Prereq

NGINX Ingress Controller should be installed in cluster and exposed via Kubernetes service

## Setup

```
git clone https://github.com/leonseng/nginx-ingress-controller-demo.git
cd nginx-ingress-controller-demo
kubectl apply -f setup/
```

## Demo flow

```
export NIC_IP=<exposed NIC ip>
export NIC_PORT=<exposed NIC port>
```

Show cluster admin define domain and path for `blue`
```
kubectl apply -f vs-colour.yaml
kubectl apply -f vsr-blue.yaml
kubectl apply -f vsr-green.yaml
```

Show that `/blue` and `/green` working
```
curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/blue"
curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/green"

```

Show security policies can be defined in `security` namespace
Apply common WAF policy
```
kubectl apply -f policy-common-waf.yaml
kubectl apply -f vs-colour-with-policy.yaml
```

Test WAF
```
curl --resolve colour.example.com:$NIC_PORT:$NIC_IP "colour.example.com:$NIC_PORT/blue?<script>"
```

Show policy per VSR
```
kubectl apply -f policy-blue-basic-auth.yaml
kubectl apply -f vsr-blue-with-policy.yaml
```

Test basic auth
```
CRED=$(echo -n "user:password" | base64)
curl --resolve colour.example.com:$NIC_PORT:$NIC_IP -H "Authentication: $CRED" "colour.example.com:$NIC_PORT/blue?<script>"
```