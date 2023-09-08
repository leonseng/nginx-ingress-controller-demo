# NIC TLS Passthrough

This example shows TLS passthrough working through NIC TransportServer resource.

## Setup

Deploy test environment in the `nic-demo-jwt` namespace
```bash
kubectl apply -f 00-setup.yaml
```

Use [mkcert](https://github.com/FiloSottile/mkcert) to generate a server certificate for `tls-passthrough.nic-demo.com`
```bash
mkcert tls-passthrough.nic-demo.com
cp $(mkcert -CAROOT)/rootCA.pem ./
```

Create a Kubernetes secret to store the server certificate key pair and the trusted CA:
```bash
kubectl apply -f - <<EOF
kind: Secret
metadata:
  name: tls-passthrough.nic-demo.com-tls-cert
  namespace: nic-demo-tls-passthrough
type: kubernetes.io/tls
apiVersion: v1
data:
  tls.crt: $(cat tls-passthrough.nic-demo.com.pem | base64 -w0)
  tls.key: $(cat tls-passthrough.nic-demo.com-key.pem | base64 -w0)
  rootCA.crt: $(cat rootCA.pem | base64 -w0)
EOF
```

## Request on TLS endpoint

```
$ curl -vvv https://tls-passthrough.nic-demo.com
*   Trying 192.168.255.100:443...
* TCP_NODELAY set
* Connected to tls-passthrough.nic-demo.com (192.168.255.100) port 443 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/certs/ca-certificates.crt
  CApath: /etc/ssl/certs
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Request CERT (13):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Certificate (11):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* ALPN, server accepted to use http/1.1
* Server certificate:
*  subject: O=mkcert development certificate; OU=leon@5NNS0F3
*  start date: Sep  8 11:29:29 2023 GMT
*  expire date: Dec  8 10:29:29 2025 GMT
*  subjectAltName: host "tls-passthrough.nic-demo.com" matched cert's "tls-passthrough.nic-demo.com"
*  issuer: O=mkcert development CA; OU=leon@5NNS0F3; CN=mkcert leon@5NNS0F3
*  SSL certificate verify ok.
> GET / HTTP/1.1
> Host: tls-passthrough.nic-demo.com
> User-Agent: curl/7.68.0
> Accept: */*
>
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
* old SSL session ID is stale, removing
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Server: nginx/1.25.2
< Date: Fri, 08 Sep 2023 11:38:01 GMT
< Content-Type: application/octet-stream
< Content-Length: 16
< Connection: keep-alive
<
TLS passthrough
* Connection #0 to host tls-passthrough.nic-demo.com left intact
```

The server certificate presented to the client belongs to the NGINX container behind the NIC, indicating that TLS passthrough worked.

## Request with client certificate presented

Use [mkcert](https://github.com/FiloSottile/mkcert) to generate a client certificate for `client.tls-passthrough.nic-demo.com`
```bash
mkcert -client client.tls-passthrough.nic-demo.com
```

Send a request to the `/mtls` endpoint with the client certificate
```
$ curl --cert client.tls-passthrough.nic-demo.com-client.pem --key client.tls-passthrough.nic-demo.com-client-key.pem https://tls-passthrough.nic-demo.com/mtls
Hello, OU=dev,O=mkcert development certificate!
```

The NGINX pod behind NIC is able to extract information from the client certificate and included it in the response, indicating that MTLS passthrough worked.
