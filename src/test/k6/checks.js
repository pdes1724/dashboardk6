import { check } from 'k6';
import http from 'k6/http';

export default function () {
  const res = http.get('http://test.k.io/');
  check(res, {
    'verify homepage text': (r) =>
      r.body.includes('Collection of simple web-pages suitable for load testing'),
  });
}
