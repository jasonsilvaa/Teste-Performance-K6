import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE_URL } from '../config.js';
import { geraToken } from '../GeraToken.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Stress Test: empurra a API além do limite esperado
// Objetivo: identificar o ponto de ruptura e como a API se recupera
export const options = {
    stages: [
        { duration: '30s', target: 10  },  // ramp-up inicial
        { duration: '1m',  target: 50  },  // carga moderada
        { duration: '30s', target: 100 },  // stress crescente
        { duration: '1m',  target: 100 },  // mantém stress
        { duration: '30s', target: 200 },  // pico máximo (ruptura)
        { duration: '1m',  target: 200 },  // mantém pico máximo
        { duration: '30s', target: 0   },  // ramp-down e recuperação
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],  // 95% das requisições abaixo de 2s
        http_req_failed:   ['rate<0.05'],   // menos de 5% de falhas
        checks:            ['rate>0.95'],   // mais de 95% dos checks passando
    },
}

export default function () {
    const token = geraToken()
    const headers = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
    }

    // GET /api/users — lista usuários da biblioteca sob alta carga
    const response = http.get(`${BASE_URL}/api/users`, { headers })

    check(response, {
        'status is 200':          (r) => r.status === 200,
        'response tem conteúdo':  (r) => r.body.length > 0,
        'tempo abaixo de 2s':     (r) => r.timings.duration < 2000,
    })

    sleep(1)
}

export function handleSummary(data) {
    return {
        '../reports/stress-report.html': htmlReport(data),
    }
}
