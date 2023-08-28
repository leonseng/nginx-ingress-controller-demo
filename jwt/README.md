# JWT

Demo to showcase NGINX Ingress Controller enforcing authentication and authorization by validating JWT presented by client.

Backend is a [httpbin](httpbin.org) pod that presents the `/headers` endpoint to responds to the client with the HTTP headers it receives it the original requests, allowing us to verify the behaviour of NGINX Ingress Controller.

## Setup

```bash
mkdir -p .tmp

# Get JWK from mkjwk.org
curl -s 'https://mkjwk.org/jwk/rsa?alg=RS256&use=sig&gen=sha256&x509=true&size=2048' | jq . > .tmp/mkjwk.json

# Extract x509 version of JWK
cat .tmp/mkjwk.json | jq -r .x509pub > .tmp/jwk.crt
cat .tmp/mkjwk.json | jq -r .x509priv > .tmp/jwk.key

# Create K8s Secret containing JWK for NIC to validate JWT
kubectl -n nic-demo-jwt apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: my-jwks
type: nginx.org/jwk
data:
  jwk: $(cat .tmp/mkjwk.json | jq '{"keys": [.pub]}' | base64 -w0)
EOF

# Generate JWTs
JWT_KID=$(cat .tmp/mkjwk.json | jq -r .pub.kid)
JWT_IAT=$(date -d "+24hours" +%s)  # valid for next 24 hours
cat jwt_claim_admin.json | jwt -key .tmp/jwk.key -header kid=$JWT_KID -claim iat=$JWT_IAT -alg RS256 -sign - | tr -d '\n' > .tmp/admin.jwt
cat jwt_claim_user.json | jwt -key .tmp/jwk.key -header kid=$JWT_KID -claim iat=$JWT_IAT -alg RS256 -sign - | tr -d '\n' > .tmp/user.jwt
```

## Demo

Test setup with no JWT
```shell
$ curl httpbin.nic-demo-jwt.com/headers
{
  "headers": {
    "Accept": "*/*",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  }
}
```

### Authenticating with JWT

Configure NGINX Ingress Controller to authenticate the client based on the presented JWT. See [How NGINX Plus Validates a JWT](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-jwt-authentication/#how-nginx-plus-validates-a-jwt) for more information on what is validated.

Apply JWT policy and retest
```shell
$ kubectl apply -f 01-vs-jwt.yaml
virtualserver.k8s.nginx.org/httpbin configured

$ curl httpbin.nic-demo-jwt.com/headers
<html>
<head><title>401 Authorization Required</title></head>
<body>
<center><h1>401 Authorization Required</h1></center>
<hr><center>nginx/1.25.1</center>
</body>
</html>
```

Retest with JWT
```shell
$ curl -H "Authorization: Bearer $(cat .tmp/user.jwt)"  httpbin.nic-demo-jwt.com/headers
{
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkxhR09aUkhjWmhZSEZuV3F5akxPdE9WU1ljRlRQVElsb21ZY0MxMnJ4ZGciLCJ0eXAiOiJKV1QifQ.eyJhZG1pbiI6ZmFsc2UsImlhdCI6IjE2OTMyODQ4MjYiLCJuYW1lIjoiQ2FzZXkgQ29sZSIsInN1YiI6IjEyMzQ1Njc4OTAifQ.e8JZ7ettJntZvLygjveBFP9jBArZL7CfGBN8dnYLKsvY3_HrQs725XmZ9sbsfjreC9UnVnrwUrKX0zzL3Kqqxqjk1SGHhj-iMIzWWu2TYeF7UU-LyFGj2fZKYzXSvQxgvc-EF2HT-RJkCNUPdxz3ZkojEoXVbCW7lhsedgkTmcFv-B_KZqMj9Q6XMEI-UHkXqWLUuZ8jiFaB9xA8YXGbS7_Z1Pp2tiHV2HSKfw05aNkJb3zqilwBvnJfnYfnoGgHTn2sqZHlsZIVte-9W5ANtKw2rsf2wF0fm1oY1MYn_jnWrDSdJlJgWy357fDlQ4mJZS3VtYToKNtkftURwLFxUA",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  }
}
```

### Enrich header with JWT claim

Add JWT claim as HTTP header for proxied request to backend
```shell
$ kubectl apply -f 02-vs-jwt-add-header.yaml
virtualserver.k8s.nginx.org/httpbin configured
```

Note that the backend now sees the additional HTTP headers `Jwt-Claim-Role` and `Jwt-Claim-Name` with values extracted from the JWT claims:
```shell
$ curl -H "Authorization: Bearer $(cat .tmp/user.jwt)" httpbin.nic-demo-jwt.com/headers
{
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkxhR09aUkhjWmhZSEZuV3F5akxPdE9WU1ljRlRQVElsb21ZY0MxMnJ4ZGciLCJ0eXAiOiJKV1QifQ.eyJpYXQiOiIxNjkzMjg1NjQ5IiwibmFtZSI6IkNhc2V5IENvbGUiLCJyb2xlIjoidXNlciIsInN1YiI6IjEyMzQ1Njc4OTAifQ.L9qkznKBwyYU85J-sHYvVDb5-0_BMoxGqR3QFfYmjja-dk8xw9NbfOexTMsQ0kuyVGWhayqGfvcQ1cvyU7n4w7K1bVOnr2nA8nQzRcAZqoVopo2Q-C3dmTt8GHQBxOocoyZjOHrex-5ZffZLAAydROSP1y3DT5RNzPl53dHxJh-OmDq6VgZJb_BXP7vg-6fQa1U4mTBSQpIUoJ_Kn-P-3ZE_BMYWEeU7oJnoak4qi36jQXEO4to1lIbddSfHcNs6ZaM81rzfO-2X9Dc5rynX7uoqM0cPU_VCwFQPc6pRl9yX7W6fuL9zr19U1lcaxaddZgr9uCAmnTH_uOepqrP7Xw",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "Jwt-Claim-Name": "Casey Cole",
    "Jwt-Claim-Role": "user",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  }
}
```

### Verify claim in JWT

Configure NGINX Ingress Controller to authorize access to an endpoint by validating one or more claims presented in the JWT.

Configure an additional endpoint `/anything` which checks for `$request_method=POST` and `role=admin`:
```shell
$ kubectl apply -f 03-vs-jwt-claim.yaml
virtualserver.k8s.nginx.org/httpbin configured
```

`GET` and `POST` requests with `user` JWT return `401`:
```shell
$ curl -H "Authorization: Bearer $(cat .tmp/user.jwt)" httpbin.nic-demo-jwt.com/headers
401 Unauthorized

$ curl -X POST -H "Authorization: Bearer $(cat .tmp/user.jwt)" httpbin.nic-demo-jwt.com/anything
401 Unauthorized
```

`GET` request with `admin` JWT returns `401`:
```shell
$ curl -H "Authorization: Bearer $(cat .tmp/admin.jwt)" httpbin.nic-demo-jwt.com/anything
401 Unauthorized
```

`POST` request with `admin` JWT is allowed:
```shell
$ curl -X POST -H "Authorization: Bearer $(cat .tmp/admin.jwt)" httpbin.nic-demo-jwt.com/anything
{
  "args": {},
  "data": "",
  "files": {},
  "form": {},
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkxhR09aUkhjWmhZSEZuV3F5akxPdE9WU1ljRlRQVElsb21ZY0MxMnJ4ZGciLCJ0eXAiOiJKV1QifQ.eyJpYXQiOiIxNjkzMjg1NjQ5IiwibmFtZSI6IlNhbSBTbWl0aCIsInJvbGUiOiJhZG1pbiIsInN1YiI6IjEyMzQ1Njc4OTAifQ.GPu56lRyNXG7JVZHc4qojaVUh6xPJXqtY6FtaIUVaLei7dm4OT8G_PaTGy4St0RU3IJ40HlBz-yOhqOhM5zM2I1MV-RK_oZ_dc5wdrCzFaxyadfhQfwG7W1IwY237OqCY3GZ8r0yuHT-Cs-gpxsi4gKA1H1jO81DKxYeT2k94VwZS8ANQwUQZUVgEpo-NriOwe9RqgI55507tTqeohIvF7D91Ku5PVaVmOfaM6xmJ_jVbtX87JMPGNpMy1Of0hQPmzXI2SeJdTTvwvYHYuq_V268TvMcBYQbWwKQOqKi-IJe4wb_e1828f1I1VhAW0Upk6gA73o62LUNd23HOe_zag",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  },
  "json": null,
  "method": "POST",
  "origin": "192.168.0.115",
  "url": "http://httpbin.nic-demo-jwt.com/anything"
}
```
