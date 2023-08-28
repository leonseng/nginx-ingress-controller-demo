import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import http from "k6/http";

export const options = {
  vus: 100,
  duration: '600s',
  throw: true
};

function randomUri(layers) {
  var uri = "";
  for (let i = 0; i < layers; i++) {
    uri += "/" + randomString(randomIntBetween(4, 10));
  }

  return uri;
}

export default function () {

  try {
    http.get("http://httpbin.nic-demo-dos.com" + randomUri(randomIntBetween(1, 5)), {
      timeout: randomIntBetween(5000, 15000)
    });
  } catch (error) {
  };

}