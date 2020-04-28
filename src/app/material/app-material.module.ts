import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {ErrorStateMatcher, ShowOnDirtyErrorStateMatcher} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';

const modules = [
  MatInputModule,
  MatListModule,
  MatButtonModule,
  MatGridListModule,
  MatIconModule,
  MatCardModule,
  MatSelectModule,
  MatTableModule
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    modules,
  ], exports: [
    modules
  ],
  providers: [{provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}]
})
export class AppMaterialModule {
}
