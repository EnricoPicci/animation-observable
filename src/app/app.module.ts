import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BombComponent } from './bomb/bomb.component';
import { CarComponent } from './car/car.component';


@NgModule({
  declarations: [
    AppComponent,
    BombComponent,
    CarComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
