import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import http from "k6/http";

export const options = {
  vus: 100,
  duration: '600s',
  throw: true
};

export default function () {
  var uris = [
    "headers",
    "ip",
    "get",
    "user-agent",
    "status/200"
  ]

  var url = `http://${__ENV.TARGET}/` + uris[Math.floor(Math.random() * uris.length)];

  try {
    http.get(url, {
      timeout: randomIntBetween(5000, 15000)
    });
  } catch (error) {
  };

}