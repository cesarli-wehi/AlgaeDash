import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DataService {

    private pbrData = new BehaviorSubject({});
    private pbrData$ = this.pbrData.asObservable();

    private pbrNo = new BehaviorSubject({});
    private pbrNo$ = this.pbrNo.asObservable();

    private pbrGroupedHrly = new BehaviorSubject(true);
    private pbrGroupedHrly$ = this.pbrNo.asObservable();

    constructor() { }

    setPbrData(data) {
        return this.pbrData.next(data);
    }

    getPbrData(): Observable<any> {
        return this.pbrData$;
    }

    setPbrNo(no) {
        return this.pbrNo.next(no);
    }

    getPbrNo(): Observable<any> {
        return this.pbrNo$;
    }

    setPbrGroupedHrly(checked) {
        return this.pbrGroupedHrly.next(checked);
    }

    getPbrGroupedHrly(): Observable<any> {
        return this.pbrGroupedHrly$;
    }

}