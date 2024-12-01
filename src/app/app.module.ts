import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatTableModule} from '@angular/material/table';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppComponent} from './app.component';
import {UploadDialogComponent} from './upload-dialog/upload-dialog.component';
import {MatSelectModule} from "@angular/material/select";
import {HttpClientModule} from "@angular/common/http";
import {MatInputModule} from "@angular/material/input";
import {DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter} from "@angular/material/core";
import {MatDatepickerModule} from "@angular/material/datepicker";

export class CustomDateAdapter extends NativeDateAdapter {
    override getFirstDayOfWeek(): number {
        return 1;
    }
}

@NgModule({
    declarations: [
        AppComponent,
        UploadDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatRadioModule,
        FormsModule,
        MatSelectModule,
        HttpClientModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ],
    providers: [
        {provide: MAT_DATE_LOCALE, useValue: 'de-CH'},
        {provide: DateAdapter, useClass: CustomDateAdapter}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
