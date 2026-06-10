import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE_URL } from '../config.js';
import { geraToken } from '../GeraToken.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Load Test: simula carga esperada em produção
// Objetivo: verificar se a API se comporta bem sob uso normal e sustentado
export const options = {
    stages: [
        { duration: '30s', target: 10 },  // ramp-up gradual
        { duration: '2m',  target: 10 },  // carga estável (uso normal)
        { duration: '30s', target: 20 },  // pico moderado
        { duration: '2m',  target: 20 },  // mantém pico moderado
        { duration: '30s', target: 0  },  // ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],  // 95% das requisições abaixo de 1s
        http_req_failed:   ['rate<0.01'],   // menos de 1% de falhas
        checks:            ['rate>0.99'],   // mais de 99% dos checks passando
    },
}

export default function () {
    const token = geraToken()
    const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
    }

    // GET /api/users — lista usuários da biblioteca
    const response = http.get(`${BASE_URL}/api/users`, { headers })

    check(response, {
        'status is 200':          (r) => r.status === 200,
        'response tem conteúdo':  (r) => r.body.length > 0,
        'tempo abaixo de 1s':     (r) => r.timings.duration < 1000,
    })

    sleep(1)
}

export function handleSummary(data) {
    return {
        '../reports/load-report.html': htmlReport(data),
    }
}
