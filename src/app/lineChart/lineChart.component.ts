import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartDataset, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DatePipe } from '@angular/common';
import 'hammerjs';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin, { zoom } from 'chartjs-plugin-zoom';
import { DataService } from '../_services/data.service';

@Component({
  selector: 'app-lineChart',
  templateUrl: './lineChart.component.html',
  styleUrls: ['./lineChart.component.scss']
})
export class LineChartComponent implements OnInit, OnChanges {

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @Input() chartData;



  labels = [];
  datasets = [];
  annotations = [];
  datePipe = new DatePipe('en-GB');
  hourly: boolean;

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: this.labels
  };

  public lineChartPlugins = [zoomPlugin, annotationPlugin];

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.5
      }
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {},
      'y-axis-0':
      {
        position: 'left',
      },
      'y-axis-1': {
        position: 'right',
        grid: {
          color: 'rgba(255,0,0,0.3)',
        },
        ticks: {
          color: 'red'
        }
      }
    },
    responsive: true,

    plugins: {
      legend: { display: true },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.05,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'xy',
          modifierKey: 'ctrl'
        }
      },
      annotation: {
        annotations: this.annotations,
        // [
        //   {
        //     type: 'line',
        //     scaleID: 'x',
        //     value: 'March',
        //     borderColor: 'orange',
        //     borderWidth: 2,
        //     label: {
        //       position: 'center',
        //       enabled: true,
        //       color: 'orange',
        //       content: 'LineAnno',
        //       font: {
        //         weight: 'bold'
        //       }
        //     }
        //   },
        // ],
      }
    },
    // transitions: {
    //   zoom: {
    //     animation: {
    //       duration: 1000,
    //       easing: 'easeOutCubic'
    //     }
    //   }
    // }
  };


  public lineChartType: ChartType = 'line';

  constructor(private _data: DataService) {
    Chart.register(zoomPlugin, annotationPlugin)
  }

  ngOnInit() {
    this._data.getPbrGroupedHrly().subscribe(res => {
      this.hourly = res;
    })
  }

  ngOnChanges() {
    this.createLabels();
    this.createDatasets();
  }

  createLabels() {
    this.labels = [];
    if (this.chartData.length > 0) {
      this.chartData.forEach((el) => {
        const date = el.Timestamp;
        const strDate = date.toLocaleString('en-GB');
        console.log(date)
        //const formattedDate = this.datePipe.transform(strDate, 'short')
        this.labels.push(strDate)
      });
    }
    this.lineChartData.labels = this.labels;
    this.chart?.update();
  }

  createDatasets() {
    this.datasets = [];
    if (this.chartData.length > 0) {
      const datasets = [];
      this.chartData.forEach((el, i) => {
        Object.keys(el).forEach(k => {
          if (k === 'Timestamp') {
            //do nothing
          } else if (k === 'CO2injection [off/ON]') {
            if (el['CO2injection [off/ON]'] == true) {
              let obj = {
                type: 'line',
                scaleID: 'x',
                value: el.Timestamp.toLocaleString('en-GB'),
                borderColor: 'orange',
                borderWidth: 2,
                label: {
                  position: 'center',
                  enabled: true,
                  color: 'orange',
                  content: 'Injection',
                  font: {
                    weight: 'bold'
                  }
                }
              }
              this.annotations.push(obj)
            }  
          } else {
            const hidden = !Boolean(this.hourly);
            let obj = {
              data: [],
              label: k,
              borderColor: this.createColourFromString(k, 1),
              pointBackgroundColor: this.createColourFromString(k, 1),
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: this.createColourFromString(k, 0.8),
              fill: 'origin',
              hidden: hidden,
            }
            var index = datasets.findIndex(x => x.label == k);
            if (index === -1) {
              datasets.push(obj)
            }
          }
        });
        for (let i = 0; i < Object.keys(el).length; i++) {
          datasets.forEach(d => {
            if (d.label === Object.entries(el)[i][0]) {
              d.data.push(Object.entries(el)[i][1])
            }
          });
        }
      });
      this.lineChartData.datasets = datasets;
      this.datasets = datasets;
      this.chart?.update();
    }
  }

  createColourFromString(str, opacity) {
    var hash = 0
    if (str.length === 0) return hash;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    var rgb = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 255;
      rgb[i] = value;
    }
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  }



  private static generateNumber(i: number): number {
    return Math.floor((Math.random() * (i < 2 ? 100 : 1000)) + 1);
  }

  public randomize(): void {
    for (let i = 0; i < this.lineChartData.datasets.length; i++) {
      for (let j = 0; j < this.lineChartData.datasets[i].data.length; j++) {
        this.lineChartData.datasets[i].data[j] = LineChartComponent.generateNumber(i);
      }
    }
    this.chart?.update();
  }

  // events
  public chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    //console.log(event, active);
  }

  public chartHovered({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    //console.log(event, active);
  }

  removeDataset(name) {
    this.lineChartData.datasets.filter(el => {
      return el.label != name;
    });
    this.chart.update();
  }

  addDataset(name) {
    let d = this.datasets.filter(el => {
      return el.label == name
    });
    //(this.lineChartData.datasets as ChartDataset).push(d);
    this.chart.update();
  }

  resetZoom() {
    this.chart.chart.resetZoom();
  }


}
