# is JWT presented?
# does JWT contain claim
# additional JWT processing - set in header

# VS + VSR, let app team decide if JWT policy should be applied


Private key
```
{
    "p": "8Om5HTL6CL5bHJ8Fis2YMr9utFS6W0Cki4LD4zAvBLdvPrCHoD4CChxrb1J0SdUjVLul2ELNuYQ8yhw0cDcWfE8bO9lxAxGOfyDffFjoKtpeoBJgTs6XuOkRef73qpr3WLv55vlw4StJlTXMPuMOucUDK8-1WPe1j8uESfTHxXE",
    "kty": "RSA",
    "q": "nEZYQ8SjhcIkvdL-fOXB4pEecae7bILrdyKJDnKmtFuSvhPUntycz8oHwzI5ZmPUvWQUsa2wWNnjAK8ye2FcrAchxHNZOnE0dnCtxppn6g46jSvbRjC97j6MiDYq4jdRFf1kX7ysqApxU-5RoSxLEywqPwovvxUboX-Td1H0UIc",
    "d": "P04xqPDbBxl0eW_W_agTtJ5b88fpvf8s-vGznGdkCCpxgeOBzuYUT9zPxOF5qiX5zWVI00NQtpmsTVR9tR4s_5irTAEIY4clKsxonhpcQFFzg1yMjtEO-QGeZVj4iOQf7co1Fdwv3jqeuapJfViBlTp42C-2h-yb4ewvyjmhILyuB8LeFi16MmoKb0LiZcPfjJR0fwjIu1LQj6SLxzlkZqiocIDRNq07v6vjMcQtTvpCdUADHfXxImoWnpQmkYIqx3x67RsDkL6IXdcjeWlxlFkG_MRsR5ocLW_TOyfPZEl88th1f9DE1Nry7hVJ5-l3KSihqCLLgV4T9JSubhFn4Q",
    "e": "AQAB",
    "use": "sig",
    "qi": "cQUYerWvSy_DGo7aZeGyTOQ4q2NxEF426E-1gOPflbMn35l1dcG02Yh_ObJvWIvyvA5DZ3Nbsz9H-TqKd5Au0znWsRnpMS7TxEDtsGR5fX21sKJrOsQEv0LI_xV1gsYXEBU0buF4Zf0VdhLNxHl8VuoCSOVUpXlKVwvAaZFtHQA",
    "dp": "His2qkhq9VNZN5FWcVZju98rLtv5ZloHAQ2EGFw9VxrdjH0wzslVGg0LCyrJM0HEpeTF1Powpw2_SxQTIQZVA4Yog-sr8tVtAdCNDBZaJJuqA-OpOdU3PMm7DYr3Wt8DIJKRrfIIx7nTAiN1i16Fxo-8YO0m6ZhDnVlAHL7RkZE",
    "alg": "RS256",
    "dq": "lSA_nDOqQ7r3KrmMpgzuDtGitpx0KuFn5yDqnwHjeNql1oK_8_TcIyFMdQWZZs6_NReq876mOLN7fqywxLItJ_AKVhgovq9Ge_ucqJexr9VyJEMElR9wL0g6_MSL-aEF3LEYNo-qRxTn_kq-VMoavin4Cn4i__oZiuxeAZAQT0M",
    "n": "kxCfxobmnkgHgOyFXz8NgAOijWWxfKDKV_4G3HuGlFqUFI3G3uwqRLQ3OXY310U_MrDYabyvcfOhb1eIYHFExfvewdoXJR6UBbaLwGWVN73mZjKB_sMsALHtR3AF-EGiUHlC1YivtCjz417Bzy3l5j9ElO9yEmnTI__C7rnbhiJV4gIh3R-D_iM_NglO7poBt8hZ15fRCfxEjHb2aDvDEyT4aanNr8XLKZIRRnxCqKK2DxchB3g1424kOHBXR3nUdVa_y3prD_0OF1djpEX9o8YifOxFg6l_xHXg1y2gO4u2ep85sSdxLWEuK8AU1HFSfy6WGRWl8KVt5g3mc8Bulw"
}
```

Public key
```
{
    "kty": "RSA",
    "e": "AQAB",
    "use": "sig",
    "alg": "RS256",
    "n": "kxCfxobmnkgHgOyFXz8NgAOijWWxfKDKV_4G3HuGlFqUFI3G3uwqRLQ3OXY310U_MrDYabyvcfOhb1eIYHFExfvewdoXJR6UBbaLwGWVN73mZjKB_sMsALHtR3AF-EGiUHlC1YivtCjz417Bzy3l5j9ElO9yEmnTI__C7rnbhiJV4gIh3R-D_iM_NglO7poBt8hZ15fRCfxEjHb2aDvDEyT4aanNr8XLKZIRRnxCqKK2DxchB3g1424kOHBXR3nUdVa_y3prD_0OF1djpEX9o8YifOxFg6l_xHXg1y2gO4u2ep85sSdxLWEuK8AU1HFSfy6WGRWl8KVt5g3mc8Bulw"
}
```

JWT # expires at 16 August 2034 16:59:32 GMT+10:00
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MjAzOTMyNDM3Mn0.DLy-sI7DC4xKCL4qDCRjYDL86I6LOdsdQeyQDZyDcQ5TA80W_j5_ZbSGU7tVfX2WvUd-gyf4Ig8Fcr9ZOtQmBAxQMPXAkmqWcnspNPEDGNP6d6CzOJ5B7Mk9JIa1gMBdC01avcNy0FXJPPX6-Q_Uzx3nJUcC5KMXQ9o1ACaurV945YB4biUXbZzLpNkUx4Fi2KuZPSuNARMaSDWl0bdM02vTiSo9VdTIcDyBC1TOHx8pHZbEy4xJxdF2hj8hPXJR_hQ28gpFbCqvNyUs-GvZQGmJbn7z-zse3yeP57IYbAcSx4_dNxcAWVmWeEWJXZrO7BgQbWb1ZgzKsvyLv8hF4A
```

```
# JWT payload
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true,
  "iat": 2039324372
}
```

```
$ curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MjAzOTMyNDM3Mn0.DLy-sI7DC4xKCL4qDCRjYDL86I6LOdsdQeyQDZyDcQ5TA80W_j5_ZbSGU7tVfX2WvUd-gyf4Ig8Fcr9ZOtQmBAxQMPXAkmqWcnspNPEDGNP6d6CzOJ5B7Mk9JIa1gMBdC01avcNy0FXJPPX6-Q_Uzx3nJUcC5KMXQ9o1ACaurV945YB4biUXbZzLpNkUx4Fi2KuZPSuNARMaSDWl0bdM02vTiSo9VdTIcDyBC1TOHx8pHZbEy4xJxdF2hj8hPXJR_hQ28gpFbCqvNyUs-GvZQGmJbn7z-zse3yeP57IYbAcSx4_dNxcAWVmWeEWJXZrO7BgQbWb1ZgzKsvyLv8hF4A" httpbin.nic-demo-jwt.com/headers
{
  "headers": {
    "Accept": "*/*",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MjAzOTMyNDM3Mn0.DLy-sI7DC4xKCL4qDCRjYDL86I6LOdsdQeyQDZyDcQ5TA80W_j5_ZbSGU7tVfX2WvUd-gyf4Ig8Fcr9ZOtQmBAxQMPXAkmqWcnspNPEDGNP6d6CzOJ5B7Mk9JIa1gMBdC01avcNy0FXJPPX6-Q_Uzx3nJUcC5KMXQ9o1ACaurV945YB4biUXbZzLpNkUx4Fi2KuZPSuNARMaSDWl0bdM02vTiSo9VdTIcDyBC1TOHx8pHZbEy4xJxdF2hj8hPXJR_hQ28gpFbCqvNyUs-GvZQGmJbn7z-zse3yeP57IYbAcSx4_dNxcAWVmWeEWJXZrO7BgQbWb1ZgzKsvyLv8hF4A",
    "Connection": "close",
    "Host": "httpbin.nic-demo-jwt.com",
    "User-Agent": "curl/7.68.0",
    "X-Forwarded-Host": "httpbin.nic-demo-jwt.com"
  }
}
```