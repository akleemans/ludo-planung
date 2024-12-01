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
    public dates: DateObject[] = [];

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
