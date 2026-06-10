import http from 'k6/http'
import { BASE_URL } from './config.js';
export function geraToken() {
    const url = `${BASE_URL}/api/login`
    const payload = JSON.stringify({
        email: 'admin@biblioteca.com',
        password: 'admin123',
    })
    const headers = {
        accept: 'application/json',
        'Content-Type': 'application/json',
    }
    const response = http.post(url, payload, { headers })
    console.log('Status login:', response.status)
    console.log('Body login:', response.body)
    const token = response.json().token_for_swagger
    return token
}