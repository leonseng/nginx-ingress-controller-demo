# NGINX App Protect DoS Demo

Demo to showcase NGINX App Protect DoS running on NGINX Ingress Controller to provide Layer 7 DoS protection.

## Setup

Set up access to NGINX Plus dashboard via `kubectl port-forward`
```shell
NIC_POD=$(kubectl -n nginx-ingress get pods --selector app.kubernetes.io/name=nginx-ingress --no-headers -o jsonpath='{.items[0].metadata.name}')

kubectl -n nginx-ingress port-forward pods/$NIC_POD 8080:8080
```

Deploy setup
```shell
# Get NIC IP
NIC_SVC_IP=$(kubectl -n nginx-ingress get svc nginx-ingress-lab-controller -o jsonpath='{.spec.clusterIP}')

# Generate k8s manifest for baseline load
cat 01-baseline.yaml.example | sed "s/\$NIC_SVC_IP/$NIC_SVC_IP/g" > 01-baseline.yaml

# Deploy backend app and clients for establishing baseline load
kubectl apply -f ./
```

## Demo

### Establish baseline

Show low response times:
1. via [NGINX Plus HTTP Upstream Dashboard](http://localhost:8080/dashboard.html#upstreams), or
2. by manually running test `time curl httpbin.nic-demo-dos.com/headers`

Go to [http://localhost:8080/dashboard-dos.html](http://localhost:8080/dashboard-dos.html) and observe the protected object status. After a few minutes, `Learning` status should be `ready`.

### Trigger DoS

Use [k6](https://k6.io/) to simulate large number of users

```shell
k6 run -e TARGET=httpbin.nic-demo-dos.com k6/httpbin-valid-load.js
```

Show increase in response times:
1. via [NGINX Plus HTTP Upstream Dashboard](http://localhost:8080/dashboard.html#upstreams), or
2. by manually running test `time curl httpbin.nic-demo-dos.com/headers`

After a few minutes, NAP DoS detects the backend is under attack and starts building dynamic signatures. Once signatures are in place, requests from load test should be rejected with `403`.

Show increase in response times:
1. via [NGINX Plus HTTP Upstream Dashboard](http://localhost:8080/dashboard.html#upstreams), or
2. by manually running test `time curl httpbin.nic-demo-dos.com/headers`


## Sample Event Logs

| Event | Log entry |
| --- | --- |
| No Attack | `date_time="Aug 18 2023 11:18:37", product="app-protect-dos", product_version="29+4.1.2-1~bullseye", unit_hostname="nginx-ingress-lab-controller-758db54b9c-2rrz4", instance_id="114342--2rrz4", vs_name="nic-demo-dos/dos-protected/my-dos", dos_attack_id="0", attack_event="No Attack", stress_level="0.85", learning_confidence="Ready", baseline_dps="13", incoming_dps="91", incoming_rps="4", successful_tps="4", unsuccessful_rps="0", incoming_datagrams="168704", incoming_requests="151312", successful_responses="95176", unsuccessful_requests="47889", active_connections="101", threshold_dps="268.31", threshold_conns="268.31", mitigated_bad_actors="7108", mitigated_by_signatures="574", mitigated_by_global_rate="72", mitigated_bad_actors_l4="0", mitigated_slow="248", redirect_global="34", redirect_bad_actor="4", redirect_signature="483", redirect_slow="0", challenge_global="0", challenge_bad_actor="7099", challenge_signature="0", challenge_slow="0", block_global="38", block_bad_actor="0", block_signature="91", block_slow="248", mitigated_connections="0", mitigated_bad_actors_rps="0", mitigated_by_signatures_rps="0", mitigated_by_global_rate_rps="0", mitigated_bad_actors_l4_rps="0", mitigated_slow_rps="0", redirect_global_rps="0", redirect_bad_actor_rps="0", redirect_signature_rps="0", redirect_slow_rps="0", challenge_global_rps="0", challenge_bad_actor_rps="0", challenge_signature_rps="0", challenge_slow_rps="0", block_global_rps="0", block_bad_actor_rps="0", block_signature_rps="0", block_slow_rps="0", mitigated_connections_rps="0",` |
| Attack started | `date_time="Aug 18 2023 11:18:42", product="app-protect-dos", product_version="29+4.1.2-1~bullseye", unit_hostname="nginx-ingress-lab-controller-758db54b9c-2rrz4", instance_id="114342--2rrz4", vs_name="nic-demo-dos/dos-protected/my-dos", dos_attack_id="2", attack_event="Attack started", stress_level="1.00", learning_confidence="Ready", baseline_dps="13", incoming_dps="92", incoming_rps="4", successful_tps="4", unsuccessful_rps="0", incoming_datagrams="169083", incoming_requests="151332", successful_responses="95196", unsuccessful_requests="47889", active_connections="101", threshold_dps="41.60", threshold_conns="41.60", mitigated_bad_actors="7108", mitigated_by_signatures="574", mitigated_by_global_rate="72", mitigated_bad_actors_l4="0", mitigated_slow="248", redirect_global="34", redirect_bad_actor="4", redirect_signature="483", redirect_slow="0", challenge_global="0", challenge_bad_actor="7099", challenge_signature="0", challenge_slow="0", block_global="38", block_bad_actor="0", block_signature="91", block_slow="248", mitigated_connections="0", mitigated_bad_actors_rps="0", mitigated_by_signatures_rps="0", mitigated_by_global_rate_rps="0", mitigated_bad_actors_l4_rps="0", mitigated_slow_rps="0", redirect_global_rps="0", redirect_bad_actor_rps="0", redirect_signature_rps="0", redirect_slow_rps="0", challenge_global_rps="0", challenge_bad_actor_rps="0", challenge_signature_rps="0", challenge_slow_rps="0", block_global_rps="0", block_bad_actor_rps="0", block_signature_rps="0", block_slow_rps="0", mitigated_connections_rps="0",` |
| Bad actor detection | `date_time="Aug 24 2023 06:21:15", product="app-protect-dos", product_version="30+4.2.0-1~bullseye", unit_hostname="nginx-ingress-lab-controller-5c4d449f7d-ftgtx", instance_id="438242--ftgtx", vs_name="nic-demo-dos/dos-protected/my-dos", dos_attack_id="5", attack_event="Bad actor detection", source_ip="192.168.0.115", tls_fp="0", impact_rps="118", l4_enforcement="false",` |
| Bad actors detected | `date_time="Aug 18 2023 11:18:44", product="app-protect-dos", product_version="29+4.1.2-1~bullseye", unit_hostname="nginx-ingress-lab-controller-758db54b9c-2rrz4", instance_id="114342--2rrz4", vs_name="nic-demo-dos/dos-protected/my-dos", dos_attack_id="2", attack_event="Bad actors detected", new_bad_actors_detected="0", bad_actors="1",` |
| Under Attack | `date_time="Aug 18 2023 11:18:45", product="app-protect-dos", product_version="29+4.1.2-1~bullseye", unit_hostname="nginx-ingress-lab-controller-758db54b9c-2rrz4", instance_id="114342--2rrz4", vs_name="nic-demo-dos/dos-protected/my-dos", dos_attack_id="2", attack_event="Under Attack", stress_level="1.20", learning_confidence="Ready", baseline_dps="13", incoming_dps="87", incoming_rps="0", successful_tps="0", unsuccessful_rps="0", incoming_datagrams="169519", incoming_requests="151507", successful_responses="95210", unsuccessful_requests="47889", active_connections="91", threshold_dps="28.89", threshold_conns="28.89", mitigated_bad_actors="7226", mitigated_by_signatures="574", mitigated_by_global_rate="72", mitigated_bad_actors_l4="0", mitigated_slow="301", redirect_global="34", redirect_bad_actor="91", redirect_signature="483", redirect_slow="0", challenge_global="0", challenge_bad_actor="7099", challenge_signature="0", challenge_slow="0", block_global="38", block_bad_actor="31", block_signature="91", block_slow="301", mitigated_connections="0", mitigated_bad_actors_rps="0", mitigated_by_signatures_rps="0", mitigated_by_global_rate_rps="0", mitigated_bad_actors_l4_rps="0", mitigated_slow_rps="0", redirect_global_rps="0", redirect_bad_actor_rps="0", redirect_signature_rps="0", redirect_slow_rps="0", challenge_global_rps="0", challenge_bad_actor_rps="0", challenge_signature_rps="0", challenge_slow_rps="0", block_global_rps="0", block_bad_actor_rps="0", block_signature_rps="0", block_slow_rps="0", mitigated_connections_rps="0",` |
| Attack signature detected | `date_time="Aug 18 2023 11:21:54", product="app-protect-dos", product_version="29+4.1.2-1~bullseye", unit_hostname="nginx-ingress-lab-controller-758db54b9c-2rrz4", instance_id="114342--2rrz4", vs_name="nic-demo-dos/dos-protected/my-dos", dos_attack_id="2", attack_event="Attack signature detected", signature="(http.cookie_header_exists eq true) and (http.headers_count eq 4) and (http.referer_header_exists eq true) and (http.accept_header_exists eq false) and (http.hdrorder hashes-to 26) and (http.referer hashes-to 62) and (http.user_agent contains other-than(IE\|Firefox\|Opera\|Chrome\|Safari\|curl\|grpc))", signature_id="205643202", signature_efficiency="1.00", signature_accuracy="100.00",` |
