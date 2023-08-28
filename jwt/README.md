# JWT

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
```
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

### Check for JWT

Apply JWT policy and retest
```
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
```
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

### Verify claim in JWT

Configure JWT policy to check for `admin` claim. Claim is added as a HTTP header and then checked for in match condition
```
$ kubectl apply -f 02-vs-jwt-claim.yaml
virtualserver.k8s.nginx.org/httpbin configured
```

Send request with `user` JWT returns `401` as its claim `admin=false`
```
$ curl -H "Authorization: Bearer $(cat .tmp/user.jwt)"  httpbin.nic-demo-jwt.com/headers
401 Unauthorized
```

Now, send request with `admin` JWT with claim `admin=true`
```
$ curl -H "Authorization: Bearer $(cat .tmp/admin.jwt)"  httpbin.nic-demo-jwt.com/headers
{
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkxhR09aUkhjWmhZSEZuV3F5akxPdE9WU1ljRlRQVElsb21ZY0MxMnJ4ZGciLCJ0eXAiOiJKV1QifQ.eyJhZG1pbiI6dHJ1ZSwiaWF0IjoiMTY5MzI4NDgyNiIsIm5hbWUiOiJTYW0gU21pdGgiLCJzdWIiOiIxMjM0NTY3ODkwIn0.acqIGSdBAFlTqKCGS8PHhcl-moRm9gVUjJbDsyuELtlolG3qBMeK4r2iMtmnEr7sAZweMtuAAu_7XE8BsrJmLvALM8kXbOxkfdc4j9IZagDJNRkCZKKvPZtvSUW2lEx_-lAloGFaZjTnLIwWEbY7FYeWv5EHXlD6mUKXCUpQeu-RJ3-r_6GDSgJBFbAGrgVk-bzsON9b0O7BrFOTQ4bMMIkFu9xcu2v9N-K9QG4rFPh0FjOdxLVsYeRjx9Pw8WlKH2Q3-HtBRLPa9xRPwnNzveZDN_geFd3EKoFs0ESrCjOuIrLnH6KWWkjopJgIX1QtMUUZ9rziENw1-QysgHTavg",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  }
}
```

### Enrich header with JWT claim

Add JWT claim as HTTP header for proxied request to backend
```
$ kubectl apply -f 03-vs-jwt-claim-add-header.yaml
virtualserver.k8s.nginx.org/httpbin configured
```

Note that the backend now sees the additional HTTP headers `Jwt-Claim-Admin` and `Jwt-Claim-Name` with values extracted from the JWT claims:
```
$ curl -H "Authorization: Bearer $(cat .tmp/admin.jwt)"  httpbin.nic-demo-jwt.com/headers
{
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkxhR09aUkhjWmhZSEZuV3F5akxPdE9WU1ljRlRQVElsb21ZY0MxMnJ4ZGciLCJ0eXAiOiJKV1QifQ.eyJhZG1pbiI6dHJ1ZSwiaWF0IjoiMTY5MzI4NDgyNiIsIm5hbWUiOiJTYW0gU21pdGgiLCJzdWIiOiIxMjM0NTY3ODkwIn0.acqIGSdBAFlTqKCGS8PHhcl-moRm9gVUjJbDsyuELtlolG3qBMeK4r2iMtmnEr7sAZweMtuAAu_7XE8BsrJmLvALM8kXbOxkfdc4j9IZagDJNRkCZKKvPZtvSUW2lEx_-lAloGFaZjTnLIwWEbY7FYeWv5EHXlD6mUKXCUpQeu-RJ3-r_6GDSgJBFbAGrgVk-bzsON9b0O7BrFOTQ4bMMIkFu9xcu2v9N-K9QG4rFPh0FjOdxLVsYeRjx9Pw8WlKH2Q3-HtBRLPa9xRPwnNzveZDN_geFd3EKoFs0ESrCjOuIrLnH6KWWkjopJgIX1QtMUUZ9rziENw1-QysgHTavg",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "Jwt-Claim-Admin": "true",
    "Jwt-Claim-Name": "Sam Smith",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  }
}
```
