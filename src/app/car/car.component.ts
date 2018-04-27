import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {ViewChild, ElementRef, Renderer2} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import {animationFrame} from 'rxjs/scheduler/animationFrame';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { interval } from 'rxjs/observable/interval';
import { defer } from 'rxjs/observable/defer';
import { tap, throttleTime } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { share } from 'rxjs/operators';
import { scan } from 'rxjs/operators';


const PLAYGROUND_HEIGHT = 600;
const PLAYGROUND_WIDTH = 500;

const POWER = 3;


@Component({
  selector: 'app-car',
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css']
})
export class CarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('car') car: ElementRef;
  subscriptionX: Subscription;
  subscriptionY: Subscription;

  accelerateX = new BehaviorSubject<number>(0);
  accelerateY = new BehaviorSubject<number>(0);

  velocityX = 0;
  deltaSpaceObsX: Observable<{ deltaSpace: number; acc: number; vel: number; }>;
  velocityY = 0;
  deltaSpaceObsY: Observable<number>;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit() {
    this.deltaSpaceObsX = this.accelerateX.pipe(
      switchMap(acc => this.deltaSpace(acc, this.velocityX, this.timeBetweenFrames())),
      tap(data => this.velocityX = data.vel),
      share()
    );
    this.deltaSpaceObsY = this.accelerateY.pipe(
      switchMap(acc => this.deltaSpace(acc, this.velocityY, this.timeBetweenFrames())),
      tap(data => this.velocityY = data.vel),
      map(data => data.deltaSpace),
      scan((space, one) => space + one),
      tap(newPositionY => this.car.nativeElement.style.top = newPositionY + 'px')
    );

    this.subscriptionX = this.deltaSpaceObsX.pipe(
      map(data => data.deltaSpace),
      scan((space, one) => space + one),
      tap(newPositionX => this.car.nativeElement.style.left = newPositionX + 'px')
    ).subscribe();
    // this.deltaSpaceObsX.pipe(
    //   throttleTime(100),
    //   tap(console.log),
    //   tap(() => console.log(this.car.nativeElement.style.left))
    // ).subscribe();

    this.subscriptionY = this.deltaSpaceObsY.subscribe();
  }

  ngOnDestroy() {
    this.subscriptionX.unsubscribe();
    this.subscriptionY.unsubscribe();
  }

  right() {
    this.accelerateX.next(POWER);
  }
  left() {
    this.accelerateX.next(POWER * -1);
  }
  up() {
    this.accelerateY.next(POWER);
  }
  down() {
    this.accelerateY.next(POWER * -1);
  }

  deltaSpace(acc: number, initialVelocity: number, timeFrames: Observable<number>) {
    let vel = initialVelocity;
    return timeFrames.pipe(
        map(deltaTime => {
            const seconds = deltaTime / 1000;
            vel = vel + seconds * acc;
            return {deltaSpace: vel * seconds, acc, vel};
        })
    );
  }

  timeBetweenFrames() {
    return defer(() => {
      let startOfPreviousFrame = animationFrame.now();
      let startOfThisFrame;
      return interval(0, animationFrame).pipe(
        tap(() => startOfThisFrame = animationFrame.now()),
        map(() => startOfThisFrame - startOfPreviousFrame),
        tap(() => startOfPreviousFrame = startOfThisFrame),
        share()
      );
    });
  }

}
