import { Component, OnInit } from '@angular/core';
import { AnyForUntypedForms } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DataService } from '../_services/data.service';
import * as loDash from 'lodash';

@Component({
  selector: 'app-fileUploader',
  templateUrl: './fileUploader.component.html',
  styleUrls: ['./fileUploader.component.css']
})
export class FileUploaderComponent implements OnInit {

  title = 'XlsRead';
  file: File;
  arrayBuffer: any;
  fileList: any
  hourlyData: boolean = true;

  constructor(private _data: DataService) { }

  ngOnInit() {
  }

  setHourly(event) {
    this.hourlyData = event.checked;
  }

  addFile(event) {
    this.file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(this.file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary", cellText: false, cellDates: true });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      //console.log(XLSX.utils.sheet_to_json(worksheet, { raw: true }));
      var arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: true, dateNF: 'yyyy-mm-dd' });

      if (this.hourlyData) {
        const newArray = this.processData(arrayList);

        this._data.setPbrData(newArray);
      } else {
        this._data.setPbrData(arrayList);
      }    
    }
  }

  processData(arrayList) {
    let newArray = [];
      const groupedByDay = this.groupByDay(arrayList);
      groupedByDay.forEach(el => {
        const groupedByHour = this.groupByHr(el);
        groupedByHour.forEach(it => {

          const reduced = it.reduce((acc, val) => {
            let time = val.Timestamp.getHours();
            if (!acc[time]) {
              acc[time] = { ...val, count: 1 }
              return acc;
            }
            acc[time]['PBR1_CO2injection [off/ON]'] || val['PBR1_CO2injection [off/ON]'];
            acc[time]['PBR1_Circ.Pump [A]'] += val['PBR1_Circ.Pump [A]'];
            acc[time]['PBR1_Circ.Pump [Hz]'] += val['PBR1_Circ.Pump [Hz]'];
            acc[time]['PBR1_Darktank [m3]'] += val['PBR1_Darktank [m3]'];
            acc[time]['PBR1_Flow [l/min]'] += val['PBR1_Flow [l/min]'];
            acc[time]['PBR1_Input LDO [ppm]'] += val['PBR1_Input LDO [ppm]'];
            acc[time]['PBR1_Input [pH]'] += val['PBR1_Input [pH]'];
            acc[time]['PBR1_Input [°C]'] += val['PBR1_Input [°C]'];
            acc[time]['PBR1_Light [umol/m2/s]'] += val['PBR1_Light [umol/m2/s]'];
            acc[time]['PBR1_Output LDO [ppm]'] += val['PBR1_Output LDO [ppm]'];
            acc[time]['PBR1_Output [pH]'] += val['PBR1_Output [pH]'];
            acc[time]['PBR1_Output [°C]'] += val['PBR1_Output [°C]'];
            acc[time].count += 1;
            return acc;
          }, {});

          const result = Object.keys(reduced).map(function (k) {
            const item = reduced[k];
            return {
              Timestamp: item.Timestamp,
              'PBR1_CO2injection [off/ON]': item['PBR1_CO2injection [off/ON]'],
              'PBR1_Circ.Pump [Hz]': item['PBR1_Circ.Pump [Hz]'],
              'PBR1_Darktank [m3]': item['PBR1_Darktank [m3]'],
              'PBR1_Flow [l/min]': item['PBR1_Flow [l/min]'],
              'PBR1_Input LDO [ppm]': item['PBR1_Input LDO [ppm]'],
              'PBR1_Input [pH]': item['PBR1_Input [pH]'],
              'PBR1_Input [°C]': item['PBR1_Input [°C]'],
              'PBR1_Light [umol/m2/s]': item['PBR1_Light [umol/m2/s]'],
              'PBR1_Output LDO [ppm]': item['PBR1_Output LDO [ppm]'],
              'PBR1_Output [pH]': item['PBR1_Output [pH]'],
              'PBR1_Output [°C]': item['PBR1_Output [°C]'],
              'PBR1_Circ.Pump [A]': item['PBR1_Circ.Pump [A]'] / item.count,
            }
          })
          newArray = newArray.concat(result);
        });
      });
    return newArray;
  }

  groupByDay(arr) {
    const result = loDash.groupBy(arr, (el) => {
      return new Date(el.Timestamp).getDay();
    });
    return loDash.toArray(result)
  }

  groupByHr(arr) {
    const result = loDash.groupBy(arr, (el) => {
      return new Date(el.Timestamp).getHours();
    });
    //console.log(result);
    return loDash.toArray(result)
  }

  clearData() {
    this._data.setPbrData({});
    this.file = null;
    this.arrayBuffer = null;
    this.fileList = null;
  }

}
