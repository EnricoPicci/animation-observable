import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {ViewChild, ElementRef, Renderer2} from '@angular/core';

import { Subscription } from 'rxjs/Subscription'; // *
import {animationFrame} from 'rxjs/scheduler/animationFrame';
import { Observable } from 'rxjs/Observable'; // *
import { BehaviorSubject } from 'rxjs/BehaviorSubject'; // *
import { interval } from 'rxjs/observable/interval'; // *
import { defer } from 'rxjs/observable/defer';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { tap } from 'rxjs/operators'; // *
import { map } from 'rxjs/operators'; // *
import { switchMap } from 'rxjs/operators'; // *
import { share } from 'rxjs/operators'; // *
import { scan } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { throttleTime } from 'rxjs/operators';
import { distinctUntilChanged } from 'rxjs/operators';
import { take } from 'rxjs/operators'; // *

interface Dynamics { deltaSpace: number; acc: number; vel: number; } // *


const PLAYGROUND_HEIGHT = 600;
const PLAYGROUND_WIDTH = 500;

const ACCELERATION = 3;
const BRAKE_DECELERATION = 100; // *

// *
const VEL_0 = 10; // * // if velocity (in pix per second) is lower than this value it is considered 0 when braking


@Component({
  selector: 'app-car',
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css']
})
export class CarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('car') car: ElementRef;
  subscriptionX: Subscription;
  subscriptionY: Subscription;

  accXViewVal = 0; accXViewValSub: Subscription;
  velXViewVal = 0; velXViewValSub: Subscription;
  accYViewVal = 0; accYViewValSub: Subscription;
  velYViewVal = 0; velYViewValSub: Subscription;
  // cardirection = 0; cardirectionSub: Subscription;


  // +
  velocityX = 0;
  velocityY = 0;

  deltaSpaceObsX: Observable<Dynamics>;
  deltaSpaceObsY: Observable<Dynamics>;

  leftAccSub: Subscription;
  rightAccSub: Subscription;
  upAccSub: Subscription;
  downAccSub: Subscription;

  accelerateX = new BehaviorSubject<number>(0);
  accelerateY = new BehaviorSubject<number>(0);
  // +

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    // +
    this.deltaSpaceObsX = this.accelerateX.pipe(
      switchMap(acc => this.deltaSpace(acc, this.velocityX, this.timeBetweenFrames())),
      tap(data => this.velocityX = data.vel),
      share()
    );
    this.deltaSpaceObsY = this.accelerateY.pipe(
      switchMap(acc => this.deltaSpace(acc, this.velocityY, this.timeBetweenFrames())),
      tap(data => this.velocityY = data.vel),
      share()
    );
    // +

    this.accXViewValSub = this.accXView().subscribe(val => this.accXViewVal = val);
    this.velXViewValSub = this.velXView().subscribe(val => this.velXViewVal = val);
    this.accYViewValSub = this.accYView().subscribe(val => this.accYViewVal = val);
    this.velYViewValSub = this.velYView().subscribe(val => this.velYViewVal = val);
    // this.cardirectionSub = this.carDirectionView().subscribe(val => this.cardirection = val);
  }

  ngAfterViewInit() {
    this.subscriptionX = this.deltaSpaceObsX.pipe(
      map(data => data.deltaSpace),
      scan((space, one) => space + one),
      map(positionX => this.boundSpace(positionX, PLAYGROUND_WIDTH)),
      tap(newPositionX => this.car.nativeElement.style.left = newPositionX + 'px')
    ).subscribe();
    this.subscriptionY = this.deltaSpaceObsY.pipe(
      map(data => data.deltaSpace),
      scan((space, one) => space + one),
      map(positionX => this.boundSpace(positionX, PLAYGROUND_HEIGHT)),
      tap(newPositionY => this.car.nativeElement.style.top = newPositionY + 'px')
    ).subscribe();
    // this.deltaSpaceObsX.pipe(
    //   throttleTime(100),
    //   tap(console.log),
    //   tap(() => console.log(this.car.nativeElement.style.left))
    // ).subscribe();
  }

  ngOnDestroy() {
    this.subscriptionX.unsubscribe();
    this.subscriptionY.unsubscribe();
    this.accXViewValSub.unsubscribe();
    this.velXViewValSub.unsubscribe();
    this.accYViewValSub.unsubscribe();
    this.velYViewValSub.unsubscribe();
    // this.cardirectionSub.unsubscribe();
  }

  rightAcc() {
    this.rightAccSub = this.accelerate(this.accelerateX);
  }
  rightStopAcc() {
    this.accelerateX.next(0);
    this.rightAccSub.unsubscribe();
  }
  leftAcc() {
    this.leftAccSub = this.accelerate(this.accelerateX, false);
  }
  leftStopAcc() {
    this.accelerateX.next(0);
    this.leftAccSub.unsubscribe();
  }
  downAcc() {
    this.downAccSub = this.accelerate(this.accelerateY);
  }
  downStopAcc() {
    this.accelerateY.next(0);
    this.downAccSub.unsubscribe();
  }
  upAcc() {
    this.upAccSub = this.accelerate(this.accelerateY, false);
  }
  upStopAcc() {
    this.accelerateY.next(0);
    this.upAccSub.unsubscribe();
  }
  accelerate(accObs: BehaviorSubject<number>, positiveDirection = true) {
    const directionSign = positiveDirection ? 1 : -1;
    return interval(50).pipe(
      take(100),
      tap(acceleration => accObs.next(acceleration * directionSign))
    ).subscribe();
  }

  // +
  pedalUp() {
    this.accelerateX.next(0);
    this.accelerateY.next(0);
  }
  // +

  brake() {
    const directionX = this.velocityX > 0 ? -1 : 1;
    const directionY = this.velocityY > 0 ? -1 : 1;
    // this.accelerateX.next(BRAKE_DECELERATION * directionX);
    // this.accelerateY.next(BRAKE_DECELERATION * directionY);
    // const subX = this.deltaSpaceObsX.pipe(
    //   map(data => data.vel),
    //   filter(vel => Math.abs(vel) < VEL_0),
    //   tap(() => {
    //     this.accelerateX.next(0);
    //     console.log('velX', this.velocityX);
    //   })
    // )
    // .subscribe(
    //   () => subX.unsubscribe()
    // );
    // const subY = this.deltaSpaceObsY.pipe(
    //   map(data => data.vel),
    //   filter(vel => Math.abs(vel) < VEL_0),
    //   tap(() => {
    //     this.accelerateY.next(0);
    //     console.log('velY', this.velocityY);
    //   })
    // )
    // .subscribe(
    //   () => subY.unsubscribe()
    // );
    this.brakeAlongDirection(this.accelerateX, this.deltaSpaceObsX, directionX);
    this.brakeAlongDirection(this.accelerateY, this.deltaSpaceObsY, directionY);
  }
  brakeAlongDirection(accObs: BehaviorSubject<number>, deltaSpaceObs: Observable<Dynamics>, direction: number) {
    let continueDeceleration = true;
    interval(100).pipe(
      take(10),
      filter(() => continueDeceleration),
      tap(decelerationFactor => accObs.next(decelerationFactor * direction * BRAKE_DECELERATION)),
      switchMap(() => deltaSpaceObs.pipe(
        map(data => data.vel),
        filter(vel => Math.abs(vel) < VEL_0),
        tap(() => {
          continueDeceleration = false;
          accObs.next(0);
          console.log('velX', this.velocityX);
          console.log('velY', this.velocityY);
          this.velocityX = 0;
          this.velocityY = 0;
        }),
        take(1),
      ))
    ).subscribe();

    // accObs.next(BRAKE_DECELERATION * direction);
    // deltaSpaceObs.pipe(
    //   map(data => data.vel),
    //   filter(vel => Math.abs(vel) < VEL_0),
    //   tap(() => {
    //     accObs.next(0);
    //     console.log('velX', this.velocityX);
    //     console.log('velY', this.velocityY);
    //   }),
    //   // take(1)  // just to complete the Observable
    // )
    // .subscribe();
  }


  deltaSpace(acc: number, initialVelocity: number, timeFrames: Observable<number>) {
    let vel = initialVelocity;
    return timeFrames.pipe(
        map(deltaTime => {
            const seconds = deltaTime / 1000;
            vel = vel + seconds * acc;
            if (acc === 0 && Math.abs(vel) < VEL_0) {
              vel = 0;
            }
            return {deltaSpace: vel * seconds, acc, vel};
        })
    );
  }

  boundSpace(space: number, limit: number) {
    let validSpace = space % (limit * 2);
    validSpace = Math.abs(validSpace);
    if (validSpace > limit) {
      validSpace = limit - (validSpace - limit);
    }
    return validSpace;
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



  accXView() {
    return this.dynamicsView(this.deltaSpaceObsX, 'acc');
  }
  velXView() {
    return this.dynamicsView(this.deltaSpaceObsX, 'vel');
  }
  accYView() {
    return this.dynamicsView(this.deltaSpaceObsY, 'acc');
  }
  velYView() {
    return this.dynamicsView(this.deltaSpaceObsY, 'vel');
  }
  dynamicsView(deltaSpaceObs: Observable<Dynamics>, measure: string) {
    return deltaSpaceObs.pipe(
      throttleTime(1000),
      map(data => data[measure]),
      distinctUntilChanged(),
      map(data => data.toFixed(1)),
    );
  }
  // carDirectionView() {
  //   return combineLatest(this.velXView(), this.velYView()).pipe(
  //     map((vel) => Math.atan(vel[0] / vel[1]) * 180 / Math.PI)
  //   );
  // }

}
