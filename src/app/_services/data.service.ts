import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DataService {

    private pbrData = new BehaviorSubject({});
    private pbrData$ = this.pbrData.asObservable();

    constructor() { }

    setPbrData(data) {
        return this.pbrData.next(data);
    }

    getPbrData(): Observable<any> {
        return this.pbrData$;
    }

}