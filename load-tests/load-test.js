import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Track success rate and rate limit occurrences (429)
const successRate = new Rate("rate_success");
const rateLimitRate = new Rate("rate_limit_429");

export const options = {
  stages: [
    { duration: "3s", target: 50 },  // Ramp up to 50 virtual users (VUs)
    { duration: "7s", target: 100 }, // Peak at 100 VUs
    { duration: "5s", target: 0 },   // Ramp down to 0 VUs
  ],
  thresholds: {
    // 95% of request durations must be under 500ms
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const res = http.get("http://localhost:3001/api/v1/pdaotao/exams");

  // Verify HTTP status
  const is200 = res.status === 200;
  const is429 = res.status === 429;

  successRate.add(is200);
  rateLimitRate.add(is429);

  check(res, {
    "status is 200 OK": (r) => r.status === 200,
    "status is 429 Too Many Requests": (r) => r.status === 429,
  });

  // Simulate think time (0.5s - 1s) between requests
  sleep(Math.random() * 0.5 + 0.5);
}
