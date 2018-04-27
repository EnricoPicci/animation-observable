import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {ViewChild, ElementRef, Renderer2} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import {animationFrame} from 'rxjs/scheduler/animationFrame';
import { interval } from 'rxjs/observable/interval';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { defer } from 'rxjs/observable/defer';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { merge } from 'rxjs/observable/merge';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { pairwise } from 'rxjs/operators';
import {distinctUntilChanged} from 'rxjs/operators';
import {filter} from 'rxjs/operators';
import {concat} from 'rxjs/operators';
import {share} from 'rxjs/operators';
import {throttleTime} from 'rxjs/operators';
import {windowWhen} from 'rxjs/operators';
import {mergeMap} from 'rxjs/operators';
import {scan} from 'rxjs/operators';
import {reduce} from 'rxjs/operators';
import {skip} from 'rxjs/operators';
import {switchMap} from 'rxjs/operators';

const PLAYGROUND_HEIGHT = 600;
const PLAYGROUND_WIDTH = 500;
const MAX_HORIZONTAL_SEGMENT_LENGTH = 100;
const VERTICAL_VELOCITY = 0.5;
const HORIZONTAL_VELOCITY = 1.2;

@Component({
  selector: 'app-bomb',
  templateUrl: './bomb.component.html',
  styleUrls: ['./bomb.component.css']
})
export class BombComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bomb') bomb: ElementRef;
  subscription: Subscription;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit() {
    this.subscription = merge(this.verticalMovement(), this.bombDirection(), this.horizontalMovement())
    .subscribe(
      null,
      error => console.error('GAME OVER')
    );
  }

  verticalMovement() {
    // VERSION 7 - share and focus only on vertical movement, while direction is managed as another Observable
    return combineLatest(this.timeFromStartOfAnimationFrames(), this.velocity(VERTICAL_VELOCITY, 5, 0.0001)).pipe(
    // return combineLatest(this.frameInterval(10), this.velocity(0.5, 5, 0.0001)).pipe(
      map(this.percentageOfDistance()),
      map(this.height(PLAYGROUND_HEIGHT)),
      tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
      share()
    );

    // // VERSION 6 - increase velocity gradually
    // return combineLatest(this.timeBetweenFrames(), this.velocity(0.5, 5, 0.0001)).pipe(
    // // return combineLatest(this.frameInterval(10), this.velocity(0.5, 5, 0.0001)).pipe(
    //   map(this.percentageOfHeightPerSecondForVelocity()),
    //   map(this.height(400)),
    //   tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
    //   pairwise(),
    //   filter(pair => pair[1] !== pair[0]),
    //   map(pair => {
    //     const positionBefore = pair['0'];
    //     const positionAfter = pair['1'];
    //     return positionAfter > positionBefore ? 'down' : 'up';
    //   }),
    //   distinctUntilChanged(),
    //   tap(direction => {
    //     if (direction === 'down') {
    //       this.renderer.addClass(this.bomb.nativeElement, 'rotate0');
    //       this.renderer.removeClass(this.bomb.nativeElement, 'rotate180');
    //     } else {
    //       this.renderer.removeClass(this.bomb.nativeElement, 'rotate0');
    //       this.renderer.addClass(this.bomb.nativeElement, 'rotate180');
    //     }
    //   })
    // );

    // // VERSION 5 - invert direction of the bomb
    // // return this.timeBetweenFrames().pipe(
    // return this.frameInterval(10).pipe(
    //   map(this.percentageOfHeightPerSecond(1)),
    //   map(this.height(250)),
    //   tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
    //   pairwise(),
    //   filter(pair => pair[1] !== pair[0]),
    //   map(pair => {
    //     const positionBefore = pair['0'];
    //     const positionAfter = pair['1'];
    //     return positionAfter > positionBefore ? 'down' : 'up';
    //   }),
    //   distinctUntilChanged(),
    //   tap(direction => {
    //     if (direction === 'down') {
    //       this.renderer.addClass(this.bomb.nativeElement, 'rotate0');
    //       this.renderer.removeClass(this.bomb.nativeElement, 'rotate180');
    //     } else {
    //       this.renderer.removeClass(this.bomb.nativeElement, 'rotate0');
    //       this.renderer.addClass(this.bomb.nativeElement, 'rotate180');
    //     }
    //   })
    // );

    // // VERSION 4 - saw tooth profile
    // return this.timeBetweenFrames().pipe(
    //   map(this.pixelsPerSecond(1)),
    //   map(distance => this.sawTooth(distance)),
    //   tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
    // );

    // // VERSION 3 - higher order functions
    // return this.timeBetweenFrames().pipe(
    //   map(this.pixelsPerSecond(100)),
    //   tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
    // );

    // // VERSION 2 - controllable velocity
    // const pixelsPerSecond = 50;
    // return this.timeBetweenFrames().pipe(
    //   map(timeIntervalMs => timeIntervalMs / 1000 * pixelsPerSecond),
    //   tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
    // );

    // // VERSION 1
    // return interval(0, animationFrame).pipe(
    //   map(i => i),
    //   tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
    //   // tap(data => console.log('X', data))
    // );
  }



  horizontalMovement() {
    let cumulatedTime: number;
    let horizontalSegmentLenght: number;
    let velocity: number;
    let startPosition: number;
    return combineLatest(this.cumulatedTimeAndHorizontalSpace(), this.velocity(HORIZONTAL_VELOCITY)).pipe(
      tap(d => {
        cumulatedTime = d[0].cumulatedTime;
        horizontalSegmentLenght = d[0].horizontalSegmentLenght;
        startPosition = d[0].startPosition;
        velocity = d[1];
      }),
      map(() => (cumulatedTime / 1000 * horizontalSegmentLenght * velocity) + startPosition),
      map(positionX => {
        let retPositionX = positionX;
        if (positionX < 0) {
          retPositionX = Math.abs(positionX);
        } else
        if (positionX > PLAYGROUND_WIDTH) {
          retPositionX = PLAYGROUND_WIDTH - (positionX - PLAYGROUND_WIDTH);
        }
        return retPositionX;
      }),
      tap(positionX => this.bomb.nativeElement.style.left = positionX + 'px')
    );
  }
  cumulatedTimeAndHorizontalSpace() {
    let startPosition;
    return this.bombDirection().pipe(
      // tslint:disable-next-line:radix
      tap(() => startPosition = parseInt(this.bomb.nativeElement.style.left)),
      map(() => this.horizontalSegmentLenght()),
      switchMap(horizontalSegmentLenght => this.timeBetweenFrames()
                                                  .pipe(
                                                    scan((acc, one) => acc + one, 0),
                                                    map(cumulatedTime => ({cumulatedTime, horizontalSegmentLenght, startPosition}))
                                                  )
      )
    );
  }
  // horizontalMovement() {
  //   return combineLatest(this.horizontalSegmentToCover(), this.horizontalPercentageOfDistanceToMove()).pipe(
  //     map(this.positionX()),
  //     tap(positionX => {
  //       this.bomb.nativeElement.style.left = positionX + 'px';
  //     }),
  //     // throttleTime(100),
  //     // tap(console.log)
  //   );
  // }
  // horizontalPercentageOfDistanceToMove() {
  //   return combineLatest(this.timeFromStartOfAnimationFrames(), this.velocity(1)).pipe(
  //   // return combineLatest(this.frameInterval(10), this.velocity(0.5)).pipe(
  //     map(this.percentageOfDistance())
  //   );
  // }
  // horizontalMovement() {
  //   return combineLatest(this.timeBetweenFrames(), this.velocity(1)).pipe(
  //   // return combineLatest(this.frameInterval(10), this.velocity(0.5)).pipe(
  //     map(this.percentageOfDistance()),
  //     // tslint:disable-next-line:radix
  //     map(this.width(40, parseInt(this.bomb.nativeElement.style.left))),
  //     tap(positionX => {
  //       this.bomb.nativeElement.style.left = positionX + 'px';
  //     })
  //   );
  // }
  // horizontalMovement() {
  //   return  fromEvent(document, 'mousemove').pipe(
  //     tap((event: MouseEvent) => this.bomb.nativeElement.style.left = event.clientX + 'px'),
  //   );
  // }
  bombDirection() {
    return this.verticalMovement().pipe(
      pairwise(),
      filter(pair => pair[1] !== pair[0]),
      map(pair => {
        const positionBefore = pair['0'];
        const positionAfter = pair['1'];
        return positionAfter > positionBefore ? 'down' : 'up';
      }),
      distinctUntilChanged(),
      tap(direction => {
        if (direction === 'down') {
          this.renderer.addClass(this.bomb.nativeElement, 'rotate0');
          this.renderer.removeClass(this.bomb.nativeElement, 'rotate180');
        } else {
          this.renderer.removeClass(this.bomb.nativeElement, 'rotate0');
          this.renderer.addClass(this.bomb.nativeElement, 'rotate180');
        }
      }),
      share()
    );
  }
  // emits a new length which we want to move horizontally any time the bomb changes direction
  // as well as the starting position
  // horizontalSegmentToCover() {
  //   return this.bombDirection().pipe(
  //     map(() => this.horizontalSegmentLenght()),
  //     // tslint:disable-next-line:radix
  //     map(segmentLength => ({segmentLength, startingPosition: parseInt(this.bomb.nativeElement.style.left)})),
  //     tap(d => console.log('Change', d))
  //   );
  // }
  horizontalSegmentLenght() {
    return this.randomIntInc(MAX_HORIZONTAL_SEGMENT_LENGTH * -1, MAX_HORIZONTAL_SEGMENT_LENGTH);
  }
  randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  }
  // positionX() {
  //   return (totalSpaceToCoverStartingPositionAndPercentage: Array<any>) => {
  //     let totalSpaceToCoverAndStartingPosition: {segmentLength: number, startingPosition: number};
  //     totalSpaceToCoverAndStartingPosition = totalSpaceToCoverStartingPositionAndPercentage[0];
  //     const totalSpaceToCover = totalSpaceToCoverAndStartingPosition.segmentLength;
  //     const startingPosition = totalSpaceToCoverAndStartingPosition.startingPosition;
  //     const percentageToCover: number = totalSpaceToCoverStartingPositionAndPercentage[1];
  //     return totalSpaceToCover * percentageToCover + startingPosition;
  //   };
  // }

  timeFromStartOfAnimationFrames() {
    return defer(() => {
      const start = animationFrame.now();
      return interval(0, animationFrame).pipe(
        map(() => animationFrame.now() - start),
        share()
      );
    });
  }
  frameInterval(milliseconds: number) {
    return defer(() => {
      return interval(milliseconds).pipe(
        map(index => index * milliseconds),
      );
    });
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
  // how much distance to move per second expressed as % of a given distance - depends on the velocity
  // given distance can be the height of the game for vertical movements or the widht of the horizontal movement
  // velocity is expressed as % of the given distance to be covered in 1 sec
  // velocity 1 means that the given distance will be covered in 1 sec
  // velocity 2 means that in 1 sec we cover 2 times the given distance
  percentageOfDistance() {
    return (timeIntervalMsAndVelocity: Array<number>) => {
      const timeIntervalMs = timeIntervalMsAndVelocity[0];
      const velocity = timeIntervalMsAndVelocity[1];
      // console.log('perc dist', timeIntervalMs / 1000 * velocity);
      return timeIntervalMs / 1000 * velocity;
    };
  }
  sawTooth(val: number, threashold: number) {
    return (Math.asin(Math.sin(val)) / (Math.PI / 2) + 1) / 2 * threashold;
  }
  height(totalHeight: number) {
    return percentageOfDistance => this.sawTooth(percentageOfDistance, totalHeight);
  }
  // width(totalWidth: number, startingPoint: number) {
  //   return percentageOfDistance => startingPoint + totalWidth * percentageOfDistance;
  // }
  // how much (percentage) of a certain distance covered in 1 second
  velocity(initialVelocity: number, intervalForIncrement = 0, increment = 0) {
    return of(initialVelocity).pipe(concat(interval(intervalForIncrement).pipe(
              map(index => initialVelocity + (index + 1) * increment),
              tap(velocity => {
                if (velocity > 1.2) {
                  throw(new Error());
                }
              })
            )));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
