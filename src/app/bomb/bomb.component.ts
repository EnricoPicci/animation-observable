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
    this.subscription = merge(this.verticalMovement(), this.horizontalMovement())
    .subscribe(
      null,
      error => console.error('GAME OVER')
    );
    // combineLatest(this.velocity(1, 500, 0.5), this.frameInterval(100)).subscribe(console.log);
    // this.velocity(1, 500, 0.5).subscribe(console.log);
  }

  verticalMovement() {
    // VERSION 6 - increase velocity gradually
    return combineLatest(this.timeBetweenFrames(), this.velocity(0.5, 5, 0.0001)).pipe(
    // return combineLatest(this.frameInterval(10), this.velocity(0.5, 5, 0.0001)).pipe(
      map(this.percentageOfHeightPerSecondForVelocity()),
      map(this.height(400)),
      tap(positionY => this.bomb.nativeElement.style.top = positionY + 'px'),
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
      })
    );

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
    return  fromEvent(document, 'mousemove').pipe(
      tap((event: MouseEvent) => this.bomb.nativeElement.style.left = event.clientX + 'px'),
    );
  }

  timeBetweenFrames() {
    return defer(() => {
      const start = animationFrame.now();
      return interval(0, animationFrame).pipe(
        map(() => animationFrame.now() - start),
      );
    });
  }
  frameInterval(milliseconds: number) {
    return defer(() => {
      const start = animationFrame.now();
      return interval(milliseconds).pipe(
        map(index => index * milliseconds),
      );
    });
  }
  // how much to move vertically per second expressed as % of the height of the game
  percentageOfHeightPerSecond(velocity: number) {
    return timeIntervalMs => timeIntervalMs / 1000 * velocity;
  }
  percentageOfHeightPerSecondForVelocity() {
    return (timeIntervalMsAndVelocity: Array<number>) => {
      const timeIntervalMs = timeIntervalMsAndVelocity[0];
      const velocity = timeIntervalMsAndVelocity[1];
      return timeIntervalMs / 1000 * velocity;
    };
  }
  sawTooth(val: number, threashold: number) {
    return (Math.asin(Math.sin(val)) / (Math.PI / 2) + 1) * threashold;
  }
  height(totalHeight: number) {
    return distance => this.sawTooth(distance, totalHeight);
  }
  velocity(initialVelocity: number, intervalForIncrement: number, increment: number) {
    return of(initialVelocity).pipe(concat(interval(intervalForIncrement).pipe(
              map(index => initialVelocity + (index + 1) * increment),
              tap(velocity => {
                if (velocity > 3) {
                  throw(new Error());
                }
              })
            )));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
