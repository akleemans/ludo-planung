import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {ScheduleParameters} from '../model/schedule-parameters';
import {addDays, format, getDay, parse, parseISO} from "date-fns";

enum UploadState {
    Initial,
    Uploading,
    Uploaded
}

class DateObject {
    constructor(
        public date: Date
    ) {
        this.dateStr = format(date, 'dd.MM.')
        this.dayOfWeek = getDay(this.date)
    }

    public dateStr: string;
    public dayOfWeek: number;
}

@Component({
    selector: 'app-upload-dialog',
    templateUrl: './upload-dialog.component.html',
    styleUrls: ['./upload-dialog.component.scss']
})
export class UploadDialogComponent {
    public readonly uploadStateEnum = UploadState;
    private file: File | null | undefined;
    public uploadState: UploadState = UploadState.Initial;
    public scheduleParameters?: ScheduleParameters;

    public startDate: Date | undefined;
    public endDate: Date | undefined;
    public dates: DateObject[] = [
        {
            "date": "2025-02-10T23:00:00.000Z",
            "dateStr": "11.02.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-02-13T23:00:00.000Z",
            "dateStr": "14.02.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-02-14T23:00:00.000Z",
            "dateStr": "15.02.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-02-17T23:00:00.000Z",
            "dateStr": "18.02.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-02-20T23:00:00.000Z",
            "dateStr": "21.02.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-02-21T23:00:00.000Z",
            "dateStr": "22.02.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-02-24T23:00:00.000Z",
            "dateStr": "25.02.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-02-27T23:00:00.000Z",
            "dateStr": "28.02.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-02-28T23:00:00.000Z",
            "dateStr": "01.03.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-03-10T23:00:00.000Z",
            "dateStr": "11.03.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-03-13T23:00:00.000Z",
            "dateStr": "14.03.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-03-14T23:00:00.000Z",
            "dateStr": "15.03.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-03-17T23:00:00.000Z",
            "dateStr": "18.03.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-03-20T23:00:00.000Z",
            "dateStr": "21.03.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-03-21T23:00:00.000Z",
            "dateStr": "22.03.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-03-24T23:00:00.000Z",
            "dateStr": "25.03.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-03-27T23:00:00.000Z",
            "dateStr": "28.03.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-03-28T23:00:00.000Z",
            "dateStr": "29.03.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-03-31T22:00:00.000Z",
            "dateStr": "01.04.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-04-03T22:00:00.000Z",
            "dateStr": "04.04.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-04-04T22:00:00.000Z",
            "dateStr": "05.04.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-04-21T22:00:00.000Z",
            "dateStr": "22.04.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-04-24T22:00:00.000Z",
            "dateStr": "25.04.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-04-25T22:00:00.000Z",
            "dateStr": "26.04.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-04-28T22:00:00.000Z",
            "dateStr": "29.04.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-05-01T22:00:00.000Z",
            "dateStr": "02.05.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-05-02T22:00:00.000Z",
            "dateStr": "03.05.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-05-05T22:00:00.000Z",
            "dateStr": "06.05.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-05-08T22:00:00.000Z",
            "dateStr": "09.05.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-05-09T22:00:00.000Z",
            "dateStr": "10.05.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-05-12T22:00:00.000Z",
            "dateStr": "13.05.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-05-15T22:00:00.000Z",
            "dateStr": "16.05.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-05-16T22:00:00.000Z",
            "dateStr": "17.05.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-05-19T22:00:00.000Z",
            "dateStr": "20.05.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-05-22T22:00:00.000Z",
            "dateStr": "23.05.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-05-23T22:00:00.000Z",
            "dateStr": "24.05.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-05-26T22:00:00.000Z",
            "dateStr": "27.05.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-05-30T22:00:00.000Z",
            "dateStr": "31.05.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-06-02T22:00:00.000Z",
            "dateStr": "03.06.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-06-05T22:00:00.000Z",
            "dateStr": "06.06.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-06-06T22:00:00.000Z",
            "dateStr": "07.06.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-06-09T22:00:00.000Z",
            "dateStr": "10.06.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-06-12T22:00:00.000Z",
            "dateStr": "13.06.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-06-13T22:00:00.000Z",
            "dateStr": "14.06.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-06-16T22:00:00.000Z",
            "dateStr": "17.06.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-06-19T22:00:00.000Z",
            "dateStr": "20.06.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-06-20T22:00:00.000Z",
            "dateStr": "21.06.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-06-23T22:00:00.000Z",
            "dateStr": "24.06.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-06-26T22:00:00.000Z",
            "dateStr": "27.06.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-06-27T22:00:00.000Z",
            "dateStr": "28.06.",
            "dayOfWeek": 6
        },
        {
            "date": "2025-06-30T22:00:00.000Z",
            "dateStr": "01.07.",
            "dayOfWeek": 2
        },
        {
            "date": "2025-07-03T22:00:00.000Z",
            "dateStr": "04.07.",
            "dayOfWeek": 5
        },
        {
            "date": "2025-07-04T22:00:00.000Z",
            "dateStr": "05.07.",
            "dayOfWeek": 6
        }
    ] as unknown as DateObject[];

    public constructor(
        public dialogRef: MatDialogRef<UploadDialogComponent>,
    ) {
    }

    public onFileSelected(files: FileList | null): void {
        if (files) {
            this.file = files.item(0);
        }
        this.upload();
    }

    public upload(): void {
        const fileReader: FileReader = new FileReader();
        fileReader.onloadend = (e) => {
            const fileString = fileReader.result as string;
            this.scheduleParameters = this.parseCsv(fileString);
            this.uploadState = UploadState.Uploaded;
        };
        fileReader.readAsText(this.file as Blob);
    }

    public generateDates(): void {
        console.log('startDate:', this.startDate);
        if (!this.startDate || !this.endDate) {
            return;
        }

        let currentDate = this.startDate;
        const dutyDays = [2, 5, 6];
        while (currentDate < this.endDate) {
            if (dutyDays.includes(getDay(currentDate))) {
                this.dates.push(new DateObject(currentDate))
            }
            currentDate = addDays(currentDate, 1);
        }
    }

    public removeDate(date: DateObject): void {
        const index = this.dates.indexOf(date, 0);
        this.dates.splice(index, 1);
    }

    protected parseCsv(content: string): ScheduleParameters {
        const startRow = 1;
        const availabilities: boolean[][] = [];
        const people: string[] = [];
        const minDutiesPerPerson: number[] = []
        const maxDutiesPerPerson: number[] = [];

        console.log('content:', content);

        let csvToRowArray = content.split("\n");
        // Remove empty last line
        csvToRowArray.pop()

        console.log('Loaded', csvToRowArray.length, 'rows');

        for (let i = startRow; i < csvToRowArray.length; i++) {
            let row = csvToRowArray[i].split(';');
            people.push(row[0]);
            minDutiesPerPerson.push(+row[6]);
            maxDutiesPerPerson.push(+row[7]);

            const diAvailable = (row[1] === 'x');
            const frAvailable = (row[2] === 'x');
            const saAvailable = (row[3] === 'x');
            console.log(row[0], 'di/fr/sa:', diAvailable, frAvailable, saAvailable);

            let exclusions: string[] = [];
            if (row[5].length > 0) {
                exclusions = row[5].split(',').map(d => d.trim());
            }
            this.checkExclusionFormat(exclusions);
            const availability: boolean[] = [];
            for (let date of this.dates) {
                const dayOfWeek = date.dayOfWeek;
                const dayAvailable = (dayOfWeek === 2 && diAvailable) || (dayOfWeek === 5 && frAvailable) || (dayOfWeek === 6 && saAvailable);
                availability.push(dayAvailable && !exclusions.includes(date.dateStr));
            }
            availabilities.push(availability);
        }
        console.log('dates:', this.dates);
        console.log('availabilities:', availabilities);

        return {availabilities, people, dates: this.dates.map(d => d.dateStr), minDutiesPerPerson, maxDutiesPerPerson};
    }

    private checkExclusionFormat(exclusions: string[]): void {
        exclusions.forEach(e => {
            if (e.length !== 6 || e.split('.').length !== 3) {
                console.error('Invalid date in exclusions:', e);
            }
        });
    }
}
