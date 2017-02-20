export class HttpResponse {
    headers: any;
    content: any;
    status: number;
    get isSuccessStatusCode(): boolean {
        return /^(200|201|202|203|204|205|206|304)$/.test(this.status.toString());
    }
}